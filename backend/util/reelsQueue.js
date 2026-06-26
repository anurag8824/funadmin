const { Queue, Worker } = require("bullmq");

let queueInstance = null;
let queueInitFailed = false;

function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  return { connection: { url } };
}

function getReelsQueue() {
  if (queueInstance) return queueInstance;
  if (queueInitFailed) return null;

  const redisConfig = getRedisConnection();
  if (!redisConfig) return null;

  try {
    queueInstance = new Queue("reels-processing", redisConfig);
    return queueInstance;
  } catch (err) {
    queueInitFailed = true;
    console.warn("[REELS_QUEUE] Failed to create queue:", err.message);
    return null;
  }
}

/** Health checks only — never instantiate BullMQ from /health. */
function isReelsQueueReady() {
  if (!process.env.REDIS_URL) return true;
  return Boolean(queueInstance);
}

function createReelsWorker(processor) {
  const redisConfig = getRedisConnection();
  if (!redisConfig) return null;

  return new Worker("reels-processing", processor, redisConfig);
}

module.exports = {
  getReelsQueue,
  isReelsQueueReady,
  createReelsWorker,
};
