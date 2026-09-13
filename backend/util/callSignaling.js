/**
 * 1:1 audio call signaling relay.
 *
 * Transport and addressing deliberately mirror the chat relay in socket.js: every client joins
 * `globalRoom:<userId>` on connect, and we relay by emitting into the peer's room. No new
 * transport, no new connection — calls ride the socket the chat already keeps open.
 *
 * The server is a dumb relay plus a bookkeeper: it forwards SDP/ICE untouched, keeps the
 * AudioCall record's status in sync, and pushes FCM when the callee has no live socket (the
 * app tears its socket down while backgrounded, so that is the common case, not an edge case).
 */

const mongoose = require("mongoose");
const AudioCall = require("../models/audioCall.model");
const User = require("../models/user.model");
const admin = require("./privateKey");

const CALL_STATUS = AudioCall.CALL_STATUS;

/** Hang-up reasons the clients exchange. Kept as strings so logs stay readable. */
const END_REASON = {
  REJECTED: "rejected",
  ENDED: "ended",
  BUSY: "busy",
  MISSED: "missed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

const REASON_TO_STATUS = {
  [END_REASON.REJECTED]: CALL_STATUS.REJECTED,
  [END_REASON.ENDED]: CALL_STATUS.ENDED,
  [END_REASON.BUSY]: CALL_STATUS.REJECTED,
  [END_REASON.MISSED]: CALL_STATUS.MISSED,
  [END_REASON.FAILED]: CALL_STATUS.ENDED,
  [END_REASON.CANCELLED]: CALL_STATUS.MISSED,
};

/**
 * callId -> { callerId, receiverId, startedAt, endedAt }
 *
 * Guards against duplicate invites and lets a socket drop end the call the user was actually in.
 * In-memory on purpose: a restarted process has no live sockets either, so both sides will have
 * already failed over to their own timeouts.
 */
const activeCalls = new Map();

/** Calls never live longer than this in the map, so a lost hang-up cannot leak an entry forever. */
const STALE_CALL_MS = 2 * 60 * 60 * 1000;

function sweepStaleCalls() {
  const cutoff = Date.now() - STALE_CALL_MS;
  for (const [callId, call] of activeCalls) {
    if (call.startedAt < cutoff) activeCalls.delete(callId);
  }
}

function parsePayload(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[call] unparseable payload", err?.message);
    return null;
  }
}

function roomOf(userId) {
  return `globalRoom:${userId}`;
}

async function hasLiveSocket(io, userId) {
  try {
    const sockets = await io.in(roomOf(userId)).fetchSockets();
    return (sockets?.length || 0) > 0;
  } catch (err) {
    console.warn("[call] fetchSockets failed", err?.message);
    return false;
  }
}

function findActiveCallFor(userId) {
  for (const [callId, call] of activeCalls) {
    if (call.callerId === userId || call.receiverId === userId) return { callId, ...call };
  }
  return null;
}

async function setCallStatus(callId, status, extra = {}) {
  try {
    const call = await AudioCall.findOne({ callId });
    if (!call) return null;

    const update = { status, ...extra };

    if (status === CALL_STATUS.ACCEPTED && !call.startedAt) {
      update.startedAt = new Date();
    }

    if ([CALL_STATUS.REJECTED, CALL_STATUS.ENDED, CALL_STATUS.MISSED].includes(status)) {
      update.endedAt = new Date();
      if (call.startedAt) {
        update.duration = Math.max(0, Math.floor((Date.now() - call.startedAt.getTime()) / 1000));
      }
    }

    await AudioCall.findByIdAndUpdate(call._id, { $set: update });
    return update;
  } catch (err) {
    console.error("[call] setCallStatus failed", err?.message);
    return null;
  }
}

/**
 * Wakes a callee whose socket is gone. Data-only and high priority so the app can surface the
 * incoming call itself rather than letting the system render a plain notification.
 */
async function pushIncomingCall({ callId, callerId, callerName, callerImage, receiverId }) {
  try {
    const receiver = await User.findById(receiverId).select("_id fcmToken").lean();
    const token = receiver?.fcmToken;
    if (!token) {
      console.log("[call] no fcmToken for receiver", receiverId);
      return false;
    }

    const adminPromise = await admin;
    await adminPromise.messaging().send({
      token,
      data: {
        type: "INCOMING_CALL",
        callId: String(callId),
        callerId: String(callerId),
        callerName: String(callerName || ""),
        callerImage: String(callerImage || ""),
      },
      android: {
        priority: "high",
        ttl: 45 * 1000,
      },
      apns: {
        headers: { "apns-priority": "10", "apns-push-type": "alert" },
        payload: { aps: { alert: { title: "Incoming call", body: `${callerName || "Someone"} is calling` }, sound: "default" } },
      },
    });
    return true;
  } catch (err) {
    console.error("[call] FCM push failed", err?.message);
    return false;
  }
}

/**
 * Registers the call handlers on one connected socket.
 * @param {import("socket.io").Server} io
 * @param {import("socket.io").Socket} socket
 * @param {string} userId id parsed from the globalRoom handshake query
 */
