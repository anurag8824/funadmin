const mongoose = require("mongoose");
const dayjs = require("dayjs");
const Post = require("../../models/post.model");
const Video = require("../../models/video.model");
const User = require("../../models/user.model");

/**
 * POST /client/save/toggle
 * Body: { userId, contentId, type: "post" | "reel" }
 */
exports.toggleSave = async (req, res) => {
  try {
    const { userId, contentId, type } = req.body || {};
    if (!userId || !contentId || !type || !["post", "reel"].includes(String(type).toLowerCase())) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const uid = new mongoose.Types.ObjectId(userId);
    const cid = new mongoose.Types.ObjectId(contentId);
    const t = String(type).toLowerCase();

    const user = await User.findOne({ _id: uid }).select("_id isBlock").lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }
    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (t === "post") {
      const post = await Post.findById(cid).select("_id savedBy").lean();
      if (!post) {
        return res.status(200).json({ status: false, message: "post does not found." });
      }
      const saved = Array.isArray(post.savedBy) && post.savedBy.some((id) => id.equals(uid));
      if (saved) {
        await Post.updateOne({ _id: cid }, { $pull: { savedBy: uid } });
        return res.status(200).json({ status: true, message: "Removed from saved.", isSaved: false });
      }
      await Post.updateOne({ _id: cid }, { $addToSet: { savedBy: uid } });
      return res.status(200).json({ status: true, message: "Saved successfully.", isSaved: true });
    }

    const video = await Video.findById(cid).select("_id savedBy").lean();
    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found." });
    }
    const saved = Array.isArray(video.savedBy) && video.savedBy.some((id) => id.equals(uid));
    if (saved) {
      await Video.updateOne({ _id: cid }, { $pull: { savedBy: uid } });
      return res.status(200).json({ status: true, message: "Removed from saved.", isSaved: false });
    }
    await Video.updateOne({ _id: cid }, { $addToSet: { savedBy: uid } });
    return res.status(200).json({ status: true, message: "Saved successfully.", isSaved: true });
  } catch (error) {
    console.error("toggleSave error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

function buildPostSavedPipeline(userOid, now) {
  return [
    {
      $addFields: {
        postImage: {
          $filter: {
            input: "$postImage",
            as: "image",
            cond: { $eq: ["$$image.isBanned", false] },
          },
        },
      },
    },
    { $match: { postImage: { $ne: [] } } },
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
        from: "postorvideocomments",
        localField: "_id",
        foreignField: "postId",
        as: "totalComments",
      },
    },
    {
      $lookup: {
        from: "hashtags",
        localField: "hashTagId",
        foreignField: "_id",
        as: "hashTag",
      },
    },
    {
      $lookup: {
        from: "likehistoryofpostorvideos",
        localField: "_id",
        foreignField: "postId",
        as: "totalLikes",
      },
    },
    {
      $lookup: {
        from: "likehistoryofpostorvideos",
        let: { postId: "$_id", userId: userOid },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$postId", "$$postId"] }, { $eq: ["$userId", "$$userId"] }],
              },
            },
          },
        ],
        as: "likeHistory",
      },
    },
    {
      $lookup: {
        from: "followerfollowings",
        let: { postUserId: "$userId", requestingUserId: userOid },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$toUserId", "$$postUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
              },
            },
          },
        ],
        as: "isFollow",
      },
    },
    {
      $project: {
        caption: 1,
        postImage: 1,
        shareCount: 1,
        isFake: 1,
        createdAt: 1,
        userId: "$user._id",
        isProfileImageBanned: "$user.isProfileImageBanned",
        name: "$user.name",
        userName: "$user.userName",
        userImage: "$user.image",
        isVerified: "$user.isVerified",
        hashTag: "$hashTag.hashTag",
        isLike: {
          $cond: {
            if: { $gt: [{ $size: "$likeHistory" }, 0] },
            then: true,
            else: false,
          },
        },
        isFollow: {
          $cond: {
            if: { $gt: [{ $size: "$isFollow" }, 0] },
            then: true,
            else: false,
          },
        },
        isSaved: { $literal: true },
        totalLikes: { $size: "$totalLikes" },
        totalComments: { $size: "$totalComments" },
        time: {
          $let: {
            vars: {
              timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
            },
            in: {
              $concat: [
                {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$timeDiff", 31536000000] },
                        then: {
                          $concat: [
                            { $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } },
                            " years ago",
                          ],
                        },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 2592000000] },
                        then: {
                          $concat: [
                            { $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } },
                            " months ago",
                          ],
                        },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 604800000] },
                        then: {
                          $concat: [
                            { $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } },
                            " weeks ago",
                          ],
                        },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 86400000] },
                        then: {
                          $concat: [
                            { $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } },
                            " days ago",
                          ],
                        },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 3600000] },
                        then: {
                          $concat: [
                            { $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } },
                            " hours ago",
                          ],
                        },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 60000] },
                        then: {
                          $concat: [
                            { $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } },
                            " minutes ago",
                          ],
                        },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 1000] },
                        then: {
                          $concat: [
                            { $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } },
                            " seconds ago",
                          ],
                        },
                      },
                      { case: true, then: "Just now" },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },
    { $sort: { createdAt: -1 } },
  ];
}

