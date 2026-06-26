/**
 * In-memory feed page cache (SADD Phase 4 — server feed cache).
 * Uses Redis when REDIS_URL is set; falls back to process-local LRU.
 */
const scalingConfig = require("./scalingConfig");

const MAX_LOCAL_ENTRIES = scalingConfig.feedCacheMaxLocalEntries;
const DEFAULT_TTL_MS = scalingConfig.feedCacheTtlMs;

const localCache = new Map();

let redisClient = null;
let redisReady = false;

async function initRedis() {
  if (redisClient || !process.env.REDIS_URL) return;
  try {
    const { createClient } = require("redis");
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", (err) => console.warn("[REELS_FEED_CACHE] redis error", err.message));
    await redisClient.connect();
    redisReady = true;
    console.log("[REELS_FEED_CACHE] Redis connected");
  } catch (err) {
    console.warn("[REELS_FEED_CACHE] Redis unavailable, using in-memory cache:", err.message);
    redisClient = null;
    redisReady = false;
  }
}

void initRedis();

function buildCacheKey(userId, cursorCreatedAt, cursorId, limit, videoId) {
  const cursorPart = cursorCreatedAt && cursorId ? `${cursorCreatedAt}:${cursorId}` : "head";
  const videoPart = videoId || "feed";
  return `reels:feed:${userId}:${videoPart}:${cursorPart}:${limit}`;
}

function pruneLocalCache() {
  if (localCache.size <= MAX_LOCAL_ENTRIES) return;
  const oldest = [...localCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  const removeCount = localCache.size - MAX_LOCAL_ENTRIES;
  for (let i = 0; i < removeCount; i++) {
    localCache.delete(oldest[i][0]);
  }
}

async function get(key) {
  if (redisReady && redisClient) {
    try {
      const raw = await redisClient.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      /* fall through */
    }
  }
  const entry = localCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    localCache.delete(key);
    return null;
  }
  return entry.payload;
}

async function set(key, payload, ttlMs = DEFAULT_TTL_MS) {
  const serialized = JSON.stringify(payload);
  if (redisReady && redisClient) {
    try {
      await redisClient.setEx(key, Math.ceil(ttlMs / 1000), serialized);
      return;
    } catch (_) {
      /* fall through */
    }
  }
  localCache.set(key, { payload, expiresAt: Date.now() + ttlMs });
  pruneLocalCache();
}

async function getCachedFeedPage(params) {
  const key = buildCacheKey(
    params.userId,
    params.cursorCreatedAt,
    params.cursorId,
    params.limit,
    params.videoId,
  );
  return get(key);
}

async function setCachedFeedPage(params, payload, ttlMs = DEFAULT_TTL_MS) {
  if (params.videoId) return;
  const key = buildCacheKey(
    params.userId,
    params.cursorCreatedAt,
    params.cursorId,
    params.limit,
    params.videoId,
  );
  await set(key, payload, ttlMs);
}

function isRedisReady() {
  return redisReady;
}

module.exports = {
  getCachedFeedPage,
  setCachedFeedPage,
  buildCacheKey,
  getByKey: get,
  setByKey: set,
  isRedisReady,
};