function registerCallSignaling(io, socket, userId) {
  if (!userId) return;

  /** Caller offers a call. Payload carries the SDP offer so setup is one round trip. */
  socket.on("callInvite", async (raw) => {
    sweepStaleCalls();
    const data = parsePayload(raw);
    if (!data) return;

    const { callId, receiverId, sdp, callerName, callerImage } = data;
    const callerId = String(data.callerId || userId);

    if (!callId || !receiverId || !sdp) {
      socket.emit("callEnded", { callId: callId || null, reason: END_REASON.FAILED, by: "server" });
      return;
    }

    if (String(receiverId) === callerId) {
      socket.emit("callEnded", { callId, reason: END_REASON.FAILED, by: "server" });
      return;
    }

    // Duplicate / concurrent call guard. A retry of the same callId is idempotent; anything else
    // while either party is busy is refused so two sessions can never race for one peer.
    const existing = activeCalls.get(callId);
    if (!existing) {
      const callerBusy = findActiveCallFor(callerId);
      const receiverBusy = findActiveCallFor(String(receiverId));
      if (callerBusy || receiverBusy) {
        socket.emit("callEnded", { callId, reason: END_REASON.BUSY, by: "server" });
        return;
      }
      activeCalls.set(callId, {
        callerId,
        receiverId: String(receiverId),
        startedAt: Date.now(),
      });
    }

    await setCallStatus(callId, CALL_STATUS.RINGING);

    const online = await hasLiveSocket(io, receiverId);

    io.in(roomOf(receiverId)).emit("callIncoming", {
      callId,
      callerId,
      callerName: callerName || "",
      callerImage: callerImage || "",
      sdp,
    });

    if (!online) {
      const pushed = await pushIncomingCall({
        callId,
        callerId,
        callerName,
        callerImage,
        receiverId,
      });
      if (!pushed) {
        // Nothing can reach the callee: fail fast instead of letting the caller ring out.
        activeCalls.delete(callId);
        await setCallStatus(callId, CALL_STATUS.MISSED);
        socket.emit("callEnded", { callId, reason: END_REASON.MISSED, by: "server" });
        return;
      }
    }

    // Tells the caller the invite is on its way to a device, so it can move CALLING -> RINGING.
    socket.emit("callRinging", { callId, online });
  });

  /** Callee accepted and is returning its SDP answer. */
  socket.on("callAnswer", async (raw) => {
    const data = parsePayload(raw);
    if (!data) return;

    const { callId, toUserId, sdp } = data;
    if (!callId || !toUserId || !sdp) return;

    const call = activeCalls.get(callId);
    if (!call) {
      // Caller already gave up; tell the callee so it does not sit in CONNECTING.
      socket.emit("callEnded", { callId, reason: END_REASON.CANCELLED, by: "server" });
      return;
    }

    await setCallStatus(callId, CALL_STATUS.ACCEPTED);
    io.in(roomOf(toUserId)).emit("callAnswered", { callId, sdp });
  });

  /** Trickle ICE, relayed untouched in both directions. */
  socket.on("callIceCandidate", (raw) => {
    const data = parsePayload(raw);
    if (!data) return;

    const { callId, toUserId, candidate, sdpMid, sdpMLineIndex } = data;
    if (!callId || !toUserId || !candidate) return;
    if (!activeCalls.has(callId)) return;

    io.in(roomOf(toUserId)).emit("callIceCandidate", {
      callId,
      candidate,
      sdpMid: sdpMid ?? null,
      sdpMLineIndex: sdpMLineIndex ?? 0,
    });
  });

  /** Either party ending: decline, cancel, normal hang-up, or a local failure. */
  socket.on("callEnd", async (raw) => {
    const data = parsePayload(raw);
    if (!data) return;

    const { callId, toUserId } = data;
    if (!callId) return;

    const reason = END_REASON[String(data.reason || "").toUpperCase()] || END_REASON.ENDED;
    const call = activeCalls.get(callId);
    activeCalls.delete(callId);

    await setCallStatus(callId, REASON_TO_STATUS[reason] ?? CALL_STATUS.ENDED);

    const peerId = toUserId || (call && (call.callerId === userId ? call.receiverId : call.callerId));
    if (peerId) {
      io.in(roomOf(peerId)).emit("callEnded", { callId, reason, by: userId });
    }
  });

  /**
   * A dropped socket is indistinguishable from a crash, so end whatever call this user was in
   * rather than leaving the peer ringing against a device that is gone.
   */
  socket.on("disconnect", async () => {
    const active = findActiveCallFor(userId);
    if (!active) return;

    // The user may just be roaming between networks; only end the call if no socket of theirs
    // remains in the room.
    const stillOnline = await hasLiveSocket(io, userId);
    if (stillOnline) return;

    activeCalls.delete(active.callId);
    await setCallStatus(active.callId, CALL_STATUS.ENDED);

    const peerId = active.callerId === userId ? active.receiverId : active.callerId;
    io.in(roomOf(peerId)).emit("callEnded", {
      callId: active.callId,
      reason: END_REASON.FAILED,
      by: userId,
    });
  });
}

module.exports = { registerCallSignaling, END_REASON, activeCalls };
