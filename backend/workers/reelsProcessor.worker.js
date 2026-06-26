require("dotenv").config({ path: ".env" });
const db = require("../util/connection");

const Video = require("../models/video.model");
const { createReelsWorker } = require("../util/reelsQueue");
const { processReelVideo } = require("../util/reelTranscodePipeline");
const { deleteFromStorage } = require("../util/storageHelper");
const {
  markProcessingStarted,
  markProcessingProgress,
  completeProcessing,
  failProcessing,
} = require("../services/reels/videoProcessing.service");

async function processor(job) {
  const { uploadJobId, videoId } = job.data;

  try {
    await markProcessingStarted(uploadJobId);
    await job.updateProgress(15);

    const videoDoc = await Video.findById(videoId).select("videoUrl videoImage");
    if (!videoDoc) {
      throw new Error("Video not found for reel processing");
    }

    await markProcessingProgress(uploadJobId, 30);
    await job.updateProgress(30);

    const pipelineResult = await processReelVideo({
      videoId,
      sourceUrl: videoDoc.videoUrl,
      fallbackThumbUrl: videoDoc.videoImage,
    });

    await markProcessingProgress(uploadJobId, 80);
    await job.updateProgress(80);

    await completeProcessing({
      uploadJobId,
      videoId,
      pipelineResult,
      sourceVideoUrl: videoDoc.videoUrl,
      fallbackThumbUrl: videoDoc.videoImage,
    });
    await job.updateProgress(100);

    const shouldDeleteSource =
      String(process.env.REELS_DELETE_SOURCE_AFTER_PROCESSING || "false").toLowerCase() === "true";
    const processedUrl =
      pipelineResult.assets?.hlsMasterUrl || pipelineResult.assets?.mp4_720_url;
    if (shouldDeleteSource && videoDoc.videoUrl && videoDoc.videoUrl !== processedUrl) {
      await deleteFromStorage(videoDoc.videoUrl);
    }
  } catch (error) {
    await failProcessing({
      uploadJobId,
      videoId,
      errorMessage: error.message || "Unknown processing error",
    });
    throw error;
  }
}

function startReelsWorker() {
  const worker = createReelsWorker(processor);
  if (!worker) {
    console.log("Reels worker not started (missing REDIS_URL).");
    return null;
  }
  worker.on("completed", (job) => console.log(`Reels worker completed job=${job.id}`));
  worker.on("failed", (job, err) => console.error(`Reels worker failed job=${job?.id}`, err?.message));
  console.log("Reels worker started.");
  return worker;
}

if (require.main === module) {
  db.once("open", () => {
    console.log("Reels worker Mongo connected.");
    startReelsWorker();
  });
  db.on("error", (err) => {
    console.error("Reels worker Mongo connection error:", err?.message || err);
  });
}

module.exports = {
  startReelsWorker,
};