function buildVideoSavedPipeline(userOid, now) {
  return [
    { $match: { isBanned: false } },
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
        from: "hashtags",
        localField: "hashTagId",
        foreignField: "_id",
        as: "hashTag",
      },
    },
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
        from: "postorvideocomments",
        localField: "_id",
        foreignField: "videoId",
        as: "totalComments",
      },
    },
    {
      $lookup: {
        from: "likehistoryofpostorvideos",
        localField: "_id",
        foreignField: "videoId",
        as: "totalLikes",
      },
    },
    {
      $lookup: {
        from: "likehistoryofpostorvideos",
        let: { videoId: "$_id", userId: userOid },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
              },
            },
          },
        ],
        as: "likeHistory",
      },
    },
    {
      $lookup: {
        from: "followerfollowings",
        let: { postUserId: "$userId", requestingUserId: userOid },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$toUserId", "$$postUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
              },
            },
          },
        ],
        as: "isFollow",
      },
    },
    {
      $project: {
        caption: 1,
        videoImage: 1,
        videoUrl: 1,
        shareCount: 1,
        isFake: 1,
        songId: 1,
        createdAt: 1,
        videoTime: 1,
        hashTagId: 1,
        songTitle: "$song.songTitle",
        songImage: "$song.songImage",
        songLink: "$song.songLink",
        singerName: "$song.singerName",
        hashTag: "$hashTag.hashTag",
        userId: "$user._id",
        name: "$user.name",
        userName: "$user.userName",
        userImage: "$user.image",
        isVerified: "$user.isVerified",
        userIsFake: "$user.isFake",
        isProfileImageBanned: "$user.isProfileImageBanned",
        isLike: { $cond: { if: { $gt: [{ $size: "$likeHistory" }, 0] }, then: true, else: false } },
        isFollow: { $cond: { if: { $gt: [{ $size: "$isFollow" }, 0] }, then: true, else: false } },
        isSaved: { $literal: true },
        totalLikes: { $size: "$totalLikes" },
        totalComments: { $size: "$totalComments" },
        time: {
          $let: {
            vars: {
              timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
            },
            in: {
              $concat: [
                {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$timeDiff", 31536000000] },
                        then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 2592000000] },
                        then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 604800000] },
                        then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 86400000] },
                        then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 3600000] },
                        then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 60000] },
                        then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                      },
                      {
                        case: { $gte: ["$$timeDiff", 1000] },
                        then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                      },
                      { case: true, then: "Just now" },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },
    { $sort: { createdAt: -1 } },
  ];
}

/**
 * GET /client/save/getSaved?userId=...
 * Returns { status, message, data: { post: [], video: [] } } (feed-shaped items)
 */
exports.getSaved = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const userOid = new mongoose.Types.ObjectId(req.query.userId);
    const user = await User.findOne({ _id: userOid }).select("_id isBlock").lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }
    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    const now = dayjs();
    const postStages = buildPostSavedPipeline(userOid, now);
    const videoStages = buildVideoSavedPipeline(userOid, now);

    const [posts, videos] = await Promise.all([
      Post.aggregate([{ $match: { savedBy: userOid, isFake: false } }, ...postStages]),
      Video.aggregate([{ $match: { savedBy: userOid, isFake: false } }, ...videoStages]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Saved content retrieved.",
      data: {
        post: posts,
        video: videos,
      },
    });
  } catch (error) {
    console.error("getSaved error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
