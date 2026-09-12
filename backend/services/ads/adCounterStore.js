/**
 * Frequency caps and campaign pacing counters.
 *
 * Redis when REDIS_URL is set, an in-process Map otherwise. Degrading to the Map means caps
 * become per-instance rather than global, which over-delivers slightly — the deliberate
 * trade against the alternative of serving no ads at all when Redis is down.
 *
 * Every key carries a TTL. Nothing here is durable, and nothing here is a source of truth.
 */

const DAY_TTL_SECONDS = 36 * 60 * 60;
const CAMPAIGN_TTL_SECONDS = 24 * 60 * 60;
const LAST_AD_TTL_SECONDS = 60 * 60;
const PACE_TTL_SECONDS = 2 * 60 * 60;
const REDIS_OP_TIMEOUT_MS = 1_000;

let redisClient = null;
let redisReady = false;
let redisInitAttempted = false;

/** key -> { value, expiresAtMs } */
const localStore = new Map();

function nowMs() {
  return Date.now();
}

function dayStamp(date = new Date()) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function hourStamp(date = new Date()) {
  return `${dayStamp(date)}${String(date.getUTCHours()).padStart(2, "0")}`;
}

const keys = {
  dailyCap: (userId) => `ads:cap:day:${userId}:${dayStamp()}`,
  campaignCap: (userId, campaignId) => `ads:cap:camp:${userId}:${campaignId}`,
  lastAd: (userId) => `ads:last:${userId}`,
  campaignPace: (campaignId) => `ads:pace:${campaignId}:${hourStamp()}`,
  campaignTotal: (campaignId) => `ads:total:${campaignId}`,
  kill: (surface) => `ads:kill:${surface}`,
};

async function initRedis() {
  if (redisInitAttempted || !process.env.REDIS_URL) return;
  redisInitAttempted = true;

  let createClient;
  try {
    ({ createClient } = require("redis"));
  } catch (err) {
    console.warn("[ADS_COUNTERS] redis package not installed, using in-memory counters:", err.message);
    return;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5_000,
        // Give up after a few tries instead of reconnecting forever. With no Redis running, an
        // endless strategy reconnects every few seconds for the life of the process and prints
        // ECONNREFUSED each time; the in-memory fallback is already correct for one instance.
        reconnectStrategy: (retries) =>
          retries >= 3 ? false : Math.min((retries + 1) * 200, 2_000),
      },
    });
    // The first failure is worth seeing; the rest are the same message repeating.
    let errorLogged = false;
    redisClient.on("error", (err) => {
      redisReady = false;
      if (!errorLogged) {
        errorLogged = true;
        console.warn("[ADS_COUNTERS] Redis unavailable, using in-memory counters:", err.message);
      }
    });
    redisClient.on("ready", () => {
      redisReady = true;
    });

    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Redis connect timeout")), 5_000)),
    ]);
    redisReady = true;
    console.log("[ADS_COUNTERS] Redis connected");
  } catch (err) {
    console.warn("[ADS_COUNTERS] Redis unavailable, using in-memory counters:", err.message);
    try {
      if (redisClient) await redisClient.quit();
    } catch (_) {
      /* ignore */
    }
    redisClient = null;
    redisReady = false;
  }
}

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Redis op timeout")), REDIS_OP_TIMEOUT_MS)),
  ]);
}

// ── local fallback ──

function localGet(key) {
  const entry = localStore.get(key);
  if (!entry) return null;
  if (entry.expiresAtMs <= nowMs()) {
    localStore.delete(key);
    return null;
  }
  return entry.value;
}

function localSet(key, value, ttlSeconds) {
  localStore.set(key, { value, expiresAtMs: nowMs() + ttlSeconds * 1000 });
}

function localIncrBy(key, amount, ttlSeconds) {
  const current = Number(localGet(key) || 0);
  const next = current + amount;
  localSet(key, next, ttlSeconds);
  return next;
}

