const { Queue, Worker } = require("bullmq");

let queueInstance = null;

function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  return { connection: { url } };
}

function getReelsQueue() {
  if (queueInstance) return queueInstance;
  const redisConfig = getRedisConnection();
  if (!redisConfig) return null;

  queueInstance = new Queue("reels-processing", redisConfig);
  return queueInstance;
}

function createReelsWorker(processor) {
  const redisConfig = getRedisConnection();
  if (!redisConfig) return null;

  return new Worker("reels-processing", processor, redisConfig);
}

module.exports = {
  getReelsQueue,
  createReelsWorker,
};

