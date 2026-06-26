const mongoose = require("mongoose");
const { getReelsQueue } = require("../../util/reelsQueue");
const { isRedisReady } = require("./feedCacheService");

async function getReelsSubsystemHealth() {
  const mongoState = mongoose.connection.readyState;
  const mongoOk = mongoState === 1;
  const redisOk = isRedisReady();
  const queueConfigured = Boolean(process.env.REDIS_URL);
  const queueOk = queueConfigured ? Boolean(getReelsQueue()) : true;
  const asyncProcessing =
    String(process.env.REELS_ASYNC_PROCESSING || "false").toLowerCase() === "true";

  const components = {
    mongo: { ok: mongoOk, state: mongoState },
    redis: { ok: redisOk, configured: Boolean(process.env.REDIS_URL) },
    transcodeQueue: { ok: queueOk, configured: queueConfigured, asyncProcessing },
  };

  const healthy = mongoOk && (!queueConfigured || redisOk);
  return {
    status: healthy ? "ok" : "degraded",
    message: healthy ? "Reels subsystem healthy." : "Reels subsystem degraded.",
    components,
    ts: Date.now(),
  };
}

module.exports = {
  getReelsSubsystemHealth,
};
