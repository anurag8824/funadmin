const Video = require("../../models/video.model");
const User = require("../../models/user.model");
const Song = require("../../models/song.model");
const HashTag = require("../../models/hashTag.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const { generateUniqueVideoOrPostId } = require("../../util/generateUniqueVideoOrPostId");
const { validateUploadPayload } = require("./uploadValidation.service");
const { createAndEnqueueReelJob, getActiveReelJob } = require("../reelProcessing.service");
const { toJobDto } = require("./videoProcessing.service");
const { recordUpload } = require("./reelsMetrics.service");

async function saveHashTagUsage({ userId, videoId, hashTagIds }) {
  for (const hashTagId of hashTagIds) {
    const hashTag = await HashTag.findById(hashTagId);
    if (!hashTag) continue;
    await HashTagUsageHistory.create({
      userId,
      hashTagId,
      videoId,
    });
  }
}

/**
 * Create reel record and optionally enqueue async transcoding (SADD Phase 10 & 12).
 */
async function createReelUpload({ userId, body, settingJSON }) {
  if (!userId) {
    return {
      ok: false,
      status: 200,
      body: { status: false, message: "userId must be requried." },
      cleanup: [body?.videoImage, body?.videoUrl].filter(Boolean),
    };
  }

  const validation = validateUploadPayload({ body, settingJSON });
  if (!validation.ok) {
    recordUpload({ failed: true });
    return { ok: false, status: validation.status, body: validation.body, cleanup: validation.cleanup };
  }

  const [uniqueVideoId, user, song] = await Promise.all([
    generateUniqueVideoOrPostId(),
    User.findOne({ _id: userId, isFake: false }),
    body?.songId ? Song.findById(body.songId) : Promise.resolve(null),
  ]);

  if (!user) {
    return {
      ok: false,
      status: 200,
      body: { status: false, message: "User does not found." },
      cleanup: [body?.videoImage, body?.videoUrl].filter(Boolean),
    };
  }
  if (user.isBlock) {
    return {
      ok: false,
      status: 200,
      body: { status: false, message: "you are blocked by the admin." },
      cleanup: [body?.videoImage, body?.videoUrl].filter(Boolean),
    };
  }
  if (!settingJSON) {
    return {
      ok: false,
      status: 200,
      body: { status: false, message: "setting does not found!" },
      cleanup: [body?.videoImage, body?.videoUrl].filter(Boolean),
    };
  }
  if (body?.songId && !song) {
    return {
      ok: false,
      status: 200,
      body: { status: false, message: "Song does not found." },
      cleanup: [body?.videoImage, body?.videoUrl].filter(Boolean),
    };
  }

  const video = new Video();
  video.userId = user._id;
  video.caption = body?.caption ? body.caption : "";
  video.videoTime = validation.videoTime;
  video.songId = body?.songId ? song._id : video.songId;
  video.videoImage = body.videoImage;
  video.videoUrl = body.videoUrl;
  video.uniqueVideoId = uniqueVideoId;
  video.processingStatus = "ready";
  await video.save();

  if (body?.hashTagId) {
    const multipleHashTag = String(body.hashTagId).split(",");
    video.hashTagId = multipleHashTag;
    await video.save();
    await saveHashTagUsage({ userId: user._id, videoId: video._id, hashTagIds: multipleHashTag });
  }

  let uploadJob = null;
  const shouldProcessAsync = String(process.env.REELS_ASYNC_PROCESSING || "false").toLowerCase() === "true";
  if (shouldProcessAsync) {
    const existingJob = await getActiveReelJob(video._id);
    if (existingJob) {
      uploadJob = existingJob;
    } else {
      video.processingStatus = "processing";
      await video.save();
      uploadJob = await createAndEnqueueReelJob({
        videoId: video._id,
        userId: user._id,
        sourceUrl: video.videoUrl,
        attemptCount: 1,
      });
    }
    if (uploadJob?.state === "failed") {
      video.processingStatus = "failed";
      video.processingError = uploadJob.error || "Queue job creation failed";
      await video.save();
    }
  }

  recordUpload({ failed: false });
  return {
    ok: true,
    status: 200,
    body: {
      status: true,
      message: "Video has been uploaded by the user.",
      data: video,
      uploadJob: uploadJob ? toJobDto(uploadJob) : null,
    },
    meta: {
      videoId: String(video._id),
      userId: String(user._id),
      processingStatus: video.processingStatus,
    },
  };
}

module.exports = {
  createReelUpload,
};
