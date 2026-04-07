const mongoose = require("mongoose");
const StoryFeed = require("../../models/storyFeed.model");
const MEDIA_TYPES = StoryFeed.MEDIA_TYPES;
const User = require("../../models/user.model");
const FollowerFollowing = require("../../models/followerFollowing.model");
const { logStoryFeedError, logStoryFeedWarn } = require("../../util/storyFeedLogger");
const { isMongoConnectivityError } = require("../../util/mongoConnectivity");

const MS_24H = 24 * 60 * 60 * 1000;
const MAX_MEDIA_URL_CHARS = 4096;
const MAX_STORIES_PER_REQUEST = 100;
const MAX_FOLLOW_ROWS_SCAN = 2048;
const MAX_DISTINCT_AUTHOR_IDS = 512;
const FEED_AGG_MAX_TIME_MS = 10_000;

function failUpload(res, err, api, userId) {
  logStoryFeedError(api, userId, err);
  if (isMongoConnectivityError(err)) {
    return res.status(503).json({ status: false, message: "Story Upload Failed", code: "DB_UNAVAILABLE" });
  }
  return res.status(500).json({ status: false, message: "Story Upload Failed" });
}

function failView(res, err, api, userId) {
  logStoryFeedError(api, userId, err);
  if (isMongoConnectivityError(err)) {
    return res.status(503).json({ status: false, message: "Story View Failed", code: "DB_UNAVAILABLE" });
  }
  return res.status(500).json({ status: false, message: "Story View Failed" });
}

