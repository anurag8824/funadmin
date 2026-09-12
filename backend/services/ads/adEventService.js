const mongoose = require("mongoose");
const AdEvent = require("../../models/adEvent.model");
const counters = require("./adCounterStore");

/**
 * Ingests ad beacons and watches traffic quality.
 *
 * The metric that matters is the ratio of requests to impressions. A client that asks for ads
 * it never shows is exactly the signal AdMob's invalid-traffic systems act on, so a user whose
 * ratio collapses is soft-blocked here before Google notices it.
 */

const MAX_BATCH = 50;

const VALID_EVENTS = new Set([
  "reserved",
  "gated",
  "requested",
  "filled",
  "nofill",
  "rendered",
  "viewable",
  "clicked",
  "expired",
  "disposed",
]);

const COUNTER_TTL_SECONDS = 60 * 60;

/** Below this many requests the ratios are noise, not signal. */
const MIN_SAMPLE_FOR_CHECKS = 20;

/** Requests that never became an impression at this rate look automated. */
const MIN_IMPRESSION_RATIO = 0.5;

/** Real human CTR on native inventory sits well under 10%. */
const MAX_PLAUSIBLE_CTR = 0.25;

/**
 * Requests still waiting on their impression beacon. Ratios are only judged once the shortfall
 * exceeds this, so a handful of in-flight slots can never look like a bot.
 */
const MAX_INFLIGHT_SLACK = 10;

const BLOCK_SECONDS = 24 * 60 * 60;

/**
 * Quality counters live in five-minute buckets and are only ever judged one bucket in arrears.
 *
 * Judging the live bucket is wrong: the client beacons `requested` as a slot enters the gate and
 * `rendered` once the creative paints, and a flush can land those in different batches. The live
 * bucket therefore always shows more requests than impressions, and a legitimate user scrolling
 * quickly looks exactly like a bot. A settled bucket has both halves.
 */
const BUCKET_SECONDS = 5 * 60;

function bucketStamp(offsetBuckets = 0) {
  const bucket = Math.floor(Date.now() / (BUCKET_SECONDS * 1000)) + offsetBuckets;
  return String(bucket);
}

function qualityKey(userId, metric, offsetBuckets = 0) {
  return `ads:q:${userId}:${bucketStamp(offsetBuckets)}:${metric}`;
}

function toObjectId(value) {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
}

function sanitizeEvent(raw, context) {
  if (!raw || typeof raw !== "object") return null;
  const event = String(raw.event || "").trim();
  if (!VALID_EVENTS.has(event)) return null;

  const ts = Number(raw.ts);
  return {
    userId: context.userObjectId,
    planId: raw.planId ? String(raw.planId).slice(0, 64) : "",
    slotId: raw.slotId ? String(raw.slotId).slice(0, 128) : "",
    surface: raw.surface ? String(raw.surface).slice(0, 32) : "",
    event,
    source: raw.source === "house" ? "house" : "network",
    campaignId: toObjectId(raw.campaignId),
    creativeId: toObjectId(raw.creativeId),
    ts: Number.isFinite(ts) && ts > 0 ? ts : Date.now(),
    dwellMs: Number.isFinite(Number(raw.dwellMs)) ? Math.max(0, Number(raw.dwellMs)) : 0,
    appVersion: context.appVersion,
    platform: context.platform,
  };
}

/**
 * Judges the previous, settled bucket and soft-blocks a user whose traffic stops looking human.
 * A block only stops ad plans — it never affects content.
 */
