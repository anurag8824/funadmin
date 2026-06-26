const mongoose = require("mongoose");

/** Feed visibility: require transcoded assets, or an in-progress upload — not raw failed uploads. */
function isReelVisibleInFeed(video) {
  const hasProcessedAssets = Boolean(
    video.assets?.hlsMasterUrl ||
      video.assets?.mp4_720_url ||
      video.assets?.mp4_480_url ||
      video.assets?.mp4_1080_url,
  );
  if (hasProcessedAssets) return true;
  const status = String(video.processingStatus || "").toLowerCase();
  if (status === "processing" || status === "uploading") return true;
  if (status === "failed") return false;
  return Boolean(video.videoUrl);
}

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

async function resolveBlockContext(User, viewerId) {
  const viewer = await User.findById(viewerId).select("_id isBlock blockedUsers").lean();
  if (!viewer) return { viewer: null, excludedUserIds: [] };

  const blockedByViewer = (viewer.blockedUsers || []).map((id) => String(id));
  const blockedViewerByUsers = await User.find({ blockedUsers: toObjectId(viewerId) }).select("_id").lean();
  const blockedViewerByIds = blockedViewerByUsers.map((u) => String(u._id));

  return {
    viewer,
    excludedUserIds: [...new Set([...blockedByViewer, ...blockedViewerByIds])].map((id) => toObjectId(id)),
  };
}

module.exports = {
  isReelVisibleInFeed,
  toObjectId,
  resolveBlockContext,
};
