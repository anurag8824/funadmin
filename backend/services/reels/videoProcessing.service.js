const mongoose = require("mongoose");
const Video = require("../../models/video.model");
const ReelUploadJob = require("../../models/reelUploadJob.model");
const User = require("../../models/user.model");
const { createAndEnqueueReelJob, getActiveReelJob } = require("../reelProcessing.service");

const MAX_PROCESSING_ATTEMPTS = 3;

function toJobDto(uploadJob) {
  if (!uploadJob) return null;
  return {
    id: String(uploadJob._id),
    videoId: uploadJob.videoId ? String(uploadJob.videoId) : null,
    state: uploadJob.state,
    progress: uploadJob.progress,
    error: uploadJob.error || "",
    attemptCount: uploadJob.attemptCount || 1,
    startedAt: uploadJob.startedAt,
    completedAt: uploadJob.completedAt,
  };
}

async function getUploadJobStatus({ videoId, uploadJobId }) {
  if (!videoId && !uploadJobId) {
    return { ok: false, status: 400, body: { status: false, message: "videoId or uploadJobId is required." } };
  }

  const filter = uploadJobId ? { _id: uploadJobId } : { videoId };
  const uploadJob = await ReelUploadJob.findOne(filter).sort({ createdAt: -1 }).lean();
  if (!uploadJob) {
    return { ok: true, status: 200, body: { status: true, message: "No upload job found.", data: null } };
  }

  return {
    ok: true,
    status: 200,
    body: {
      status: true,
      message: "Upload job status fetched successfully.",
      data: toJobDto(uploadJob),
    },
  };
}

async function retryProcessing({ userId, videoId }) {
  if (!userId || !videoId) {
    return { ok: false, status: 400, body: { status: false, message: "userId and videoId are required." } };
  }
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(videoId)) {
    return { ok: false, status: 400, body: { status: false, message: "Invalid userId or videoId." } };
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const videoObjectId = new mongoose.Types.ObjectId(videoId);
  const video = await Video.findById(videoObjectId).select("_id userId videoUrl processingStatus").lean();
  if (!video) {
    return { ok: false, status: 404, body: { status: false, message: "Video not found." } };
  }
  if (String(video.userId) !== String(userObjectId)) {
    return { ok: false, status: 403, body: { status: false, message: "You can retry only your own reel processing." } };
  }
  if (!video.videoUrl) {
    return { ok: false, status: 400, body: { status: false, message: "Source video URL is missing." } };
  }

  const lastJob = await ReelUploadJob.findOne({ videoId: videoObjectId }).sort({ createdAt: -1 }).lean();
  if (lastJob?.state === "failed" && (lastJob.attemptCount || 1) >= MAX_PROCESSING_ATTEMPTS) {
    return {
      ok: false,
      status: 429,
      body: {
        status: false,
        message: "Maximum processing retries reached. Contact support.",
        code: "MAX_RETRIES_EXCEEDED",
      },
    };
  }

  const existingJob = await getActiveReelJob(videoObjectId);
  if (existingJob) {
    return {
      ok: true,
      status: 200,
      body: {
        status: true,
        message: "Reel processing already in progress.",
        data: {
          videoId: videoObjectId,
          uploadJobId: existingJob._id,
          state: existingJob.state,
          progress: existingJob.progress,
        },
      },
    };
  }

  await Video.updateOne(
    { _id: videoObjectId },
    { $set: { processingStatus: "processing", processingError: "" } },
  );

  const nextAttempt = (lastJob?.attemptCount || 0) + 1;
  const uploadJob = await createAndEnqueueReelJob({
    videoId: videoObjectId,
    userId: userObjectId,
    sourceUrl: video.videoUrl,
    attemptCount: nextAttempt,
  });

  if (uploadJob?.state === "failed") {
    await Video.updateOne(
      { _id: videoObjectId },
      {
        $set: {
          processingStatus: "failed",
          processingError: uploadJob.error || "Queue job creation failed",
        },
      },
    );
    return {
      ok: false,
      status: 500,
      body: { status: false, message: uploadJob.error || "Failed to enqueue reel processing job." },
    };
  }

  return {
    ok: true,
    status: 200,
    body: {
      status: true,
      message: "Reel processing retried successfully.",
      data: {
        videoId: videoObjectId,
        uploadJobId: uploadJob._id,
        state: uploadJob.state,
        progress: uploadJob.progress,
        attemptCount: uploadJob.attemptCount,
      },
    },
  };
}

async function markProcessingStarted(uploadJobId) {
  await ReelUploadJob.updateOne(
    { _id: uploadJobId },
    { $set: { state: "processing", progress: 15, startedAt: new Date() } },
  );
}

async function markProcessingProgress(uploadJobId, progress) {
  await ReelUploadJob.updateOne({ _id: uploadJobId }, { $set: { progress } });
}

async function completeProcessing({ uploadJobId, videoId, pipelineResult, sourceVideoUrl, fallbackThumbUrl }) {
  const finalStatus = pipelineResult.processingStatus || "ready";
  const warningText = (pipelineResult.warnings || []).join(" | ");

  await Video.updateOne(
    { _id: videoId },
    {
      $set: {
        processingStatus: finalStatus,
        processingError: warningText,
        assets: pipelineResult.assets,
        videoUrl: pipelineResult.assets.hlsMasterUrl || pipelineResult.assets.mp4_720_url || sourceVideoUrl,
        videoImage: pipelineResult.assets.thumbUrl || fallbackThumbUrl || "",
      },
    },
  );

  await ReelUploadJob.updateOne(
    { _id: uploadJobId },
    {
      $set: {
        state: finalStatus,
        error: warningText,
        progress: 100,
        completedAt: new Date(),
      },
    },
  );

  return { finalStatus, warningText };
}

async function failProcessing({ uploadJobId, videoId, errorMessage }) {
  const message = errorMessage || "Unknown processing error";
  await Video.updateOne(
    { _id: videoId },
    { $set: { processingStatus: "failed", processingError: message } },
  );
  await ReelUploadJob.updateOne(
    { _id: uploadJobId },
    { $set: { state: "failed", error: message, completedAt: new Date() } },
  );
}

module.exports = {
  MAX_PROCESSING_ATTEMPTS,
  getUploadJobStatus,
  retryProcessing,
  markProcessingStarted,
  markProcessingProgress,
  completeProcessing,
  failProcessing,
  toJobDto,
};
