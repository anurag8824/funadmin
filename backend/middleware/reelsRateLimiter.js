/** Lightweight in-memory rate limiter — no extra dependency (SADD Phase 17). */

const buckets = new Map();

function pruneBuckets(now) {
  if (buckets.size < 5000) return;
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

function createRateLimiter({ windowMs = 60_000, max = 100, keyFn }) {
  return (req, res, next) => {
    const now = Date.now();
    pruneBuckets(now);
    const key = keyFn(req) || req.ip || "anonymous";
    let entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({
        status: false,
        message: "Too many requests. Please try again later.",
        code: "RATE_LIMITED",
      });
    }
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    next();
  };
}

const reelsFeedLimiter = createRateLimiter({
  windowMs: 60_000,
  max: parseInt(process.env.REELS_FEED_RATE_LIMIT || "120", 10),
  keyFn: (req) => `feed:${req.query.userId || req.ip}`,
});

const reelsUploadLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: parseInt(process.env.REELS_UPLOAD_RATE_LIMIT || "20", 10),
  keyFn: (req) => `upload:${req.query.userId || req.ip}`,
});

module.exports = {
  createRateLimiter,
  reelsFeedLimiter,
  reelsUploadLimiter,
};
