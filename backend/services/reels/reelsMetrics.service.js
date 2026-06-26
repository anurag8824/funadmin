/** In-process reels metrics (SADD Phase 18). Swap for Prometheus in production. */

const counters = {
  feedRequests: 0,
  feedCacheHits: 0,
  feedErrors: 0,
  trendingFallbacks: 0,
  uploadRequests: 0,
  uploadFailures: 0,
  playbackRequests: 0,
  analyticsBatches: 0,
};

const latency = {
  feedMs: [],
  maxSamples: 200,
};

function recordFeedRequest({ fromCache = false, durationMs = 0, error = false, fallback = false } = {}) {
  counters.feedRequests += 1;
  if (fromCache) counters.feedCacheHits += 1;
  if (error) counters.feedErrors += 1;
  if (fallback) counters.trendingFallbacks += 1;
  if (durationMs > 0) {
    latency.feedMs.push(durationMs);
    if (latency.feedMs.length > latency.maxSamples) latency.feedMs.shift();
  }
}

function recordUpload({ failed = false } = {}) {
  counters.uploadRequests += 1;
  if (failed) counters.uploadFailures += 1;
}

function recordPlaybackRequest() {
  counters.playbackRequests += 1;
}

function recordAnalyticsBatch() {
  counters.analyticsBatches += 1;
}

function percentile(samples, p) {
  if (!samples.length) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function getMetricsSnapshot() {
  const feedSamples = latency.feedMs;
  return {
    counters: { ...counters },
    feedCacheHitRatio:
      counters.feedRequests > 0 ? Number((counters.feedCacheHits / counters.feedRequests).toFixed(4)) : 0,
    feedLatencyMs: {
      p50: percentile(feedSamples, 50),
      p95: percentile(feedSamples, 95),
      samples: feedSamples.length,
    },
    ts: Date.now(),
  };
}

module.exports = {
  recordFeedRequest,
  recordUpload,
  recordPlaybackRequest,
  recordAnalyticsBatch,
  getMetricsSnapshot,
};
