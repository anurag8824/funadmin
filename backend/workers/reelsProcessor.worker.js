require("dotenv").config({ path: ".env" });
const db = require("../util/connection");

const ReelUploadJob = require("../models/reelUploadJob.model");
const Video = require("../models/video.model");
const { createReelsWorker } = require("../util/reelsQueue");
const { processReelVideo } = require("../util/reelTranscodePipeline");
const { deleteFromStorage } = require("../util/storageHelper");

async function processor(job) {
  const { uploadJobId, videoId } = job.data;
  const uploadJob = await ReelUploadJob.findById(uploadJobId);
  if (!uploadJob) return;

  try {
    uploadJob.state = "processing";
    uploadJob.progress = 15;
    await uploadJob.save();
    await job.updateProgress(15);

    const videoDoc = await Video.findById(videoId).select("videoUrl videoImage");
    if (!videoDoc) {
      throw new Error("Video not found for reel processing");
    }

    const pipelineResult = await processReelVideo({
      videoId,
      sourceUrl: videoDoc.videoUrl,
      fallbackThumbUrl: videoDoc.videoImage,
    });

    uploadJob.progress = 80;
    await uploadJob.save();
    await job.updateProgress(80);

    const finalStatus = pipelineResult.processingStatus || "ready";
    const warningText = (pipelineResult.warnings || []).join(" | ");

    await Video.updateOne(
      { _id: videoId },
      {
        $set: {
          processingStatus: finalStatus,
          processingError: warningText,
          assets: pipelineResult.assets,
          videoUrl: pipelineResult.assets.hlsMasterUrl || pipelineResult.assets.mp4_720_url || videoDoc.videoUrl,
          videoImage: pipelineResult.assets.thumbUrl || videoDoc.videoImage,
        },
      }
    );

    uploadJob.state = finalStatus;
    uploadJob.error = warningText;
    uploadJob.progress = 100;
    uploadJob.completedAt = new Date();
    await uploadJob.save();
    await job.updateProgress(100);

    const shouldDeleteSource = String(process.env.REELS_DELETE_SOURCE_AFTER_PROCESSING || "false").toLowerCase() === "true";
    if (shouldDeleteSource && videoDoc.videoUrl && videoDoc.videoUrl !== (pipelineResult.assets.hlsMasterUrl || pipelineResult.assets.mp4_720_url)) {
      await deleteFromStorage(videoDoc.videoUrl);
    }
  } catch (error) {
    await Video.updateOne(
      { _id: videoId },
      {
        $set: {
          processingStatus: "failed",
          processingError: error.message || "Unknown processing error",
        },
      }
    );
    uploadJob.state = "failed";
    uploadJob.error = error.message || "Unknown processing error";
    uploadJob.completedAt = new Date();
    await uploadJob.save();
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

