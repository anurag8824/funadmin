const User = require("../../models/user.model");

//import model
const FollowerFollowing = require("../../models/followerFollowing.model");
const LikeHistoryOfPostOrVideo = require("../../models/likeHistoryOfpostOrvideo.model");
const History = require("../../models/history.model");
const SearchHistory = require("../../models/searchHistory.model");
const Notification = require("../../models/notification.model");
const ChatTopic = require("../../models/chatTopic.model");
const Chat = require("../../models/chat.model");
const Video = require("../../models/video.model");
const Post = require("../../models/post.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Report = require("../../models/report.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const WatchHistory = require("../../models/watchHistory.model");
const Complaint = require("../../models/complaint.model");
const WithdrawRequest = require("../../models/withDrawRequest.model");
const VerificationRequest = require("../../models/verificationRequest.model");
const SongFavorite = require("../../models/songFavorite.model");
const LiveHistory = require("../../models/liveHistory.model");
const ChatRequestTopic = require("../../models/chatRequestTopic.model");
const ChatRequest = require("../../models/chatRequest.model");
const Story = require("../../models/story.model");
const StoryView = require("../../models/storyView.model");
const StoryReaction = require("../../models/storyReaction.model");

//mongoose
const mongoose = require("mongoose");

//Cryptr
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//generateUniqueId
const { generateUniqueId } = require("../../util/generateUniqueId");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//private key
const admin = require("../../util/privateKey");

//user function
const userFunction = async (user, data_) => {
  const data = data_.body;

  user.name = data?.name ? data?.name?.trim() : user.name;
  user.userName = data?.userName ? data?.userName?.trim() : user.userName;
  user.gender = data?.gender ? data?.gender?.toLowerCase().trim() : user.gender;
  user.bio = data?.bio ? data?.bio?.trim() : user.bio;
  user.age = data?.age ? data?.age : user.age;

  if (data.image) {
    user.image = data.image;
  } else {
    user.image = user.image;
  }

  user.email = data?.email ? data?.email?.trim() : user.email;
  user.mobileNumber = data.mobileNumber ? data.mobileNumber : user.mobileNumber;

  user.countryFlagImage = data.countryFlagImage ? data.countryFlagImage : user.countryFlagImage;
  user.country = data.country ? data.country : user.country;
  user.ipAddress = data.ipAddress ? data.ipAddress : user.ipAddress;

  user.loginType = data.loginType ? data.loginType : user.loginType;
  user.identity = data.identity ? data.identity : user.identity;
  user.fcmToken = data.fcmToken ? data.fcmToken : user.fcmToken;
  user.uniqueId = !user.uniqueId ? await generateUniqueId() : user.uniqueId;

  await user.save();
  return user;
};

//check the user is exists or not with loginType 3 quick(identity)
exports.checkUser = async (req, res) => {
  try {
    if (!req.query.identity) {
      return res.status(200).json({ status: false, message: "identity must be requried." });
    }

    const user = await User.findOne({ identity: req.query.identity, loginType: 3 });
    if (user) {
      return res.status(200).json({
        status: true,
        message: "User login Successfully.",
        isLogin: true,
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "User must have to sign up.",
        isLogin: false,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error",
    });
  }
};

//user login and sign up
exports.loginOrSignUp = async (req, res) => {
  try {
    if (!req.body.identity || req.body.loginType === undefined || !req.body.fcmToken) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    let userQuery;

    const loginType = req?.body?.loginType;
    const identity = req?.body?.identity;

    if (loginType === 1) {
      if (!req.body.mobileNumber) {
        return res.status(200).json({ status: false, message: "mobileNumber must be required." });
      }

      userQuery = await User.findOne({ mobileNumber: req.body.mobileNumber?.trim() });
    } else if (loginType === 2) {
      if (!req.body.email) {
        return res.status(200).json({ status: false, message: "email must be required." });
      }

      userQuery = await User.findOne({ email: req?.body?.email?.trim() });
    } else if (loginType === 3) {
      if (!req.body.identity) {
        return res.status(200).json({ status: false, message: "identity must be required." });
      }

      userQuery = await User.findOne({ identity: identity, email: req?.body?.email?.trim() }); //email field always be identity
    } else if (loginType === 4) {
      if (!req.body.email) {
        return res.status(200).json({ status: false, message: "email must be required." });
      }

      userQuery = await User.findOne({ email: req?.body?.email?.trim(), loginType: 4 });
    } else {
      return res.status(200).json({ status: false, message: "loginType must be passed valid." });
    }

    const user = userQuery;

    if (user) {
      console.log("User is already exist ............");

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "You are blocked by the admin." });
      }

      user.image = req.body.image ? req.body.image.trim() : user.image;
      user.name = req.body.name ? req.body.name.trim() : user.name;
      user.userName = req.body.userName ? req.body.userName.trim() : user.userName;
      user.fcmToken = req.body.fcmToken ? req.body.fcmToken.trim() : user.fcmToken;
      user.lastlogin = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

      if (loginType === 3) {
        const user_ = await userFunction(user, req);

        return res.status(200).json({
          status: true,
          message: "The user has successfully logged in.",
          user: user_,
          signUp: false,
        });
      }

      return res.status(200).json({
        status: true,
        message: "The user has successfully logged in.",
        user: user,
        signUp: false,
      });
    } else {
      console.log("User signup:    ");

      const uniqueId = generateHistoryUniqueId();
      const bonusCoins = settingJSON.loginBonus ? settingJSON.loginBonus : 5000;

      const newUser = new User();
      newUser.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      newUser.coin = bonusCoins;

      const user = await userFunction(newUser, req);

      res.status(200).json({
        status: true,
        message: "A new user has registered an account.",
        signUp: true,
        user: user,
      });

      await History.create({
        otherUserId: newUser._id,
        coin: bonusCoins,
        uniqueId: uniqueId,
        type: 5,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });

      if (user.fcmToken && user.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: user.fcmToken,
          notification: {
            title: "🎁 Welcome Bonus! 🎁",
            body: "✨ Congratulations! You have received a login bonus. Thank you for joining us.",
          },
          data: {
            type: "LOGINBONUS",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }

      if (req?.body?.image && settingJSON.postBanned) {
        const userImage = req?.body?.image;

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

        console.log("Checks for user image moderation =====================================", checks);

        if (checks.length > 0 && userImage) {
          try {
            const response = await axios.get("https://api.sightengine.com/1.0/check.json", {
              params: {
                url: userImage,
                models: checks.join(","),
                api_user: settingJSON?.sightengineUser,
                api_secret: settingJSON?.sightengineSecret,
              },
            });

            const result = response.data;
            console.log("Image moderation result for user profile image: ", userImage, ":", result);

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

            await User.updateOne(
              { _id: user._id }, //
              { isProfileImageBanned: isBanned }
            );

            console.log(`Image ${userImage} isBanned for user profile image:: ${isBanned}`);

            if (isBanned && user?.fcmToken !== null) {
              const adminPromise = await admin;

              const payload = {
                token: user?.fcmToken,
                notification: {
                  title: "🚫 Profile Picture Policy Violation 🚫",
                  body: "The profile picture you updated doesn’t follow our guidelines. Please upload a compliant image to ensure uninterrupted access. Thank you for your cooperation! 🙏",
                },
                data: {
                  type: "PROFILE_PICTURE_BANNED",
                },
              };

              try {
                if (isBanned) {
                  const response = await adminPromise.messaging().send(payload);
                  console.log("Successfully sent notification: ", response);
                } else {
                  console.log("Profile picture not banned");
                }
              } catch (error) {
                console.error("Error sending notification: ", error);
              }
            }
          } catch (error) {
            console.log(`Error processing user profile image: ${userImage}:`, error.response?.data || error.message);
          }
        } else {
          console.log("No checks selected or no image URL provided.");
        }
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//update profile of the user
exports.update = async (req, res) => {
  try {
    if (!req.query.userId) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({
        status: false,
        message: "Invalid userId format. It must be a valid ObjectId.",
      });
    }

    const [user, existingUser] = await Promise.all([User.findOne({ _id: req.query.userId }), req?.body?.userName.trim() ? User.findOne({ userName: req.body.userName.trim() })?.lean() : null]);

    if (!user) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (req.body.userName) {
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        if (req?.body?.image) {
          await deleteFromStorage(req?.body?.image);
        }

        return res.status(200).json({ status: false, message: "This username is already taken by another user." });
      }

      user.userName = req.body.userName.trim();
    }

    if (req?.body?.image) {
      await deleteFromStorage(user?.image);

      user.image = req?.body?.image ? req?.body?.image : user.image;
    }

    user.name = req.body.name ? req.body.name : user.name;
    user.userName = req.body.userName ? req.body.userName : user.userName;
    user.mobileNumber = req.body.mobileNumber ? req.body.mobileNumber : user.mobileNumber;
    user.gender = req.body.gender ? req.body.gender?.toLowerCase()?.trim() : user.gender;
    user.bio = req.body.bio ? req.body.bio : user.bio;
    user.countryFlagImage = req.body.countryFlagImage ? req.body.countryFlagImage : user.countryFlagImage;
    user.country = req.body.country ? req.body.country : user.country;
    await user.save();

    return res.status(200).json({ status: true, message: "The user's profile has been modified.", user: user });
  } catch (error) {
    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get user profile who login
exports.getProfile = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const user = await User.findOne({ _id: req.query.userId }).lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "The user has retrieved their profile.", user: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//get user profile with total count of followers, total count of following and total count of videos and posts's likes (for own user profile)
exports.getUserProfile = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.toUserId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const userIdOfPostOrVideo = new mongoose.Types.ObjectId(req.query.toUserId);

    const [user, isFollow, totalFollowers, totalFollowing, totalLikesOfVideoPost] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      FollowerFollowing.findOne({ fromUserId: userIdOfPostOrVideo, toUserId: userId }).lean(),
      FollowerFollowing.countDocuments({ toUserId: userId }),
      FollowerFollowing.countDocuments({ fromUserId: userId }),
      LikeHistoryOfPostOrVideo.countDocuments({ uploaderId: userId }),
    ]);

    const userProfileData = {
      user: {
        name: user?.name,
        userName: user.userName,
        bio: user.bio,
        gender: user.gender,
        image: user.image,
        countryFlagImage: user.countryFlagImage,
        country: user.country,
        isVerified: user.isVerified,
        isFollow: !!isFollow,
        isFake: user.isFake,
        isProfileImageBanned: user.isProfileImageBanned,
      },
      totalFollowers,
      totalFollowing,
      totalLikesOfVideoPost,
    };

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrieve the profile information.",
      userProfileData: userProfileData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get user's coin
exports.getUserCoin = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const user = await User.findOne({ _id: req.query.userId }).lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "The user has retrieved their profile.", userCoin: user.coin });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//get all reveived gift by user
exports.receviedGiftByUser = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, history] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      History.aggregate([
        {
          $match: {
            $and: [{ otherUserId: userId }, { type: 1 }, { giftId: { $ne: null } }],
          },
        },
        {
          $lookup: {
            from: "gifts",
            localField: "giftId",
            foreignField: "_id",
            as: "gift",
          },
        },
        {
          $unwind: {
            path: "$gift",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$gift",
            total: { $sum: 1 }, //total of particular gift received by particular user
            giftCoin: { $first: "$gift.coin" },
            giftImage: { $first: "$gift.image" },
            giftSvgaImage: { $first: "$gift.svgaImage" },
            giftType: { $first: "$gift.type" },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            giftCoin: 1,
            giftImage: 1,
            giftSvgaImage: 1,
            giftType: 1,
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
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "Retrieve all gifts that have been received.", data: history });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

//update password
exports.updatePassword = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    if (!req.body.oldPass || !req.body.newPass || !req.body.confirmPass) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const user = await User.findOne({ _id: req.query.userId });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (cryptr.decrypt(user.password) !== req.body.oldPass) {
      return res.status(200).json({ status: false, message: "Oops ! Password doesn't match." });
    }

    if (req.body.newPass !== req.body.confirmPass) {
      return res.status(200).json({ status: false, message: "Oops ! New Password and Confirm Password doesn't match." });
    } else {
      user.password = cryptr.encrypt(req?.body?.newPass);
      await user.save();

      return res.status(200).json({
        status: true,
        message: "The user has successfully changed their password.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//set Password
exports.setPassword = async (req, res) => {
  try {
    if (!req.query.email) {
      return res.status(200).json({ status: false, message: "Email must be required." });
    }

    if (!req.body.newPassword || !req.body.confirmPassword) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const userPromise = User.findOne({ email: req.query.email });
    const cryptrEncryptPromise = cryptr.encrypt(req.body.newPassword);

    const [user, encryptedPassword] = await Promise.all([userPromise, cryptrEncryptPromise]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found with that email." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (encryptedPassword === req.body.confirmPassword) {
      user.password = encryptedPassword;
      await user.save();

      //I want to decrypt the password for response
      user.password = await cryptr.decrypt(user.password);

      return res.status(200).json({
        status: true,
        message: "The user has successfully changed their password.",
        user: user,
      });
    } else {
      return res.status(200).json({ status: false, message: "Password does not match." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete user account
exports.deleteUserAccount = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be required!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    res.status(200).json({ status: true, message: "User account has been deleted." });

    const [videosToDelete, postsToDelete, chatRequests, chats, verificationRequests, reports, stories] = await Promise.all([
      Video.find({ userId: user?._id }),
      Post.find({ userId: user?._id }),
      ChatRequest.find({ senderUserId: user?._id }),
      Chat.find({ senderUserId: user?._id }),
      VerificationRequest.find({ userId: user?._id }),
      Report.find({ $or: [{ userId: user?._id }, { toUserId: user?._id }] }),
      Story.find({ user: user?._id }),
    ]);

    if (user?.image) {
      await deleteFromStorage(user?.image);
    }

    for (const story of stories) {
      if (story.mediaImageUrl) {
        deleteFromStorage(story.mediaImageUrl);
      }

      if (story.mediaVideoUrl) {
        deleteFromStorage(story.mediaVideoUrl);
      }

      await Promise.all([StoryReaction.deleteMany({ storyId: story._id }), StoryView.deleteMany({ storyId: story._id }), Story.deleteOne({ _id: story._id })]);
    }

    if (videosToDelete.length > 0) {
      await videosToDelete.map(async (video) => {
        if (video?.videoImage) {
          await deleteFromStorage(video?.videoImage);
        }

        if (video?.videoUrl) {
          await deleteFromStorage(video?.videoUrl);
        }

        await Promise.all([
          LikeHistoryOfPostOrVideo.deleteMany({ videoId: video._id }),
          PostOrVideoComment.deleteMany({ videoId: video._id }),
          LikeHistoryOfpostOrvideoComment.deleteMany({ videoId: video._id }),
          WatchHistory.deleteMany({ videoId: video._id }),
          HashTagUsageHistory.deleteMany({ videoId: video._id }),
          Notification.deleteMany({ $or: [{ otherUserId: video?.userId }, { userId: video?.userId }] }),
          Report.deleteMany({ videoId: video._id }),
          Video.deleteOne({ _id: video._id }),
        ]);
      });
    }

    if (postsToDelete.length > 0) {
      await postsToDelete.map(async (post) => {
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
          Post.deleteOne({ _id: post._id }),
        ]);
      });
    }

    for (const chatRequest of chatRequests) {
      if (chatRequest?.image) {
        await deleteFromStorage(chatRequest?.image);
      }

      if (chatRequest?.audio) {
        await deleteFromStorage(chatRequest?.audio);
      }
    }

    for (const chat of chats) {
      if (chat?.image) {
        await deleteFromStorage(chat?.image);
      }

      if (chat?.audio) {
        await deleteFromStorage(chat?.audio);
      }
    }

    for (const verificationRequest of verificationRequests) {
      if (verificationRequest?.profileSelfie) {
        await deleteFromStorage(verificationRequest?.profileSelfie);
      }

      if (verificationRequest?.document) {
        await deleteFromStorage(verificationRequest?.document);
      }

      await VerificationRequest.deleteMany({ userId: user?._id });
    }

    if (reports.length > 0) {
      await reports.map(async (report) => {
        if (report.videoId !== null) {
          const video = await Video.findById(report.videoId);

          if (video?.videoImage) {
            await deleteFromStorage(video?.videoImage);
          }

          if (video?.videoUrl) {
            await deleteFromStorage(video?.videoUrl);
          }

          await Promise.all([
            LikeHistoryOfPostOrVideo.deleteMany({ videoId: video._id }),
            PostOrVideoComment.deleteMany({ videoId: video._id }),
            LikeHistoryOfpostOrvideoComment.deleteMany(),
            WatchHistory.deleteMany({ videoId: video._id }),
            HashTagUsageHistory.deleteMany({ videoId: video._id }),
            Notification.deleteMany({ otherUserId: video?.userId }),
          ]);

          await Video.deleteOne({ _id: video._id });
        }

        if (report.postId !== null) {
          const post = await Post.findById(report?.postId);

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
            Notification.deleteMany({ $or: [{ otherUserId: post?.userId }, { userId: post?.userId }] }),
          ]);

          await Post.deleteOne({ _id: post?._id });
        }
      });
    }

    await Promise.all([
      ChatRequestTopic.deleteMany({ $or: [{ senderUserId: user?._id }, { receiverUserId: user?._id }] }),
      ChatRequest.deleteMany({ senderUserId: user?._id }),
      ChatTopic.deleteMany({ $or: [{ senderUserId: user?._id }, { receiverUserId: user?._id }] }),
      Chat.deleteMany({ senderUserId: user?._id }),
      Complaint.deleteMany({ userId: user?._id }),
      FollowerFollowing.deleteMany({ $or: [{ fromUserId: user?._id }, { toUserId: user?._id }] }),
      HashTagUsageHistory.deleteMany({ userId: user._id }),
      History.deleteMany({ $or: [{ userId: user?._id }, { otherUserId: user?._id }] }),
      LikeHistoryOfPostOrVideo.deleteMany({ userId: user?._id }),
      LikeHistoryOfpostOrvideoComment.deleteMany({ userId: user?._id }),
      Notification.deleteMany({ $or: [{ otherUserId: user?._id }, { userId: user?._id }] }),
      Post.deleteMany({ userId: user?._id }),
      PostOrVideoComment.deleteMany({ userId: user?._id }),
      Report.deleteMany({ $or: [{ userId: user?._id }, { toUserId: user?._id }] }),
      SearchHistory.deleteMany({ userId: user?._id }),
      SongFavorite.deleteMany({ userId: user?._id }),
      VerificationRequest.deleteMany({ userId: user?._id }),
      Video.deleteMany({ userId: user?._id }),
      WatchHistory.deleteMany({ userId: user?._id }),
      WithdrawRequest.deleteMany({ userId: user?._id }),
      LiveHistory.deleteMany({ userId: user?._id }),
    ]);

    await User.deleteOne({ _id: user?._id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//verify username ( always be unique )
exports.validateUsername = async (req, res) => {
  try {
    const newUsername = req.query.userName.trim();

    if (!req.query.userId || !newUsername) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const [user, existingUser] = await Promise.all([User.findOne({ _id: req.query.userId }), User.findOne({ userName: newUsername.trim() })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(200).json({ status: false, message: "This username is already taken by another user." });
    }

    return res.status(200).json({
      status: true,
      message: "Username is valid and available.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//generate caption/hashTag
exports.generateMediaTags = async (req, res) => {
  const { contentUrl } = req.query;

  try {
    if (!contentUrl) {
      return res.status(400).json({
        status: false,
        message: "Missing 'contentUrl' in request query",
      });
    }

    const openAIKey = settingJSON.openAIKey;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Generate a user-attractive caption and exactly 5 relevant hashtags for this image. 
Output format:
Caption: <your caption>
Hashtags: #tag1 #tag2 #tag3 #tag4 #tag5`,
              },
              {
                type: "image_url",
                image_url: {
                  url: contentUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const error = await openaiRes.text();
      await deleteFromStorage(contentUrl);
      throw new Error(`OpenAI API Error: ${error}`);
    }

    const data = await openaiRes.json();
    const fullText = data.choices?.[0]?.message?.content?.trim();

    if (!fullText) {
      await deleteFromStorage(contentUrl);
      return res.status(500).json({
        status: false,
        message: "OpenAI returned no content",
      });
    }

    const lines = fullText.split("\n").filter(Boolean);

    // Extract caption: from first line or the one starting with "Caption:"
    const captionLineRaw = lines.find((line) => line.toLowerCase().startsWith("caption:")) || lines[0];
    const captionLine = captionLineRaw
      .replace(/^Caption:\s*/i, "")
      .replace(/^["“”']|["“”']$/g, "")
      .trim();

    // Extract all hashtags from all lines
    const allHashtags = fullText.match(/#\w+/g) || [];
    const uniqueHashtags = [...new Set(allHashtags.map((tag) => tag.replace(/[”"'.,;!?]+$/, "")))];

    console.log("Caption:", captionLine);
    console.log("Hashtags:", uniqueHashtags);

    res.status(200).json({
      status: true,
      message: "Caption and hashtags generated successfully.",
      caption: captionLine,
      hashtags: uniqueHashtags,
    });
  } catch (err) {
    console.error("Error generating caption:", err);
    if (contentUrl) await deleteFromStorage(contentUrl);

    res.status(500).json({
      status: false,
      message: "An error occurred while generating caption and hashtags.",
      error: err.message,
    });
  }
};
