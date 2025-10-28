const Post = require("../../models/post.model");

//mongoose
const mongoose = require("mongoose");

//import model
const User = require("../../models/user.model");
const LikeHistoryOfPostOrVideo = require("../../models/likeHistoryOfpostOrvideo.model");
const HashTag = require("../../models/hashTag.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const Report = require("../../models/report.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Notification = require("../../models/notification.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//generateUniqueVideoOrPostId
const { generateUniqueVideoOrPostId } = require("../../util/generateUniqueVideoOrPostId");

//day.js
const dayjs = require("dayjs");

//private key
const admin = require("../../util/privateKey");

//upload post by particular user
exports.uploadPost = async (req, res, next) => {
  try {
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

      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    if (req.body.postImage.length === 0) {
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

    const [uniquePostId, user] = await Promise.all([generateUniqueVideoOrPostId(), User.findOne({ _id: req.query.userId, isFake: false })]);

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

    post.uniquePostId = uniquePostId;
    post.userId = user._id;
    post.caption = req?.body?.caption || "";

    if (req?.body?.hashTagId) {
      const multipleHashTag = req?.body?.hashTagId.toString().split(",");
      post.hashTagId = multipleHashTag;

      await Promise.all(
        multipleHashTag.map(async (hashTagId) => {
          const hashTag = await HashTag.findById(hashTagId);
          if (hashTag) {
            const hashTagUsageHistory = new HashTagUsageHistory({
              userId: user._id,
              hashTagId,
              postId: post._id,
            });
            await hashTagUsageHistory.save();
          }
        })
      );
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

    console.log("Main Post Image: ", post.mainPostImage);
    console.log("All Post Images: ", post.postImage);

    post.uniquePostId = uniquePostId;
    await post.save();

    res.status(200).json({
      status: true,
      message: "Post has been uploaded by the user.",
      post: post,
    });

    if (req?.body?.postImage && Array.isArray(req.body.postImage) && settingJSON?.postBanned) {
      const posts = req.body.postImage.map((postImage) => ({
        url: postImage,
        isBanned: false,
      }));

      console.log("Posts ===============", posts);

      const checks = [];
      if (settingJSON.postBanned.includes("1")) checks.push("nudity-2.1");
      if (settingJSON.postBanned.includes("2")) checks.push("offensive");
      if (settingJSON.postBanned.includes("3")) checks.push("violence");
      if (settingJSON.postBanned.includes("4")) checks.push("gore-2.0");
      if (settingJSON.postBanned.includes("5")) checks.push("weapon");
      if (settingJSON.postBanned.includes("6")) checks.push("tobacco");
      if (settingJSON.postBanned.includes("7")) checks.push("recreational_drug,medical");
      if (settingJSON.postBanned.includes("8")) checks.push("gambling");
      if (settingJSON.postBanned.includes("9")) checks.push("alcohol");
      if (settingJSON.postBanned.includes("10")) checks.push("money");
      if (settingJSON.postBanned.includes("11")) checks.push("self-harm");

      console.log("Checks for image moderation =====================================", checks);

      if (checks.length > 0 && posts.length > 0) {
        await Promise.all(
          posts.map(async (postImage) => {
            try {
              const response = await axios.get("https://api.sightengine.com/1.0/check.json", {
                params: {
                  url: postImage.url,
                  models: checks.join(","),
                  api_user: "1278479424",
                  api_secret: "iHpMjkmpQGPbxc9ri8W48vjUdLk4xXv4",
                },
              });

              const result = response.data;
              console.log("Image moderation result for", postImage.url, ":", result);

              let isBanned = false;

              for (const check of checks) {
                if (
                  check === "nudity-2.1" &&
                  (result.nudity?.sexual_activity > 0.7 ||
                    result.nudity?.sexual_display > 0.7 ||
                    result.nudity?.erotica > 0.7 ||
                    result.nudity?.very_suggestive > 0.7 ||
                    result.nudity?.suggestive > 0.7 ||
                    result.nudity?.mildly_suggestive > 0.7)
                ) {
                  isBanned = true;
                }

                if (check === "offensive" && result.offensive?.prob > 0.7) isBanned = true;
                if (check === "violence" && result.violence?.prob > 0.7) isBanned = true;
                if (check === "gore-2.0" && result.gore?.prob > 0.7) isBanned = true;
                if (check === "weapon" && result.weapon?.prob > 0.7) isBanned = true;
                if (check === "tobacco" && result.tobacco?.prob > 0.7) isBanned = true;
                if (check === "recreational_drug,medical" && result.drugs?.prob > 0.7) isBanned = true;
                if (check === "gambling" && result.gambling?.prob > 0.7) isBanned = true;
                if (check === "alcohol" && result.alcohol?.prob > 0.7) isBanned = true;
                if (check === "money" && result.money?.prob > 0.7) isBanned = true;
                if (check === "self-harm" && result.selfharm?.prob > 0.7) isBanned = true;
              }

              const extractRelativeUrl = (url) => {
                const baseURL = process.env.baseURL;

                if (url.startsWith(baseURL)) {
                  return url.replace(baseURL, "");
                }
                return url;
              };

              const normalizedModeratedUrl = extractRelativeUrl(postImage.url);
              console.log("Normalized URL (from moderation):", normalizedModeratedUrl); // Output: "storage/1736145821859teenpatti.png"

              const updatedResult = await Post.updateOne(
                { _id: post._id, "postImage.url": normalizedModeratedUrl }, //
                { $set: { "postImage.$.isBanned": isBanned } }
              );

              console.log(`Image ${postImage.url} isBanned: ${isBanned}`);
              console.log("Image moderation update result: ", updatedResult);
            } catch (error) {
              console.log(`Error processing image ${postImage.url}:`, error.response?.data || error.message);
            }
          })
        );

        const updatedPost = await Post.findById(post._id);

        const bannedImages = updatedPost.postImage.filter((img) => img.isBanned);
        console.log("Total bannedImages:     ", bannedImages);

        if (bannedImages.length > 0 && user?.fcmToken !== null) {
          const adminPromise = await admin;

          const title = bannedImages.length > 1 ? "🚫 Issues with Submitted Images 🚫" : "🚫 Issue with Submitted Image 🚫";

          const body =
            bannedImages.length > 1
              ? `Several images (${bannedImages.length}) you submitted have been flagged. Please update them to proceed.`
              : `The image you submitted has been flagged. Please update it to proceed.`;

          const payload = {
            token: user?.fcmToken,
            notification: {
              title,
              body,
            },
            data: {
              type: "POST_IMAGE_BANNED",
              blockedCount: `${bannedImages.length}`,
            },
          };

          try {
            const response = await adminPromise.messaging().send(payload);
            console.log("Notification sent: ", response);
          } catch (error) {
            console.error("Error sending notification: ", error);
          }
        }
      } else {
        console.log("No checks selected or no image URL provided.");
      }
    }
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

    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error",
    });
  }
};

//update post by particular user
exports.updatePostByUser = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.postId) {
      return res.status(200).json({ status: false, message: "userId and postId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const [user, postOfUser] = await Promise.all([User.findOne({ _id: userId }), Post.findOne({ _id: postId, userId: userId })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!postOfUser) {
      return res.status(200).json({ status: false, message: "post does not found for this user." });
    }

    if (req?.body?.hashTagId) {
      const existingHistory = await HashTagUsageHistory.find({ userId: user._id, postId: postOfUser._id });

      if (existingHistory.length > 0) {
        console.log("Check if a history record already exists for the user and post");

        await HashTagUsageHistory.deleteMany({ userId: user._id, postId: postOfUser._id });
      }

      const multipleHashTag = req?.body?.hashTagId.toString().split(",");
      postOfUser.hashTagId = multipleHashTag.length > 0 ? multipleHashTag : [];

      await Promise.all(
        multipleHashTag.map(async (hashTagId) => {
          const hashTag = await HashTag.findById(hashTagId);

          if (hashTag) {
            console.log("Create a new history record if it doesn't exist");

            const hashTagUsageHistory = new HashTagUsageHistory({
              userId: user._id,
              postId: postOfUser._id,
              hashTagId: hashTagId,
            });
            await hashTagUsageHistory.save();
          }
        })
      );
    }

    postOfUser.location = req.body.location ? req.body.location : postOfUser.location;
    postOfUser.locationCoordinates.latitude = req.body.latitude ? req.body.latitude : postOfUser.latitude;
    postOfUser.locationCoordinates.longitude = req.body.longitude ? req.body.longitude : postOfUser.longitude;
    postOfUser.caption = req.body.caption ? req.body.caption : postOfUser.caption;
    await postOfUser.save();

    return res.status(200).json({ status: true, message: "Post has been updated.", data: postOfUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//if isFakeData on then real+fake posts otherwise fake posts
exports.getAllPosts = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    let now = dayjs();

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const userId = new mongoose.Types.ObjectId(req.query.userId);

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    if (req.query.postId) {
      const postId = new mongoose.Types.ObjectId(req.query.postId);

      const [user, post] = await Promise.all([User.findOne({ _id: userId }), Post.findById(postId)]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      if (!post) {
        return res.status(200).json({ status: false, message: "No post found with the provided ID." });
      }

      const data = [
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
        {
          $match: {
            postImage: { $ne: [] }, // Exclude documents where postImage is an empty array
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
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: false,
          },
        },
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
            let: { postId: "$_id", userId: userId },
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
            let: { postUserId: "$userId", requestingUserId: userId },
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
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 31536000000],
                                    },
                                  },
                                },
                                " years ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 2592000000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 2592000000],
                                    },
                                  },
                                },
                                " months ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 604800000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 604800000],
                                    },
                                  },
                                },
                                " weeks ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 86400000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 86400000],
                                    },
                                  },
                                },
                                " days ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 3600000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 3600000],
                                    },
                                  },
                                },
                                " hours ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 60000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 60000] },
                                  },
                                },
                                " minutes ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 1000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 1000] },
                                  },
                                },
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
      ];

      if (settingJSON.isFakeData) {
        const [realPostOfUser, fakePostOfUser] = await Promise.all([Post.aggregate([{ $match: { isFake: false } }, ...data]), Post.aggregate([{ $match: { isFake: true } }, ...data])]);

        let allPosts = [...realPostOfUser, ...fakePostOfUser];

        //allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allPosts = allPosts.sort(() => 0.5 - Math.random());

        const postIndex = allPosts.findIndex((post) => post._id.toString() === postId.toString());

        //If the postId is found, move it to the 0th index
        if (postIndex !== -1) {
          const [movedVideo] = allPosts.splice(postIndex, 1);
          allPosts.unshift(movedVideo);
        }

        const adjustedStart = postIndex !== -1 ? 1 : start;

        allPosts = allPosts.slice(adjustedStart - 1, adjustedStart - 1 + limit);

        return res.status(200).json({
          status: true,
          message: "Retrieve the posts uploaded by users.",
          post: allPosts,
        });
      } else {
        let realPostOfUser = await Post.aggregate([{ $match: { isFake: false } }, ...data]);

        //realPostOfUser.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        realPostOfUser = realPostOfUser.sort(() => 0.5 - Math.random());

        const videoIndex = realPostOfUser.findIndex((short) => short._id.toString() === postId.toString());

        //If the postId is found, move it to the 0th index
        if (videoIndex !== -1) {
          const [movedVideo] = realPostOfUser.splice(videoIndex, 1);
          realPostOfUser.unshift(movedVideo);
        }

        const adjustedStart = videoIndex !== -1 ? 1 : start;

        realPostOfUser = realPostOfUser.slice(adjustedStart - 1, adjustedStart - 1 + limit);

        return res.status(200).json({
          status: true,
          message: "Retrieve the posts uploaded by users.",
          post: realPostOfUser,
        });
      }
    } else {
      const user = await User.findOne({ _id: userId });

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      const data = [
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
        {
          $match: {
            postImage: { $ne: [] }, // Exclude documents where postImage is an empty array
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
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: false,
          },
        },
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
            let: { postId: "$_id", userId: userId },
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
            let: { postUserId: "$userId", requestingUserId: userId },
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
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 31536000000],
                                    },
                                  },
                                },
                                " years ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 2592000000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 2592000000],
                                    },
                                  },
                                },
                                " months ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 604800000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 604800000],
                                    },
                                  },
                                },
                                " weeks ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 86400000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 86400000],
                                    },
                                  },
                                },
                                " days ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 3600000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 3600000],
                                    },
                                  },
                                },
                                " hours ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 60000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 60000] },
                                  },
                                },
                                " minutes ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 1000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 1000] },
                                  },
                                },
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
      ];

      let allPosts;
      if (settingJSON.isFakeData) {
        const [realPostOfUser, fakePostOfUser] = await Promise.all([Post.aggregate([{ $match: { isFake: false } }, ...data]), Post.aggregate([{ $match: { isFake: true } }, ...data])]);

        allPosts = [...realPostOfUser, ...fakePostOfUser];
        //allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allPosts = allPosts.sort(() => 0.5 - Math.random());
      } else {
        allPosts = await Post.aggregate([{ $match: { isFake: false } }, ...data]);
        //allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allPosts = allPosts.sort(() => 0.5 - Math.random());
      }

      const paginatedPosts = allPosts.slice((start - 1) * limit, start * limit);

      return res.status(200).json({
        status: true,
        message: "Retrieve the posts uploaded by users.",
        post: paginatedPosts,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//get particular user's posts
exports.postsOfUser = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.toUserId) {
      return res.status(200).json({ status: false, message: "Both userId and toUserId are required." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId); // Logged-in userId
    const userIdOfPost = new mongoose.Types.ObjectId(req.query.toUserId); // userId of post

    const [user, posts] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      Post.aggregate([
        {
          $match: { userId: userIdOfPost },
        },
        {
          $project: {
            mainPostImage: 1,
            postImage: 1,
            caption: 1,
            createdAt: 1,
          },
        },
        ...(req.query.userId === req.query.toUserId
          ? [] // No filter for `isBanned` if userId matches toUserId
          : [
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
              {
                $match: { postImage: { $ne: [] } },
              },
            ]),
        {
          $sort: { createdAt: -1 },
        },
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
      message: "Retrieve posts of the particular user.",
      data: posts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete post of the particular user
exports.deletePostOfUser = async (req, res) => {
  try {
    if (!req.query.postId || !req.query.userId) {
      return res.status(200).json({
        status: false,
        message: "postId and userId must be requried.",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const [user, post] = await Promise.all([User.findOne({ _id: userId, isFake: false }), Post.findOne({ _id: postId, userId: userId, isFake: false })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!post) {
      return res.status(200).json({ status: false, message: "post does not found for that user." });
    }

    res.status(200).json({ status: true, message: "Post has been deleted by the user." });

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
      Notification.deleteMany({
        $or: [{ otherUserId: post?.userId }, { userId: post?.userId }],
      }),
      post.deleteOne(),
    ]);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error",
    });
  }
};

//like or dislike of particular post by the particular user
exports.likeOrDislikeOfPost = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.postId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const [user, post, alreadylikedPost] = await Promise.all([
      User.findOne({ _id: userId }).select("_id isBlock name"),
      Post.findById(postId),
      LikeHistoryOfPostOrVideo.findOne({ userId: userId, postId: postId }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!post) {
      return res.status(200).json({ status: false, message: "post does not found." });
    }

    if (alreadylikedPost) {
      await LikeHistoryOfPostOrVideo.deleteOne({
        userId: user._id,
        postId: post._id,
      });

      return res.status(200).json({
        status: true,
        message: "The post was marked with a dislike by the user.",
        isLike: false,
      });
    } else {
      console.log("else");

      const likeHistory = new LikeHistoryOfPostOrVideo();

      likeHistory.userId = user._id;
      likeHistory.postId = post._id;
      likeHistory.uploaderId = post.userId;
      await likeHistory.save();

      res.status(200).json({
        status: true,
        message: "The post was marked with a like by the user.",
        isLike: true,
      });

      const postUser = await User.findOne({ _id: post?.userId }).lean();

      //checks if the user has an fcmToken
      if (postUser && postUser.fcmToken && postUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: postUser?.fcmToken,
          notification: {
            title: `${user.name || "Post Liked"}`,
            body: "Hey there! A user has just liked your post. Check it out now!",
          },
          data: {
            type: "POSTLIKE",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);

            const notification = new Notification();
            notification.userId = userId; //login userId i.e, to whom notification send
            notification.otherUserId = postUser._id;
            notification.title = user?.name || "Post Liked";
            notification.message = "Hey there! A user has just liked your post. Check it out now!";
            notification.image = post.mainPostImage;
            notification.date = new Date().toLocaleString("en-US", {
              timeZone: "Asia/Kolkata",
            });
            await notification.save();
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//when user share the post then shareCount of the particular post increased
exports.shareCountOfPost = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.postId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const postId = new mongoose.Types.ObjectId(req.query.postId);

    const [user, post] = await Promise.all([User.findOne({ _id: userId }), Post.findById(postId)]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!post) {
      return res.status(200).json({ status: false, message: "post does not found." });
    }

    post.shareCount += 1;
    await post.save();

    return res.status(200).json({
      status: true,
      message: "post has been shared by the user then shareCount has been increased.",
      post: post,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete post
exports.deleteParticularPost = async (req, res) => {
  try {
    if (!req.query.postId) {
      return res.status(200).json({ status: false, message: "postId must be required." });
    }

    const post = await Post.findById(req.query.postId);
    if (!post) {
      return res.status(200).json({ status: false, message: "No post found with the provided ID." });
    }

    res.status(200).json({ status: true, message: "Success." });

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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get particular user's posts ( web )
exports.postsOfUserWeb = async (req, res) => {
  try {
    if (!req.query.toUserId) {
      return res.status(200).json({ status: false, message: "Both userId and toUserId are required." });
    }

    if (req.query.userId && req.query.userId != undefined) {
      const userId = new mongoose.Types.ObjectId(req.query.userId); // Logged-in userId
      const userIdOfPost = new mongoose.Types.ObjectId(req.query.toUserId); // userId of post

      const [user, posts] = await Promise.all([
        User.findOne({ _id: userId }).lean(),
        Post.aggregate([
          {
            $match: { userId: userIdOfPost },
          },
          {
            $project: {
              mainPostImage: 1,
              postImage: 1,
              caption: 1,
              createdAt: 1,
            },
          },
          ...(req.query.userId === req.query.toUserId
            ? [] // No filter for `isBanned` if userId matches toUserId
            : [
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
                {
                  $match: { postImage: { $ne: [] } },
                },
              ]),
          {
            $sort: { createdAt: -1 },
          },
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
        message: "Retrieve posts of the particular user.",
        data: posts,
      });
    } else {
      const userIdOfPost = new mongoose.Types.ObjectId(req.query.toUserId); // userId of post

      const posts = await Post.aggregate([
        {
          $match: { userId: userIdOfPost },
        },
        {
          $project: {
            mainPostImage: 1,
            postImage: 1,
            caption: 1,
            createdAt: 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrieve posts of the particular user.",
        data: posts,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//if isFakeData on then real+fake posts otherwise fake posts ( web )
exports.retrieveAllPosts = async (req, res, next) => {
  try {
    let now = dayjs();

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    if (req.query.userId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
        return res.status(200).json({
          status: false,
          message: "Invalid userId format. It must be a valid ObjectId.",
        });
      }

      const userId = new mongoose.Types.ObjectId(req.query.userId);

      const user = await User.findOne({ _id: userId }).select("_id isBlock").lean();

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      const data = [
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
        {
          $match: {
            postImage: { $ne: [] }, // Exclude documents where postImage is an empty array
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
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: false,
          },
        },
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
            let: { postId: "$_id", userId: userId },
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
            let: { postUserId: "$userId", requestingUserId: userId },
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
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 31536000000],
                                    },
                                  },
                                },
                                " years ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 2592000000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 2592000000],
                                    },
                                  },
                                },
                                " months ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 604800000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 604800000],
                                    },
                                  },
                                },
                                " weeks ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 86400000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 86400000],
                                    },
                                  },
                                },
                                " days ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 3600000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 3600000],
                                    },
                                  },
                                },
                                " hours ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 60000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 60000] },
                                  },
                                },
                                " minutes ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 1000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 1000] },
                                  },
                                },
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
      ];

      let allPosts;
      if (settingJSON.isFakeData) {
        const [realPostOfUser, fakePostOfUser] = await Promise.all([Post.aggregate([{ $match: { isFake: false } }, ...data]), Post.aggregate([{ $match: { isFake: true } }, ...data])]);

        allPosts = [...realPostOfUser, ...fakePostOfUser];
        //allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allPosts = allPosts.sort(() => 0.5 - Math.random());
      } else {
        allPosts = await Post.aggregate([{ $match: { isFake: false } }, ...data]);
        //allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allPosts = allPosts.sort(() => 0.5 - Math.random());
      }

      const paginatedPosts = allPosts.slice((start - 1) * limit, start * limit);

      return res.status(200).json({
        status: true,
        message: "Retrieve the posts uploaded by users.",
        post: paginatedPosts,
      });
    } else {
      const data = [
        {
          $addFields: {
            postImage: {
              $filter: {
                input: "$postImage",
                as: "image",
                cond: { $eq: ["$$image.isBanned", false] },
              },
            },
            isLike: false,
            isFollow: false,
          },
        },
        {
          $match: {
            postImage: { $ne: [] }, // Exclude documents where postImage is an empty array
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
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: false,
          },
        },
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
          $project: {
            caption: 1,
            postImage: 1,
            shareCount: 1,
            isFake: 1,
            isLike: 1,
            isFollow: 1,
            createdAt: 1,
            userId: "$user._id",
            isProfileImageBanned: "$user.isProfileImageBanned",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isVerified: "$user.isVerified",
            hashTag: "$hashTag.hashTag",
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
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 31536000000],
                                    },
                                  },
                                },
                                " years ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 2592000000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 2592000000],
                                    },
                                  },
                                },
                                " months ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 604800000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 604800000],
                                    },
                                  },
                                },
                                " weeks ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 86400000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 86400000],
                                    },
                                  },
                                },
                                " days ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 3600000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: {
                                      $divide: ["$$timeDiff", 3600000],
                                    },
                                  },
                                },
                                " hours ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 60000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 60000] },
                                  },
                                },
                                " minutes ago",
                              ],
                            },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 1000] },
                            then: {
                              $concat: [
                                {
                                  $toString: {
                                    $floor: { $divide: ["$$timeDiff", 1000] },
                                  },
                                },
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
      ];

      let allPosts;
      if (settingJSON.isFakeData) {
        const [realPostOfUser, fakePostOfUser] = await Promise.all([Post.aggregate([{ $match: { isFake: false } }, ...data]), Post.aggregate([{ $match: { isFake: true } }, ...data])]);

        allPosts = [...realPostOfUser, ...fakePostOfUser];
        //allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allPosts = allPosts.sort(() => 0.5 - Math.random());
      } else {
        allPosts = await Post.aggregate([{ $match: { isFake: false } }, ...data]);
        //allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allPosts = allPosts.sort(() => 0.5 - Math.random());
      }

      const paginatedPosts = allPosts.slice((start - 1) * limit, start * limit);

      return res.status(200).json({
        status: true,
        message: "Retrieve the posts uploaded by users.",
        post: paginatedPosts,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};
