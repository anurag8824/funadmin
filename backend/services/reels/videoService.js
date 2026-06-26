const mongoose = require("mongoose");
const Video = require("../../models/video.model");
const User = require("../../models/user.model");
const { resolveBlockContext } = require("./reelsFeed.shared");
const { signPlaybackUrls } = require("../../util/signedPlaybackUrl");
const { recordPlaybackRequest } = require("./reelsMetrics.service");

function selectPlaybackUrls(video) {
  const assets = video.assets || {};
  return {
    hlsMasterUrl: assets.hlsMasterUrl || "",
    mp4_1080_url: assets.mp4_1080_url || "",
    mp4_720_url: assets.mp4_720_url || "",
    mp4_480_url: assets.mp4_480_url || "",
    thumbUrl: assets.thumbUrl || video.videoImage || "",
    previewUrl: assets.previewUrl || "",
    fallbackUrl: video.videoUrl || "",
    processingStatus: video.processingStatus || "ready",
  };
}

/**
 * Video Service — metadata and playback URL resolution (SADD Phase 10).
 */
async function getReelPlayback({ userId, videoId }) {
  if (!userId || !videoId) {
    return { ok: false, status: 400, body: { status: false, message: "userId and videoId are required." } };
  }
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(videoId)) {
    return { ok: false, status: 400, body: { status: false, message: "Invalid userId or videoId." } };
  }

  const viewerObjectId = new mongoose.Types.ObjectId(userId);
  const videoObjectId = new mongoose.Types.ObjectId(videoId);

  const { viewer, excludedUserIds } = await resolveBlockContext(User, viewerObjectId);
  if (!viewer) {
    return { ok: false, status: 200, body: { status: false, message: "User does not found." } };
  }
  if (viewer.isBlock) {
    return { ok: false, status: 200, body: { status: false, message: "you are blocked by the admin." } };
  }

  const video = await Video.findOne({
    _id: videoObjectId,
    isBanned: false,
    isDraft: { $ne: true },
    ...(excludedUserIds.length ? { userId: { $nin: excludedUserIds } } : {}),
  })
    .select("_id userId videoUrl videoImage assets processingStatus processingError videoTime")
    .lean();

  if (!video) {
    return { ok: false, status: 404, body: { status: false, message: "Video not found." } };
  }

  recordPlaybackRequest();
  const playback = signPlaybackUrls(selectPlaybackUrls(video), {
    videoId: String(video._id),
    userId: String(userId),
  });

  return {
    ok: true,
    status: 200,
    body: {
      status: true,
      message: "Reel playback URLs resolved.",
      data: {
        videoId: video._id,
        playback,
        videoTime: video.videoTime,
        processingError: video.processingError || "",
      },
    },
  };
}

async function getVideoMetadata({ userId, videoId }) {
  const result = await getReelPlayback({ userId, videoId });
  if (!result.ok) return result;
  return result;
}

module.exports = {
  getReelPlayback,
  getVideoMetadata,
  selectPlaybackUrls,
};
