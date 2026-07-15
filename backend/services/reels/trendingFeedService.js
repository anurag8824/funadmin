const mongoose = require("mongoose");
const Video = require("../../models/video.model");
const User = require("../../models/user.model");
const { isReelVisibleInFeed, resolveBlockContext } = require("./reelsFeed.shared");
const { rankFeedItems } = require("./recommendationService");
const { getByKey, setByKey } = require("./feedCacheService");
const scalingConfig = require("./scalingConfig");
const { recordFeedRequest } = require("./reelsMetrics.service");

const TRENDING_TTL_MS = scalingConfig.trendingCacheTtlMs;

function buildTrendingCacheKey(userId, limit) {
  return `reels:trending:${userId}:${limit}`;
}

/**
 * Non-personalized trending fallback (SADD Phase 16).
 * Engagement + recency rank on recent reels — no ML.
 */
async function fetchTrendingFallbackFeed({ userId, limit = 20, settingJSON }) {
  if (!userId) {
    return { ok: false, status: 200, body: { status: false, message: "userId must be requried." } };
  }
  if (!settingJSON) {
    return { ok: false, status: 200, body: { status: false, message: "Setting does not found." } };
  }

  const parsedLimit = Math.min(Math.max(parseInt(String(limit), 10), 1), 50);
  const cacheKey = buildTrendingCacheKey(String(userId), parsedLimit);
  const cached = await getByKey(cacheKey);
  if (cached) {
    recordFeedRequest({ fromCache: true, fallback: true });
    return { ok: true, status: 200, body: cached, fromCache: true, fallback: true };
  }

  const viewerObjectId = new mongoose.Types.ObjectId(userId);
  const { viewer, excludedUserIds } = await resolveBlockContext(User, viewerObjectId);
  if (!viewer) {
    return { ok: false, status: 200, body: { status: false, message: "User does not found." } };
  }
  if (viewer.isBlock) {
    return { ok: false, status: 200, body: { status: false, message: "you are blocked by the admin." } };
  }

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const baseMatch = {
    isBanned: false,
    isDraft: { $ne: true },
    createdAt: { $gte: since },
    ...(settingJSON.isFakeData ? {} : { isFake: false }),
    ...(excludedUserIds.length ? { userId: { $nin: excludedUserIds } } : {}),
  };

  const candidates = await Video.aggregate([
    { $match: baseMatch },
    { $sort: { createdAt: -1 } },
    { $limit: Math.max(parsedLimit * 4, 40) },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
    {
      $project: {
        caption: 1,
        videoImage: 1,
        videoUrl: 1,
        assets: {
          hlsMasterUrl: { $ifNull: ["$assets.hlsMasterUrl", ""] },
          hlsVariants: {
            hls720Url: { $ifNull: ["$assets.hlsVariants.hls720Url", ""] },
            hls480Url: { $ifNull: ["$assets.hlsVariants.hls480Url", ""] },
          },
          mp4_720_url: { $ifNull: ["$assets.mp4_720_url", ""] },
          mp4_480_url: { $ifNull: ["$assets.mp4_480_url", ""] },
          thumbUrl: { $ifNull: ["$assets.thumbUrl", ""] },
        },
        processingStatus: 1,
        videoTime: 1,
        createdAt: 1,
        shareCount: 1,
        userId: "$user._id",
        name: "$user.name",
        userName: "$user.userName",
        userImage: "$user.image",
        isVerified: "$user.isVerified",
        totalLikes: { $ifNull: ["$likeCount", 0] },
        totalComments: { $ifNull: ["$commentCount", 0] },
        totalShares: "$shareCount",
      },
    },
  ]);

  const visible = candidates.filter(isReelVisibleInFeed);
  const ranked = rankFeedItems(visible, { explorationRatio: 0.1 }).slice(0, parsedLimit);

  const responsePayload = {
    status: true,
    message: "Trending fallback reels feed.",
    data: ranked,
    paging: {
      hasMore: false,
      nextCursorCreatedAt: null,
      nextCursorId: null,
    },
    fallback: true,
  };

  await setByKey(cacheKey, responsePayload, TRENDING_TTL_MS);
  recordFeedRequest({ fallback: true });
  return { ok: true, status: 200, body: responsePayload, fromCache: false, fallback: true };
}

module.exports = {
  fetchTrendingFallbackFeed,
};
