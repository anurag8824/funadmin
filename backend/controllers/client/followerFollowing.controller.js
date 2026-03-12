const FollowerFollowing = require("../../models/followerFollowing.model");

//import model
const User = require("../../models/user.model");
const Notification = require("../../models/notification.model");

//mongoose
const mongoose = require("mongoose");

//private key
const admin = require("../../util/privateKey");

//follow or unfollow the user
exports.followUnfollowUser = async (req, res) => {
  try {
    if (!req.query.fromUserId || !req.query.toUserId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const fromUserId = new mongoose.Types.ObjectId(req.query.fromUserId);
    const toUserId = new mongoose.Types.ObjectId(req.query.toUserId);

    const [fromUser, toUser, alreadyFollower] = await Promise.all([
      User.findOne({ _id: fromUserId }).select("_id name isBlock image").lean(),
      User.findOne({ _id: toUserId }).select("_id isBlock fcmToken").lean(),
      FollowerFollowing.findOne({ fromUserId: fromUserId, toUserId: toUserId }).lean(),
    ]);

    if (!fromUser) {
      return res.status(200).json({ status: false, message: "fromUser does not found." });
    }

    if (fromUser.isBlock) {
      return res.status(200).json({ status: false, message: "fromUser blocked by the admin." });
    }

    if (!toUser) {
      return res.status(200).json({ status: false, message: "toUser does not found." });
    }

    if (toUser.isBlock) {
      return res.status(200).json({ status: false, message: "toUser blocked by the admin." });
    }

    if (fromUser._id.equals(toUser._id)) {
      return res.status(200).json({ status: false, message: "You can't follow your own account." });
    }

    if (alreadyFollower) {
      await FollowerFollowing.deleteOne({
        fromUserId: fromUser._id,
        toUserId: toUser._id,
      });

      return res.status(200).json({
        status: true,
        message: `Someone has just stopped following you!`,
        isFollow: false,
      });
    } else {
      const followerFollowing = new FollowerFollowing();
      followerFollowing.fromUserId = fromUser._id;
      followerFollowing.toUserId = toUser._id;
      await followerFollowing.save();

      res.status(200).json({
        status: true,
        message: `Someone just followed you!`,
        isFollow: true,
      });

      if (!toUser.isBlock && toUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: toUser.fcmToken,
          notification: {
            title: "👥 You've Got a New Connection!",
            body: `🚀 ${fromUser?.name || "Someone"} just started following you! Check them out 👀✨`,
          },
          data: {
            type: "FOLLOW",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);

            const notification = new Notification();
            notification.userId = toUser._id;
            notification.otherUserId = fromUser._id;
            notification.title = "👥 You've Got a New Connection!";
            notification.message = `🚀 ${fromUser?.name || "Someone"} just started following you! Check them out 👀✨`;
            notification.image = fromUser.image;
            notification.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            await notification.save();
          })
          .catch((error) => {
            console.log("Error sending message:      ", error);
          });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get follower or following list of the particular user
exports.followerFollowingList = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.type) {
      return res.status(200).json({ status: false, message: "userId and type must be required." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const requestingUserId = req.query.requestingUserId
      ? new mongoose.Types.ObjectId(req.query.requestingUserId)
      : null;

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const user = await User.findOne({ _id: userId }).lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }
    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    let query = {};
    let populateField = "";
    let userField = "";

    if (req.query.type === "followerList") {
      query = { toUserId: userId };
      populateField = "fromUserId";
      userField = "fromUserId";
    } else if (req.query.type === "followingList") {
      query = { fromUserId: userId };
      populateField = "toUserId";
      userField = "toUserId";
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }

    const [totalCount, list] = await Promise.all([
      FollowerFollowing.countDocuments(query),
      FollowerFollowing.find(query)
        .populate(populateField, "_id name userName image isVerified isFake isProfileImageBanned")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Determine which listed users the requesting user is already following
    let followingSet = new Set();
    if (requestingUserId) {
      const listedUserIds = list
        .map((item) => item[userField]?._id)
        .filter(Boolean);
      const existing = await FollowerFollowing.find({
        fromUserId: requestingUserId,
        toUserId: { $in: listedUserIds },
      })
        .select("toUserId")
        .lean();
      followingSet = new Set(existing.map((e) => e.toUserId.toString()));
    }

    const enriched = list.map((item) => {
      const listedUser = item[userField];
      return {
        ...item,
        [userField]: listedUser
          ? { ...listedUser, isFollowingBack: followingSet.has(listedUser._id.toString()) }
          : null,
      };
    });

    return res.status(200).json({
      status: true,
      message: `Retrieved ${req.query.type} successfully.`,
      followerFollowing: enriched,
      totalCount,
      hasMore: skip + list.length < totalCount,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