/** Bounded so a long-lived process with Redis down cannot grow without limit. */
function pruneLocal() {
  if (localStore.size < 50_000) return;
  const now = nowMs();
  for (const [key, entry] of localStore) {
    if (entry.expiresAtMs <= now) localStore.delete(key);
  }
}

// ── public API ──

/**
 * Reads everything the plan builder needs about one user in a single round trip.
 * Returns zeroed state on any failure — never throws, never blocks a plan.
 */
async function readUserState(userId, campaignIds = []) {
  const fallback = { servedToday: 0, lastAdAtMs: 0, campaignCounts: {} };
  if (!userId) return fallback;

  const campaignKeys = campaignIds.map((id) => keys.campaignCap(userId, id));

  if (redisReady && redisClient) {
    try {
      const results = await withTimeout(
        redisClient.mGet([keys.dailyCap(userId), keys.lastAd(userId), ...campaignKeys]),
      );
      const campaignCounts = {};
      campaignIds.forEach((id, index) => {
        campaignCounts[String(id)] = Number(results[2 + index] || 0);
      });
      return {
        servedToday: Number(results[0] || 0),
        lastAdAtMs: Number(results[1] || 0),
        campaignCounts,
      };
    } catch (err) {
      console.warn("[ADS_COUNTERS] readUserState failed, treating as uncapped:", err.message);
      return fallback;
    }
  }

  const campaignCounts = {};
  campaignIds.forEach((id) => {
    campaignCounts[String(id)] = Number(localGet(keys.campaignCap(userId, id)) || 0);
  });
  return {
    servedToday: Number(localGet(keys.dailyCap(userId)) || 0),
    lastAdAtMs: Number(localGet(keys.lastAd(userId)) || 0),
    campaignCounts,
  };
}

/**
 * Records that slots were planned for a user.
 *
 * Counted at plan time rather than impression time on purpose: a cap that only advances on a
 * confirmed impression can be walked past by a client that requests plans and drops them.
 */
async function commitPlan({ userId, slotCount, campaignIds = [] }) {
  if (!userId || slotCount <= 0) return;
  const ts = nowMs();

  if (redisReady && redisClient) {
    try {
      const multi = redisClient.multi();
      multi.incrBy(keys.dailyCap(userId), slotCount);
      multi.expire(keys.dailyCap(userId), DAY_TTL_SECONDS);
      multi.set(keys.lastAd(userId), String(ts), { EX: LAST_AD_TTL_SECONDS });
      campaignIds.forEach((id) => {
        multi.incr(keys.campaignCap(userId, id));
        multi.expire(keys.campaignCap(userId, id), CAMPAIGN_TTL_SECONDS);
        multi.incr(keys.campaignPace(id));
        multi.expire(keys.campaignPace(id), PACE_TTL_SECONDS);
        multi.incr(keys.campaignTotal(id));
      });
      await withTimeout(multi.exec());
      return;
    } catch (err) {
      console.warn("[ADS_COUNTERS] commitPlan failed, cap not advanced:", err.message);
      return;
    }
  }

  pruneLocal();
  localIncrBy(keys.dailyCap(userId), slotCount, DAY_TTL_SECONDS);
  localSet(keys.lastAd(userId), ts, LAST_AD_TTL_SECONDS);
  campaignIds.forEach((id) => {
    localIncrBy(keys.campaignCap(userId, id), 1, CAMPAIGN_TTL_SECONDS);
    localIncrBy(keys.campaignPace(id), 1, PACE_TTL_SECONDS);
    localIncrBy(keys.campaignTotal(id), 1, DAY_TTL_SECONDS);
  });
}

