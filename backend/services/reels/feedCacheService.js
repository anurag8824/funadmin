/**
 * In-memory feed page cache (SADD Phase 4 — server feed cache).
 * Uses Redis when REDIS_URL is set and the redis package is available; falls back to LRU.
 */
function loadScalingConfig() {
  try {
    return require("./scalingConfig");
  } catch (_) {
    return {
      feedCacheTtlMs: parseInt(process.env.REELS_FEED_CACHE_TTL_MS || "90000", 10),
      feedCacheMaxLocalEntries: parseInt(process.env.REELS_FEED_CACHE_MAX_ENTRIES || "500", 10),
    };
  }
}

const scalingConfig = loadScalingConfig();
const MAX_LOCAL_ENTRIES = scalingConfig.feedCacheMaxLocalEntries || 500;
const DEFAULT_TTL_MS = scalingConfig.feedCacheTtlMs || 90_000;
const REDIS_OP_TIMEOUT_MS = 2_000;

const localCache = new Map();

let redisClient = null;
let redisReady = false;
let redisInitAttempted = false;

async function initRedis() {
  if (redisInitAttempted || !process.env.REDIS_URL) return;
  redisInitAttempted = true;

  let createClient;
  try {
    ({ createClient } = require("redis"));
  } catch (err) {
    console.warn("[REELS_FEED_CACHE] redis package not installed, using in-memory cache:", err.message);
    return;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5_000,
        reconnectStrategy: () => false,
      },
    });
    redisClient.on("error", (err) => {
      console.warn("[REELS_FEED_CACHE] redis error", err.message);
      redisReady = false;
    });

    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis connect timeout")), 5_000),
      ),
    ]);
    redisReady = true;
    console.log("[REELS_FEED_CACHE] Redis connected");
  } catch (err) {
    console.warn("[REELS_FEED_CACHE] Redis unavailable, using in-memory cache:", err.message);
    try {
      if (redisClient) await redisClient.quit();
    } catch (_) {
      /* ignore */
    }
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

async function redisGet(key) {
  if (!redisReady || !redisClient) return null;
  try {
    return await Promise.race([
      redisClient.get(key),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis get timeout")), REDIS_OP_TIMEOUT_MS),
      ),
    ]);
  } catch (err) {
    console.warn("[REELS_FEED_CACHE] redis get failed:", err.message);
    redisReady = false;
    return null;
  }
}

async function redisSetEx(key, ttlSeconds, serialized) {
  if (!redisReady || !redisClient) return false;
  try {
    await Promise.race([
      redisClient.setEx(key, ttlSeconds, serialized),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis set timeout")), REDIS_OP_TIMEOUT_MS),
      ),
    ]);
    return true;
  } catch (err) {
    console.warn("[REELS_FEED_CACHE] redis set failed:", err.message);
    redisReady = false;
    return false;
  }
}

async function get(key) {
  const raw = await redisGet(key);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
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
  const stored = await redisSetEx(key, Math.ceil(ttlMs / 1000), serialized);
  if (stored) return;

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
