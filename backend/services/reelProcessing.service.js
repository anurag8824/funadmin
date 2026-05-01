const ReelUploadJob = require("../models/reelUploadJob.model");
const { getReelsQueue } = require("../util/reelsQueue");

async function getActiveReelJob(videoId) {
  return ReelUploadJob.findOne({
    videoId,
    state: { $in: ["uploading", "processing"] },
  })
    .sort({ createdAt: -1 })
    .lean();
}

async function createAndEnqueueReelJob({ videoId, userId, sourceUrl }) {
  const activeJob = await getActiveReelJob(videoId);
  if (activeJob) {
    return {
      ...activeJob,
      isExistingActiveJob: true,
    };
  }

  let uploadJob;
  try {
    uploadJob = await ReelUploadJob.create({
      videoId,
      userId,
      sourceUrl,
      state: "processing",
      progress: 5,
      startedAt: new Date(),
    });
  } catch (err) {
    // Race-safe fallback if two enqueue attempts happen simultaneously.
    if (err?.code === 11000) {
      const existing = await getActiveReelJob(videoId);
      if (existing) {
        return {
          ...existing,
          isExistingActiveJob: true,
        };
      }
    }
    throw err;
  }

  const queue = getReelsQueue();
  if (!queue) {
    // Redis/queue not configured; keep record for visibility, but mark failed.
    uploadJob.state = "failed";
    uploadJob.error = "Queue not configured (missing REDIS_URL)";
    uploadJob.progress = 0;
    uploadJob.completedAt = new Date();
    await uploadJob.save();
    return uploadJob;
  }

  const queueJob = await queue.add(
    "process-reel",
    {
      uploadJobId: uploadJob._id.toString(),
      videoId: videoId.toString(),
      userId: userId.toString(),
      sourceUrl,
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    }
  );

  uploadJob.queueJobId = String(queueJob.id || "");
  await uploadJob.save();
  return uploadJob;
}

module.exports = {
  createAndEnqueueReelJob,
  getActiveReelJob,
};