/** Hourly delivery counts for the given campaigns, used to pace even-delivery campaigns. */
async function readCampaignPacing(campaignIds = []) {
  const result = {};
  if (!campaignIds.length) return result;

  if (redisReady && redisClient) {
    try {
      const values = await withTimeout(
        redisClient.mGet(campaignIds.map((id) => keys.campaignPace(id))),
      );
      campaignIds.forEach((id, index) => {
        result[String(id)] = Number(values[index] || 0);
      });
      return result;
    } catch (err) {
      console.warn("[ADS_COUNTERS] readCampaignPacing failed:", err.message);
      campaignIds.forEach((id) => {
        result[String(id)] = 0;
      });
      return result;
    }
  }

  campaignIds.forEach((id) => {
    result[String(id)] = Number(localGet(keys.campaignPace(id)) || 0);
  });
  return result;
}

/** Per-surface kill switch. Any truthy value disables the surface immediately. */
async function isSurfaceKilled(surface) {
  if (redisReady && redisClient) {
    try {
      const value = await withTimeout(redisClient.get(keys.kill(surface)));
      return Boolean(value) && value !== "0";
    } catch (_) {
      return false;
    }
  }
  const value = localGet(keys.kill(surface));
  return Boolean(value) && value !== "0";
}

async function setSurfaceKilled(surface, killed) {
  const value = killed ? "1" : "0";
  if (redisReady && redisClient) {
    try {
      await withTimeout(redisClient.set(keys.kill(surface), value));
      return true;
    } catch (err) {
      console.warn("[ADS_COUNTERS] setSurfaceKilled failed:", err.message);
      return false;
    }
  }
  localSet(keys.kill(surface), value, DAY_TTL_SECONDS);
  return true;
}

/** Soft-block a user whose traffic looks invalid. Read by the plan builder. */
async function blockUser(userId, seconds) {
  const key = `ads:block:${userId}`;
  if (redisReady && redisClient) {
    try {
      await withTimeout(redisClient.set(key, "1", { EX: seconds }));
      return;
    } catch (err) {
      console.warn("[ADS_COUNTERS] blockUser failed:", err.message);
      return;
    }
  }
  localSet(key, "1", seconds);
}

async function isUserBlocked(userId) {
  if (!userId) return false;
  const key = `ads:block:${userId}`;
  if (redisReady && redisClient) {
    try {
      return Boolean(await withTimeout(redisClient.get(key)));
    } catch (_) {
      return false;
    }
  }
  return Boolean(localGet(key));
}

/**
 * Generic counters, used by the traffic-quality checks.
 * @param {Array<{key: string, by: number, ttlSeconds: number}>} entries
 */
async function incrementMany(entries = []) {
  if (!entries.length) return;

  if (redisReady && redisClient) {
    try {
      const multi = redisClient.multi();
      entries.forEach(({ key, by, ttlSeconds }) => {
        multi.incrBy(key, by);
        multi.expire(key, ttlSeconds);
      });
      await withTimeout(multi.exec());
      return;
    } catch (err) {
      console.warn("[ADS_COUNTERS] incrementMany failed:", err.message);
      return;
    }
  }

  pruneLocal();
  entries.forEach(({ key, by, ttlSeconds }) => localIncrBy(key, by, ttlSeconds));
}

/** @returns {Object<string, number>} */
async function readMany(keyList = []) {
  const result = {};
  if (!keyList.length) return result;

  if (redisReady && redisClient) {
    try {
      const values = await withTimeout(redisClient.mGet(keyList));
      keyList.forEach((key, index) => {
        result[key] = Number(values[index] || 0);
      });
      return result;
    } catch (err) {
      console.warn("[ADS_COUNTERS] readMany failed:", err.message);
      keyList.forEach((key) => {
        result[key] = 0;
      });
      return result;
    }
  }

  keyList.forEach((key) => {
    result[key] = Number(localGet(key) || 0);
  });
  return result;
}

function isRedisReady() {
  return redisReady;
}

module.exports = {
  initRedis,
  readUserState,
  commitPlan,
  readCampaignPacing,
  isSurfaceKilled,
  setSurfaceKilled,
  blockUser,
  isUserBlocked,
  incrementMany,
  readMany,
  isRedisReady,
  keys,
};
