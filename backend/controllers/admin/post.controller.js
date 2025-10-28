const Post = require("../../models/post.model");

//import model
const User = require("../../models/user.model");
const HashTag = require("../../models/hashTag.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const LikeHistoryOfPostOrVideo = require("../../models/likeHistoryOfpostOrvideo.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Notification = require("../../models/notification.model");
const Report = require("../../models/report.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//mongoose
const mongoose = require("mongoose");

//generateUniqueVideoOrPostId
const { generateUniqueVideoOrPostId } = require("../../util/generateUniqueVideoOrPostId");

//upload fake post
exports.uploadfakePost = async (req, res, next) => {
  try {
    console.log("body: ", req.body);

    if (!req.query.userId) {
      if (req?.body?.postImage && Array.isArray(req.body.postImage)) {
        const imageUrls = req.body.postImage;

        if (imageUrls.length > 0) {
          await deleteFromStorage(imageUrls)
            .then(() => {
              console.log("Images deleted from storage successfully");
            })
            .catch((err) => {
              console.log("Error deleting images from storage:", err);
            });
        }
      }

      return res.status(200).json({ status: false, message: "userId must be required." });
    }

    if (!req.body.caption || !req.body.hashTagId || !req.body.postImage) {
      if (req?.body?.postImage && Array.isArray(req.body.postImage)) {
        const imageUrls = req.body.postImage;
        if (imageUrls.length > 0) {
          await deleteFromStorage(imageUrls)
            .then(() => {
              console.log("Images deleted from storage successfully");
            })
            .catch((err) => {
              console.log("Error deleting images from storage:", err);
            });
        }
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [uniquePostId, user] = await Promise.all([generateUniqueVideoOrPostId(), User.findOne({ _id: userId, isFake: true })]);

    if (!user) {
      if (req?.body?.postImage && Array.isArray(req.body.postImage)) {
        const imageUrls = req.body.postImage;
        if (imageUrls.length > 0) {
          await deleteFromStorage(imageUrls)
            .then(() => {
              console.log("Images deleted from storage successfully");
            })
            .catch((err) => {
              console.log("Error deleting images from storage:", err);
            });
        }
      }

      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req?.body?.postImage && Array.isArray(req.body.postImage)) {
        const imageUrls = req.body.postImage;
        if (imageUrls.length > 0) {
          await deleteFromStorage(imageUrls)
            .then(() => {
              console.log("Images deleted from storage successfully");
            })
            .catch((err) => {
              console.log("Error deleting images from storage:", err);
            });
        }
      }

      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    const post = new Post();

    post.userId = user._id;
    post.caption = req.body.caption;

    let hashTagPromises = [];
    if (req?.body?.hashTagId.length > 0) {
      const multipleHashTag = req?.body?.hashTagId.toString().split(",");
      post.hashTagId = multipleHashTag;

      //create history for each hashtag used
      hashTagPromises = multipleHashTag.map(async (hashTagId) => {
        const hashTag = await HashTag.findById(hashTagId);
        if (hashTag) {
          const hashTagUsageHistory = new HashTagUsageHistory({
            userId: user._id,
            hashTagId: hashTagId,
            postId: post._id,
          });
          await hashTagUsageHistory.save();
        }
      });
    }

    //multiple postImage
    if (req.body.postImage.length > 0) {
      const postImageData = await Promise.all(
        req.body.postImage.map((postImage) => ({
          url: postImage,
          isBanned: false,
        }))
      );

      post.mainPostImage = postImageData[0]?.url;
      post.postImage = postImageData;
    }

    console.log("Main Fake Post Image: ", post.mainPostImage);
    console.log("All Fake Post Images: ", post.postImage);

    post.isFake = true;
    post.uniquePostId = uniquePostId;

    await Promise.all([...hashTagPromises, post.save()]);

    const data = await Post.findById(post._id).populate("userId", "name userName image").populate("hashTagId", "hashTag hashTagIcon");

    return res.status(200).json({ status: true, message: "Post has been uploaded by the admin.", data: data });
  } catch (error) {
    console.log(error);

    if (req?.body?.postImage && Array.isArray(req.body.postImage)) {
      const imageUrls = req.body.postImage;
      if (imageUrls.length > 0) {
        await deleteFromStorage(imageUrls)
          .then(() => {
            console.log("Images deleted from storage successfully");
          })
          .catch((err) => {
            console.log("Error deleting images from storage:", err);
          });
      }
    }

    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//update fake post
exports.updatefakePost = async (req, res, next) => {
  try {
    console.log("body update post: ", req.body);

    if (!req.query.userId || !req.query.postId) {
      if (req?.body?.postImage && Array.isArray(req.body.postImage)) {
        const imageUrls = req.body.postImage;
        if (imageUrls.length > 0) {
          await deleteFromStorage(imageUrls)
            .then(() => {
              console.log("Images deleted from storage successfully");
            })
            .catch((err) => {
              console.log("Error deleting images from storage:", err);
            });
        }
      }

      return res.status(200).json({ status: false, message: "userId and postId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const [user, fakePostOfUser] = await Promise.all([User.findOne({ _id: userId }), Post.findOne({ _id: postId, userId: userId })]);

    if (!user) {
      if (req?.body?.postImage && Array.isArray(req.body.postImage)) {
        const imageUrls = req.body.postImage;
        if (imageUrls.length > 0) {
          await deleteFromStorage(imageUrls)
            .then(() => {
              console.log("Images deleted from storage successfully");
            })
            .catch((err) => {
              console.log("Error deleting images from storage:", err);
            });
        }
      }

      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req?.body?.postImage && Array.isArray(req.body.postImage)) {
        const imageUrls = req.body.postImage;
        if (imageUrls.length > 0) {
          await deleteFromStorage(imageUrls)
            .then(() => {
              console.log("Images deleted from storage successfully");
            })
            .catch((err) => {
              console.log("Error deleting images from storage:", err);
            });
        }
      }

      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!fakePostOfUser) {
      if (req?.body?.postImage && Array.isArray(req.body.postImage)) {
        const imageUrls = req.body.postImage;
        if (imageUrls.length > 0) {
          await deleteFromStorage(imageUrls)
            .then(() => {
              console.log("Images deleted from storage successfully");
            })
            .catch((err) => {
              console.log("Error deleting images from storage:", err);
            });
        }
      }

      return res.status(200).json({ status: false, message: "post does not found for this user." });
    }

    if (Array.isArray(req?.body?.removeImageIndexes) && req?.body?.removeImageIndexes.length > 0) {
      req?.body?.removeImageIndexes.sort((a, b) => b - a);

      for (let index of req?.body?.removeImageIndexes) {
        if (index >= 0 && index < fakePostOfUser.postImage.length) {
          const imageUrl = fakePostOfUser.postImage[index]?.url;
          if (imageUrl) {
            await deleteFromStorage(imageUrl);
          }

          fakePostOfUser.postImage.splice(index, 1);
        }
      }
    }

    if (req?.body?.postImage) {
      var postImageData = [];

      const newImages = req.body.postImage.map((img) => ({
        url: img,
        isBanned: false,
      }));

      postImageData = [...newImages];

      fakePostOfUser.mainPostImage = postImageData[0]?.url;
      fakePostOfUser.postImage = postImageData;
    }

    fakePostOfUser.location = req.body.location ? req.body.location : fakePostOfUser.location;
    fakePostOfUser.locationCoordinates.latitude = req.body.latitude ? req.body.latitude : fakePostOfUser.latitude;
    fakePostOfUser.locationCoordinates.longitude = req.body.longitude ? req.body.longitude : fakePostOfUser.longitude;
    fakePostOfUser.caption = req.body.caption ? req.body.caption : fakePostOfUser.caption;
    await fakePostOfUser.save();

    const data = await Post.findById(fakePostOfUser._id).populate("userId", "name userName image");

    return res.status(200).json({ status: true, message: "fake post has been updated by the admin.", data: data });
  } catch (error) {
    if (req?.body?.postImage && Array.isArray(req.body.postImage)) {
      for (let imageUrl of req.body.postImage) {
        if (imageUrl) {
          await deleteFromStorage(imageUrl);
        }
      }
    }

    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//get real or fake posts
exports.getPosts = async (req, res, next) => {
  try {
    if (!req.query.startDate || !req.query.endDate || !req.query.type) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let dateFilterQuery = {};
    if (req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    if (req.query.type === "realPost") {
      const [totalrealPostOfUser, realPostOfUser] = await Promise.all([
        Post.countDocuments({ isFake: false, ...dateFilterQuery }),
        Post.aggregate([
          { $match: { isFake: false, ...dateFilterQuery } },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideos",
              localField: "_id",
              foreignField: "postId",
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "hashtags",
              localField: "hashTagId",
              foreignField: "_id",
              as: "hashTags",
            },
          },
          {
            $lookup: {
              from: "postorvideocomments",
              localField: "_id",
              foreignField: "postId",
              as: "comments",
            },
          },
          {
            $project: {
              caption: 1,
              mainPostImage: 1,
              postImage: 1,
              location: 1,
              shareCount: 1,
              isFake: 1,
              createdAt: 1,
              totalLikes: { $size: "$likes" },
              totalComments: { $size: "$comments" },
              userId: "$user._id",
              name: "$user.name",
              userName: "$user.userName",
              userImage: "$user.image",
              hashTags: "$hashTags",
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: (start - 1) * limit }, //how many records you want to skip
          { $limit: limit },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: `Retrive real posts of the users.`,
        total: totalrealPostOfUser,
        data: realPostOfUser,
      });
    } else if (req.query.type === "fakePost") {
      const [totalfakePostOfUser, fakePostOfUser] = await Promise.all([
        Post.countDocuments({ isFake: true, ...dateFilterQuery }),
        Post.aggregate([
          { $match: { isFake: true, ...dateFilterQuery } },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $lookup: {
              from: "hashtags",
              localField: "hashTagId",
              foreignField: "_id",
              as: "hashTags",
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideos",
              localField: "_id",
              foreignField: "postId",
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "postorvideocomments",
              localField: "_id",
              foreignField: "postId",
              as: "comments",
            },
          },
          {
            $project: {
              caption: 1,
              mainPostImage: 1,
              postImage: 1,
              shareCount: 1,
              isFake: 1,
              location: 1,
              createdAt: 1,
              totalLikes: { $size: "$likes" },
              totalComments: { $size: "$comments" },
              userId: "$user._id",
              name: "$user.name",
              userName: "$user.userName",
              userImage: "$user.image",
              hashTags: "$hashTags",
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: (start - 1) * limit }, //how many records you want to skip
          { $limit: limit },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: `Retrive fake posts of the users.`,
        total: totalfakePostOfUser,
        data: fakePostOfUser,
      });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get particular user's posts
exports.getUserPost = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be required." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, totalPostOfUser, posts] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      Post.countDocuments({ userId: userId }),
      Post.aggregate([
        { $match: { userId: userId } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "postId",
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "postId",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashTagId",
            foreignField: "_id",
            as: "hashTags",
          },
        },
        {
          $project: {
            caption: 1,
            mainPostImage: 1,
            postImage: 1,
            shareCount: 1,
            isFake: 1,
            location: 1,
            createdAt: 1,
            totalLikes: { $size: "$likes" },
            totalComments: { $size: "$comments" },
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            hashTags: "$hashTags",
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit }, //how many records you want to skip
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive posts of the particular user.",
      total: totalPostOfUser,
      data: posts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get particular post details
exports.getDetailOfPost = async (req, res, next) => {
  try {
    if (!req.query.postId) {
      return res.status(200).json({ status: false, message: "postId must be required." });
    }

    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const post = await Post.findOne({ _id: postId }).lean();
    if (!post) {
      return res.status(200).json({ status: false, message: "Post does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive post's details.",
      data: post,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete post
exports.deletePost = async (req, res) => {
  try {
    if (!req.query.postId) {
      return res.status(200).json({ status: false, message: "postId must be requried." });
    }

    const postIds = req.query.postId.split(",");

    const posts = await Promise.all(postIds.map((Id) => Post.findById(Id)));
    if (posts.some((post) => !post)) {
      return res.status(200).json({ status: false, message: "No posts found with the provided IDs." });
    }

    res.status(200).json({ status: true, message: "Post has been deleted by the admin." });

    await posts.map(async (post) => {
      if (post?.mainPostImage) {
        await deleteFromStorage(post?.mainPostImage);
      }

      if (post.postImage.length > 0) {
        for (let imageObj of post?.postImage) {
          const imageUrl = imageObj.url; // Extract URL from object

          if (imageUrl) {
            await deleteFromStorage(imageUrl);
          }
        }
      }

      await Promise.all([
        LikeHistoryOfPostOrVideo.deleteMany({ postId: post._id }),
        PostOrVideoComment.deleteMany({ postId: post._id }),
        LikeHistoryOfpostOrvideoComment.deleteMany({ postId: post._id }),
        HashTagUsageHistory.deleteMany({ postId: post._id }),
        Report.deleteMany({ postId: post._id }),
        Notification.deleteMany({ $or: [{ otherUserId: post?.userId }, { userId: post?.userId }] }),
        post.deleteOne(),
      ]);
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};
