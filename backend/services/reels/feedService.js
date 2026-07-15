const mongoose = require("mongoose");
const Video = require("../../models/video.model");
const User = require("../../models/user.model");
const { isReelVisibleInFeed, resolveBlockContext } = require("./reelsFeed.shared");
const { getCachedFeedPage, setCachedFeedPage } = require("./feedCacheService");
const { rankFeedItems } = require("./recommendationService");
let scalingConfig;
try {
  scalingConfig = require("./scalingConfig");
} catch (_) {
  scalingConfig = { feedPageMaxLimit: 50 };
}
let recordFeedRequest = () => {};
try {
  recordFeedRequest = require("./reelsMetrics.service").recordFeedRequest;
} catch (_) {
  /* metrics optional */
}

function buildFeedAggregation({ baseMatch, limit, start, requestedVideoId, cursorCreatedAt, cursorId, viewerUserId }) {
  const pipeline = [
    { $match: baseMatch },
    { $sort: { createdAt: -1, _id: -1 } },
  ];

  if (!requestedVideoId && !(cursorCreatedAt && cursorId)) {
    pipeline.push({ $skip: (start - 1) * limit });
  }

  pipeline.push(
    { $limit: limit + 1 },
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
      $lookup: {
        from: "songs",
        localField: "songId",
        foreignField: "_id",
        as: "song",
      },
    },
    { $unwind: { path: "$song", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "likehistoryofpostorvideos",
        let: { videoId: "$_id", userId: viewerUserId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "likeHistory",
      },
    },
    {
      $lookup: {
        from: "followerfollowings",
        let: { postUserId: "$userId", requestingUserId: viewerUserId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$toUserId", "$$postUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "isFollowAgg",
      },
    },
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
        userId: "$user._id",
        name: "$user.name",
        userName: "$user.userName",
        userImage: "$user.image",
        isVerified: "$user.isVerified",
        userIsFake: "$user.isFake",
        isProfileImageBanned: "$user.isProfileImageBanned",
        songId: 1,
        songTitle: "$song.songTitle",
        songImage: "$song.songImage",
        songLink: "$song.songLink",
        singerName: "$song.singerName",
        isLike: { $gt: [{ $size: "$likeHistory" }, 0] },
        isFollow: { $gt: [{ $size: "$isFollowAgg" }, 0] },
        isSaved: { $in: [viewerUserId, { $ifNull: ["$savedBy", []] }] },
        // Denormalized counters — avoids per-row $count lookups on likes/comments.
        totalLikes: { $ifNull: ["$likeCount", 0] },
        totalComments: { $ifNull: ["$commentCount", 0] },
        totalShares: "$shareCount",
      },
    },
  );

  return pipeline;
}

/**
 * Feed Service — fetch, rank, cache reels feed pages (SADD Phase 4 & 10).
 */
async function fetchReelsFeedLite({
  userId,
  limit = 20,
  start = 1,
  cursorCreatedAt = null,
  cursorId = null,
  videoId = null,
  settingJSON,
  useCache = true,
  useRanking = true,
}) {
  const startedAt = Date.now();
  try {
  if (!userId) {
    return { ok: false, status: 200, body: { status: false, message: "userId must be requried." } };
  }
  if (!settingJSON) {
    return { ok: false, status: 200, body: { status: false, message: "Setting does not found." } };
  }

  const viewerObjectId = new mongoose.Types.ObjectId(userId);
  const parsedLimit = Math.min(Math.max(parseInt(String(limit), 10), 1), scalingConfig.feedPageMaxLimit);
  const parsedStart = Math.max(parseInt(String(start), 10), 1);
  const cursorDate = cursorCreatedAt ? new Date(cursorCreatedAt) : null;
  const cursorObjectId =
    cursorId && mongoose.Types.ObjectId.isValid(cursorId) ? new mongoose.Types.ObjectId(cursorId) : null;
  const requestedVideoId =
    videoId && mongoose.Types.ObjectId.isValid(videoId) ? new mongoose.Types.ObjectId(videoId) : null;

  const cacheParams = {
    userId: String(userId),
    limit: parsedLimit,
    cursorCreatedAt: cursorDate ? cursorDate.toISOString() : null,
    cursorId: cursorObjectId ? String(cursorObjectId) : null,
    videoId: requestedVideoId ? String(requestedVideoId) : null,
  };

  if (useCache && !requestedVideoId) {
    const cached = await getCachedFeedPage(cacheParams);
    if (cached) {
      recordFeedRequest({ fromCache: true, durationMs: Date.now() - startedAt });
      return { ok: true, status: 200, body: cached, fromCache: true };
    }
  }

  const { viewer, excludedUserIds } = await resolveBlockContext(User, viewerObjectId);
  if (!viewer) {
    return { ok: false, status: 200, body: { status: false, message: "User does not found." } };
  }
  if (viewer.isBlock) {
    return { ok: false, status: 200, body: { status: false, message: "you are blocked by the admin." } };
  }

  const baseMatch = {
    isBanned: false,
    isDraft: { $ne: true },
    ...(settingJSON.isFakeData ? {} : { isFake: false }),
    ...(excludedUserIds.length ? { userId: { $nin: excludedUserIds } } : {}),
  };

  if (videoId && !requestedVideoId) {
    return { ok: false, status: 400, body: { status: false, message: "Invalid videoId format." } };
  }
  if (requestedVideoId) {
    baseMatch._id = requestedVideoId;
  }

  if (!requestedVideoId && cursorDate && cursorObjectId) {
    baseMatch.$or = [
      { createdAt: { $lt: cursorDate } },
      { createdAt: cursorDate, _id: { $lt: cursorObjectId } },
    ];
  }

  const pipeline = buildFeedAggregation({
    baseMatch,
    limit: parsedLimit,
    start: parsedStart,
    requestedVideoId,
    cursorCreatedAt: cursorDate,
    cursorId: cursorObjectId,
    viewerUserId: viewerObjectId,
  });

  const videos = await Video.aggregate(pipeline);

  const hasMore = videos.length > parsedLimit;
  const rawItems = hasMore ? videos.slice(0, parsedLimit) : videos;
  const visibleItems = rawItems.filter(isReelVisibleInFeed);
  const rankedItems = useRanking && !requestedVideoId ? rankFeedItems(visibleItems) : visibleItems;
  const lastItem = rawItems.length > 0 ? rawItems[rawItems.length - 1] : null;

  const responsePayload = {
    status: true,
    message: "Retrieve the videos uploaded by users.",
    data: rankedItems,
    paging: {
      hasMore,
      nextCursorCreatedAt: hasMore ? lastItem.createdAt : null,
      nextCursorId: hasMore ? lastItem._id : null,
    },
  };

  if (useCache && !requestedVideoId) {
    await setCachedFeedPage(cacheParams, responsePayload);
  }

  recordFeedRequest({ fromCache: false, durationMs: Date.now() - startedAt });
  return { ok: true, status: 200, body: responsePayload, fromCache: false };
  } catch (error) {
    recordFeedRequest({ error: true, durationMs: Date.now() - startedAt });
    throw error;
  }
}

module.exports = {
  fetchReelsFeedLite,
  isReelVisibleInFeed,
};