function failFetch(res, err, api, userId) {
  logStoryFeedError(api, userId, err);
  if (isMongoConnectivityError(err)) {
    return res.status(503).json({ status: false, message: "Story Fetch Failed", code: "DB_UNAVAILABLE" });
  }
  return res.status(500).json({ status: false, message: "Story Fetch Failed" });
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/** O(1) length check before URL parse — avoids megabyte strings on the main thread. */
function looksLikeHttpUrl(s) {
  const t = s.trim();
  if (t.length === 0 || t.length > MAX_MEDIA_URL_CHARS) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Bounded list of author ObjectIds: viewer + follows, deduped, capped for safe $in queries.
 */
async function buildAuthorIdList(viewerId) {
  const rows = await FollowerFollowing.find({ fromUserId: viewerId })
    .select({ toUserId: 1 })
    .limit(MAX_FOLLOW_ROWS_SCAN)
    .lean();

  const out = [];
  const seen = new Set();
  const v = String(viewerId);
  seen.add(v);
  out.push(viewerId);

  for (let i = 0; i < rows.length && out.length < MAX_DISTINCT_AUTHOR_IDS; i++) {
    const t = rows[i].toUserId;
    if (!t) continue;
    const ts = String(t);
    if (seen.has(ts)) continue;
    seen.add(ts);
    out.push(t);
  }
  return out;
}

/**
 * POST /client/storyFeed/upload
 */
exports.uploadStoryFeed = async (req, res) => {
  const api = "uploadStoryFeed";
  const userIdRaw = req.body?.userId;
  try {
    if (!isNonEmptyString(userIdRaw) || !mongoose.Types.ObjectId.isValid(userIdRaw)) {
      return res.status(400).json({ status: false, message: "Story Upload Failed" });
    }
    if (!isNonEmptyString(req.body?.mediaUrl)) {
      logStoryFeedWarn(api, userIdRaw, "missing mediaUrl");
      return res.status(400).json({ status: false, message: "Story Upload Failed" });
    }
    const mediaType = String(req.body.mediaType || "").toLowerCase();
    if (!MEDIA_TYPES.includes(mediaType)) {
      logStoryFeedWarn(api, userIdRaw, "unsupported mediaType", { mediaType: req.body.mediaType });
      return res.status(400).json({ status: false, message: "Story Upload Failed" });
    }
    const mediaUrl = req.body.mediaUrl.trim();
    if (mediaUrl.length > MAX_MEDIA_URL_CHARS) {
      logStoryFeedWarn(api, userIdRaw, "mediaUrl too long");
      return res.status(400).json({ status: false, message: "Story Upload Failed" });
    }
    if (!looksLikeHttpUrl(mediaUrl)) {
      logStoryFeedWarn(api, userIdRaw, "invalid mediaUrl format");
      return res.status(400).json({ status: false, message: "Story Upload Failed" });
    }

    const user = await User.findOne({ _id: userIdRaw, isFake: false }).select("_id isBlock").lean();
    if (!user) {
      return res.status(404).json({ status: false, message: "Story Upload Failed" });
    }
    if (user.isBlock) {
      return res.status(403).json({ status: false, message: "Story Upload Failed" });
    }

    const expiresAt = new Date(Date.now() + MS_24H);
    const ts = new Date();
    // insertOne: avoids full Mongoose document hydration on the hot path
    const ins = await StoryFeed.collection.insertOne({
      userId: user._id,
      mediaUrl,
      mediaType,
      viewCount: 0,
      viewers: [],
      expiresAt,
      createdAt: ts,
      updatedAt: ts,
    });

    return res.status(201).json({
      status: true,
      message: "OK",
      data: {
        storyId: ins.insertedId,
        expiresAt,
      },
    });
  } catch (err) {
    return failUpload(res, err, api, userIdRaw);
  }
};

/**
 * POST /client/storyFeed/view
 * Never loads `viewers` into Node — dedupe is fully server-side via update filter.
 */
exports.viewStoryFeed = async (req, res) => {
  const api = "viewStoryFeed";
  const viewerRaw = req.body?.viewerUserId;
  const storyRaw = req.body?.storyId;
  try {
    if (!isNonEmptyString(storyRaw) || !mongoose.Types.ObjectId.isValid(storyRaw)) {
      return res.status(400).json({ status: false, message: "Story View Failed" });
    }
    if (!isNonEmptyString(viewerRaw) || !mongoose.Types.ObjectId.isValid(viewerRaw)) {
      return res.status(400).json({ status: false, message: "Story View Failed" });
    }

    const storyId = new mongoose.Types.ObjectId(storyRaw);
    const viewerId = new mongoose.Types.ObjectId(viewerRaw);
    const now = new Date();

    const [viewer, storyMeta] = await Promise.all([
      User.findOne({ _id: viewerId, isFake: false }).select("_id isBlock").lean(),
      StoryFeed.findOne({ _id: storyId }).select({ expiresAt: 1 }).lean(),
    ]);

    if (!viewer) {
      return res.status(404).json({ status: false, message: "Story View Failed" });
    }
    if (viewer.isBlock) {
      return res.status(403).json({ status: false, message: "Story View Failed" });
    }
    if (!storyMeta) {
      return res.status(404).json({ status: false, message: "Story View Failed" });
    }
    if (new Date(storyMeta.expiresAt) <= now) {
      return res.status(410).json({ status: false, message: "Story View Failed" });
    }

    const result = await StoryFeed.updateOne(
      {
        _id: storyId,
        expiresAt: { $gt: now },
        viewers: { $ne: viewerId },
      },
      {
        $addToSet: { viewers: viewerId },
        $inc: { viewCount: 1 },
      }
    );

    if (result.matchedCount > 0) {
      return res.status(200).json({ status: true, message: "OK", duplicate: false });
    }

    const snap = await StoryFeed.findOne({ _id: storyId }).select({ expiresAt: 1 }).lean();
    if (!snap) {
      return res.status(404).json({ status: false, message: "Story View Failed" });
    }
    if (new Date(snap.expiresAt) <= new Date()) {
      return res.status(410).json({ status: false, message: "Story View Failed" });
    }

    return res.status(200).json({ status: true, message: "OK", duplicate: true });
  } catch (err) {
    return failView(res, err, api, viewerRaw);
  }
};

/**
 * GET /client/storyFeed/feed
 * Single aggregation round-trip; bounded $match; maxTimeMS guard.
 */
exports.fetchStoryFeed = async (req, res) => {
  const api = "fetchStoryFeed";
  const viewerRaw = req.query?.viewerUserId;
  try {
    if (!isNonEmptyString(viewerRaw) || !mongoose.Types.ObjectId.isValid(viewerRaw)) {
      return res.status(400).json({ status: false, message: "Story Fetch Failed" });
    }

    const limit = Math.min(Math.max(parseInt(req.query?.limit, 10) || 50, 1), MAX_STORIES_PER_REQUEST);
    const viewerId = new mongoose.Types.ObjectId(viewerRaw);
    const now = new Date();
    const userColl = User.collection.collectionName;

    const viewer = await User.findOne({ _id: viewerId, isFake: false }).select("_id isBlock").lean();
    if (!viewer) {
      return res.status(404).json({ status: false, message: "Story Fetch Failed" });
    }
    if (viewer.isBlock) {
      return res.status(403).json({ status: false, message: "Story Fetch Failed" });
    }

    const authorIds = await buildAuthorIdList(viewerId);

    const pipeline = [
      {
        $match: {
          userId: { $in: authorIds },
          expiresAt: { $gt: now },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: userColl,
          localField: "userId",
          foreignField: "_id",
          as: "u",
          pipeline: [{ $project: { _id: 0, userName: 1, image: 1 } }],
        },
      },
      { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          mediaUrl: 1,
          mediaType: 1,
          viewCount: 1,
          createdAt: 1,
          expiresAt: 1,
          user: {
            username: "$u.userName",
            profileImage: "$u.image",
          },
        },
      },
    ];

    const stories = await StoryFeed.aggregate(pipeline)
      .option({ maxTimeMS: FEED_AGG_MAX_TIME_MS, allowDiskUse: false })
      .exec();

    const data = new Array(stories.length);
    for (let i = 0; i < stories.length; i++) {
      const s = stories[i];
      const u = s.user;
      const hasUser = u && (u.username != null || u.profileImage != null);
      data[i] = {
        _id: s._id,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        viewCount: s.viewCount,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        user: hasUser ? u : null,
      };
    }

    return res.status(200).json({ status: true, message: "OK", data });
  } catch (err) {
    return failFetch(res, err, api, viewerRaw);
  }
};