async function evaluateTrafficQuality(userId) {
  if (await counters.isUserBlocked(userId)) return { blocked: true, reason: "already_blocked" };

  const requestedKey = qualityKey(userId, "requested", -1);
  const renderedKey = qualityKey(userId, "rendered", -1);
  const clickedKey = qualityKey(userId, "clicked", -1);

  const values = await counters.readMany([requestedKey, renderedKey, clickedKey]);
  const requested = values[requestedKey] || 0;
  const rendered = values[renderedKey] || 0;
  const clicked = values[clickedKey] || 0;

  if (requested < MIN_SAMPLE_FOR_CHECKS) return { blocked: false };

  const impressionRatio = rendered / requested;
  const shortfall = requested - rendered;
  if (impressionRatio < MIN_IMPRESSION_RATIO && shortfall > MAX_INFLIGHT_SLACK) {
    await counters.blockUser(userId, BLOCK_SECONDS);
    console.warn(
      `[ADS_IVT] user ${userId} blocked — impression ratio ${impressionRatio.toFixed(2)} ` +
        `(${rendered}/${requested})`,
    );
    return { blocked: true, reason: "low_impression_ratio" };
  }

  if (rendered >= MIN_SAMPLE_FOR_CHECKS) {
    const ctr = clicked / rendered;
    if (ctr > MAX_PLAUSIBLE_CTR) {
      await counters.blockUser(userId, BLOCK_SECONDS);
      console.warn(`[ADS_IVT] user ${userId} blocked — implausible CTR ${ctr.toFixed(2)}`);
      return { blocked: true, reason: "implausible_ctr" };
    }
  }

  return { blocked: false };
}

/**
 * @returns {{status: number, body: object}}
 */
async function ingestBatch({ userId, events, platform = "", appVersion = "" }) {
  if (!Array.isArray(events) || events.length === 0) {
    return { status: 400, body: { status: false, message: "events must be a non-empty array" } };
  }
  if (events.length > MAX_BATCH) {
    return { status: 400, body: { status: false, message: `events exceeds ${MAX_BATCH} per batch` } };
  }

  const context = {
    userObjectId: toObjectId(userId),
    platform: String(platform).slice(0, 32),
    appVersion: String(appVersion).slice(0, 32),
  };

  const documents = events.map((raw) => sanitizeEvent(raw, context)).filter(Boolean);
  if (!documents.length) {
    return { status: 400, body: { status: false, message: "no valid events in batch" } };
  }

  // Beacons are fire-and-forget: a write failure must never fail the client's request.
  try {
    await AdEvent.insertMany(documents, { ordered: false });
  } catch (err) {
    console.warn("[ADS_EVENTS] insert failed:", err.message);
  }

  const tally = {};
  documents.forEach((doc) => {
    tally[doc.event] = (tally[doc.event] || 0) + 1;
  });

  let quality = { blocked: false };
  if (userId) {
    const trackedMetrics = ["requested", "rendered", "viewable", "clicked", "gated", "nofill"];
    await counters.incrementMany(
      trackedMetrics
        .filter((metric) => tally[metric])
        .map((metric) => ({
          key: qualityKey(userId, metric),
          by: tally[metric],
          ttlSeconds: COUNTER_TTL_SECONDS,
        })),
    );

    if (tally.rendered || tally.clicked || tally.requested) {
      quality = await evaluateTrafficQuality(userId);
    }
  }

  return {
    status: 200,
    body: {
      status: true,
      message: "Success",
      data: { accepted: documents.length, rejected: events.length - documents.length, ...quality },
    },
  };
}

/** Surface-level rollup for the admin dashboard. */
async function readSurfaceStats({ sinceMs = Date.now() - 24 * 60 * 60 * 1000 } = {}) {
  const rows = await AdEvent.aggregate([
    { $match: { createdAt: { $gte: new Date(sinceMs) } } },
    { $group: { _id: { surface: "$surface", event: "$event" }, count: { $sum: 1 } } },
  ]);

  const bySurface = {};
  rows.forEach((row) => {
    const surface = row._id.surface || "unknown";
    if (!bySurface[surface]) bySurface[surface] = {};
    bySurface[surface][row._id.event] = row.count;
  });

  return Object.entries(bySurface).map(([surface, events]) => {
    const requested = events.requested || 0;
    const rendered = events.rendered || 0;
    const viewable = events.viewable || 0;
    const filled = events.filled || 0;
    return {
      surface,
      events,
      fillRate: requested ? Number((filled / requested).toFixed(3)) : 0,
      impressionRatio: requested ? Number((rendered / requested).toFixed(3)) : 0,
      viewabilityRate: rendered ? Number((viewable / rendered).toFixed(3)) : 0,
    };
  });
}

module.exports = { ingestBatch, readSurfaceStats, MAX_BATCH };
