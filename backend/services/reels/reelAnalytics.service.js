const mongoose = require("mongoose");
const ReelAnalyticsEvent = require("../../models/reelAnalyticsEvent.model");
const WatchHistory = require("../../models/watchHistory.model");
const User = require("../../models/user.model");
const Video = require("../../models/video.model");
const { recordAnalyticsBatch } = require("./reelsMetrics.service");

const VIEW_EVENT_TYPES = new Set(["video_view", "video_complete"]);

async function ensureWatchHistory(userId, videoId, videoUserId) {
  const existing = await WatchHistory.findOne({ userId, videoId }).lean();
  if (existing) return;
  await WatchHistory.create({
    userId,
    videoId,
    videoUserId,
  });
}

/**
 * Ingest batched reel analytics events (SADD Phase 14).
 */
async function ingestBatch({ userId, events }) {
  if (!userId) {
    return { ok: false, status: 200, body: { status: false, message: "userId is required." } };
  }
  if (!Array.isArray(events) || events.length === 0) {
    return { ok: false, status: 200, body: { status: false, message: "events array is required." } };
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userObjectId).select("_id isBlock").lean();
  if (!user) {
    return { ok: false, status: 200, body: { status: false, message: "User does not found." } };
  }
  if (user.isBlock) {
    return { ok: false, status: 200, body: { status: false, message: "you are blocked by the admin." } };
  }

  const capped = events.slice(0, 50);
  const docs = [];
  const viewVideoIds = new Set();

  for (const raw of capped) {
    const type = String(raw?.type || "").trim();
    const videoId = raw?.videoId;
    if (!type || !videoId || !mongoose.Types.ObjectId.isValid(videoId)) continue;

    if (VIEW_EVENT_TYPES.has(type)) {
      viewVideoIds.add(String(videoId));
    }

    docs.push({
      userId: userObjectId,
      videoId: new mongoose.Types.ObjectId(videoId),
      type,
      ts: Number(raw?.ts) || Date.now(),
      properties: raw?.properties || {},
    });
  }

  if (docs.length > 0) {
    await ReelAnalyticsEvent.insertMany(docs, { ordered: false });
  }

  recordAnalyticsBatch();

  if (viewVideoIds.size > 0) {
    const videos = await Video.find({ _id: { $in: [...viewVideoIds] } })
      .select("_id userId")
      .lean();
    await Promise.all(
      videos.map((video) => ensureWatchHistory(userObjectId, video._id, video.userId)),
    );
  }

  return {
    ok: true,
    status: 200,
    body: {
      status: true,
      message: "Reel analytics batch accepted.",
      accepted: docs.length,
    },
  };
}

module.exports = {
  ingestBatch,
};
