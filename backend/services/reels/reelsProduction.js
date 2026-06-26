/**
 * Production blueprint registry (SADD Phase 20).
 * Single source of truth for reels subsystem configuration.
 */
const scalingConfig = require("./scalingConfig");

const reelsProduction = {
  version: "1.0.0",
  phases: {
    feed: "ReelsFeedManager + feedService + feedCache",
    streaming: "HLS ABR + ReelStreamingPolicy",
    cache: "Room + ExoPlayer SimpleCache + thumbnail LRU",
    upload: "videoUpload.service + BullMQ transcode",
    analytics: "batch outbox + reelAnalytics.service",
    reliability: "circuit breaker + trending fallback",
    security: "signed playback URLs + rate limits",
    monitoring: "reelsMetrics + /health + x-request-id",
    cost: "cdnCachePolicy + tier ABR caps",
  },
  scaling: scalingConfig,
  flags: {
    asyncProcessing: String(process.env.REELS_ASYNC_PROCESSING || "false").toLowerCase() === "true",
    signPlayback: Boolean(String(process.env.REELS_SIGN_PLAYBACK_SECRET || "").trim()),
    redisConfigured: Boolean(process.env.REDIS_URL),
  },
};

module.exports = reelsProduction;
