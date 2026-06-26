/** Scalability tunables (SADD Phase 15). Override via environment variables. */
const scalingConfig = {
  feedCacheTtlMs: parseInt(process.env.REELS_FEED_CACHE_TTL_MS || "90000", 10),
  feedCacheMaxLocalEntries: parseInt(process.env.REELS_FEED_CACHE_MAX_ENTRIES || "500", 10),
  trendingCacheTtlMs: parseInt(process.env.REELS_TRENDING_CACHE_TTL_MS || "300000", 10),
  feedPageMaxLimit: parseInt(process.env.REELS_FEED_MAX_LIMIT || "50", 10),
  analyticsBatchMax: parseInt(process.env.REELS_ANALYTICS_BATCH_MAX || "50", 10),
};

module.exports = scalingConfig;
