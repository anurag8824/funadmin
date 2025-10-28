const LiveUser = require("../../models/liveUser.model");

//import model
const User = require("../../models/user.model");
const LiveHistory = require("../../models/liveHistory.model");
const Livevideo = require("../../models/livevideo.model");

//private key
const admin = require("../../util/privateKey");

//momemt
const moment = require("moment-timezone");

//mongoose
const mongoose = require("mongoose");

const liveUserFunction = async (liveUser, data) => {
  liveUser.name = data.name;
  liveUser.userName = data.userName;
  liveUser.image = data.image;
  liveUser.isProfileImageBanned = data.isProfileImageBanned;
  liveUser.countryFlagImage = data.countryFlagImage;
  liveUser.country = data.country;
  liveUser.isVerified = data.isVerified;
  liveUser.isFake = data.isFake;
  liveUser.userId = data._id;

  await liveUser.save();
  return liveUser;
};

//live the user
exports.liveUser = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [existUser, existLiveUser] = await Promise.all([User.findOne({ _id: userId }), LiveUser.findOne({ userId: userId })]);

    if (!existUser) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (existUser.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (existLiveUser) {
      console.log("delete existLiveUser");
      await LiveUser.deleteOne({ userId: existUser._id });
    }

    const liveHistory = new LiveHistory();
    liveHistory.userId = existUser._id;
    liveHistory.startTime = moment().tz("Asia/Kolkata").format();

    existUser.isLive = true;
    existUser.liveHistoryId = liveHistory._id;

    let liveUserData;
    const liveUser = new LiveUser();
    liveUser.liveHistoryId = liveHistory._id;
    liveUserData = await liveUserFunction(liveUser, existUser);

    await Promise.all([liveHistory?.save(), existUser?.save()]);

    res.status(200).json({
      status: true,
      message: "User is live Successfully.",
      data: liveUser,
    });

    //notification related
    const user = await User.find({
      isBlock: false,
      isLive: false,
      _id: { $ne: existUser._id },
    }).distinct("fcmToken");

    if (user.length !== 0) {
      const payload = {
        tokens: user,
        notification: {
          title: `${existUser?.name} is live now! 🚀✨`,
          body: "📺 Tap to join the live stream and catch the action! 👉🎥👀",
          image: existUser?.image,
        },
        data: {
          type: "LIVE",
        },
      };

      const adminPromise = await admin;
      adminPromise
        .messaging()
        .sendEachForMulticast(payload)
        .then((response) => {
          console.log("Successfully sent with response: ", response);

          if (response.failureCount > 0) {
            response.responses.forEach((res, index) => {
              if (!res.success) {
                console.error(`Error for token ${user[index]}:`, res.error.message);
              }
            });
          }
        })
        .catch((error) => {
          console.log("Error sending message:      ", error);
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get live user list
exports.getliveUserList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    const userId = req.query.userId ? new mongoose.Types.ObjectId(req.query.userId) : null;

    if (settingJSON.isFakeData) {
      console.log("fake data on");

      const [livevideo, realLive] = await Promise.all([
        Livevideo.aggregate([
          {
            $match: {
              isLive: true,
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
            $addFields: {
              view: {
                $floor: {
                  $add: [
                    1,
                    {
                      $multiply: [50, { $rand: {} }],
                    },
                  ],
                },
              },
              liveHistoryId: null,
              liveUserObjId: null,
              isFollow: true,
              isPkMode: true,
              host2Name: "",
              host2Image: "",
              host2isProfileImageBanned: false,
            },
          },
          {
            $project: {
              _id: 0,
              userId: "$user._id",
              name: "$user.name",
              userName: "$user.userName",
              image: "$user.image",
              countryFlagImage: "$user.countryFlagImage",
              isProfileImageBanned: "$user.isProfileImageBanned",
              isVerified: "$user.isVerified",
              isFake: "$user.isFake",
              videoImage: 1,
              videoUrl: 1,
              pkPreviewImages: 1,
              pkMediaSources: 1,
              liveHistoryId: 1,
              liveUserObjId: 1,
              view: 1,
              isPkMode: 1,
              host2Name: 1,
              host2Image: 1,
              host2isProfileImageBanned: 1,
            },
          },
        ]),
        User.aggregate([
          {
            $match: {
              isBlock: false,
              isLive: true,
              ...(userId ? { _id: { $ne: userId } } : {}),
            },
          },
          {
            $lookup: {
              from: "liveusers",
              let: { liveUserId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$$liveUserId", "$userId"],
                    },
                  },
                },
              ],
              as: "liveUser",
            },
          },
          {
            $unwind: {
              path: "$liveUser",
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $lookup: {
              from: "followerfollowings",
              let: { liveUserId: "$_id", requestingUserId: userId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$toUserId", "$$liveUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                    },
                  },
                },
              ],
              as: "isFollow",
            },
          },
          {
            $addFields: {
              videoImage: "",
              videoUrl: "",
              pkPreviewImages: [],
              pkMediaSources: [],
            },
          },
          {
            $project: {
              _id: 0,
              userId: "$_id",
              name: 1,
              userName: 1,
              image: 1,
              countryFlagImage: 1,
              isProfileImageBanned: 1,
              isVerified: 1,
              isFake: 1,
              videoImage: 1,
              videoUrl: 1,
              pkPreviewImages: 1,
              pkMediaSources: 1,
              liveUserObjId: "$liveUser._id",
              liveHistoryId: { $cond: [{ $eq: ["$isLive", true] }, "$liveUser.liveHistoryId", null] },
              view: { $cond: [{ $eq: ["$isLive", true] }, "$liveUser.view", 0] },
              isPkMode: "$liveUser.isPkMode",
              host2Name: "$liveUser.pkConfig.host2Name",
              host2Image: "$liveUser.pkConfig.host2Image",
              host2isProfileImageBanned: "$liveUser.pkConfig.host2Details.isProfileImageBanned",
              isFollow: {
                $cond: {
                  if: { $eq: [userId, null] },
                  then: false,
                  else: { $gt: [{ $size: "$isFollow" }, 0] },
                },
              },
            },
          },
        ]),
      ]);

      const shuffledLiveVideo = livevideo.sort(() => Math.random() - 0.5);

      const combinedData = [...shuffledLiveVideo, ...realLive];

      const paginatedData = combinedData.slice((start - 1) * limit, start * limit);

      return res.status(200).json({
        status: true,
        message: "Retrive live user list.",
        liveUserList: paginatedData.length > 0 ? paginatedData : [],
      });
    } else {
      const data = await User.aggregate([
        {
          $match: {
            isBlock: false,
            isLive: true,
            ...(userId ? { _id: { $ne: userId } } : {}),
          },
        },
        {
          $lookup: {
            from: "liveusers",
            let: { liveUserId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$liveUserId", "$userId"],
                  },
                },
              },
            ],
            as: "liveUser",
          },
        },
        {
          $unwind: {
            path: "$liveUser",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "followerfollowings",
            let: { liveUserId: "$_id", requestingUserId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$toUserId", "$$liveUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                  },
                },
              },
            ],
            as: "isFollow",
          },
        },
        {
          $addFields: {
            videoImage: "",
            videoUrl: "",
            pkPreviewImages: [],
            pkMediaSources: [],
          },
        },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            name: 1,
            userName: 1,
            image: 1,
            countryFlagImage: 1,
            isProfileImageBanned: 1,
            isVerified: 1,
            isFake: 1,
            videoImage: 1,
            videoUrl: 1,
            pkPreviewImages: 1,
            pkMediaSources: 1,
            liveUserObjId: "$liveUser._id",
            liveHistoryId: { $cond: [{ $eq: ["$isLive", true] }, "$liveUser.liveHistoryId", null] },
            view: { $cond: [{ $eq: ["$isLive", true] }, "$liveUser.view", 0] },
            isPkMode: "$liveUser.isPkMode",
            host2Name: "$liveUser.pkConfig.host2Name",
            host2Image: "$liveUser.pkConfig.host2Image",
            host2isProfileImageBanned: "$liveUser.pkConfig.host2Details.isProfileImageBanned",
            isFollow: {
              $cond: {
                if: { $eq: [userId, null] },
                then: false,
                else: { $gt: [{ $size: "$isFollow" }, 0] },
              },
            },
          },
        },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrive live user list.",
        liveUserList: data.length > 0 ? data : [],
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get pk request
exports.fetchPkInvitations = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be needed." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const data = await LiveUser.aggregate([
      {
        $match: {
          isPkMode: false,
          userId: { $ne: userId },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          userName: 1,
          image: 1,
          userId: 1,
          channel: 1,
          token: 1,
          liveHistoryId: 1,
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrive live user list.",
      liveUserList: data.length > 0 ? data : [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get live summary
exports.fetchLiveAnalytics = async (req, res) => {
  try {
    const { liveHistoryId } = req.query;

    if (!liveHistoryId) {
      return res.status(200).json({ status: false, message: "The 'liveHistoryId' parameter is required." });
    }

    const liveHistoryObjectId = new mongoose.Types.ObjectId(liveHistoryId);

    const liveHistory = await LiveHistory.findById(liveHistoryObjectId).populate("userId", "name userName isProfileImageBanned image isVerified uniqueId gender age countryFlagImage country").lean();

    if (!liveHistory) {
      return res.status(200).json({ status: false, message: "Live history not found." });
    }

    const responseData = {
      user: {
        name: liveHistory.userId?.name || "",
        userName: liveHistory.userId?.userName || "",
        image: liveHistory.userId?.image || "",
        isProfileImageBanned: liveHistory.userId?.isProfileImageBanned || false,
        isVerified: liveHistory.userId?.isVerified || false,
        uniqueId: liveHistory.userId?.uniqueId || "",
        gender: liveHistory.userId?.gender || "",
        age: liveHistory.userId?.age || "",
        uniqueId: liveHistory.userId?.uniqueId || "",
        countryFlagImage: liveHistory.userId?.countryFlagImage || "",
        country: liveHistory.userId?.country || "",
      },
      totalUser: liveHistory.totalUser || 0,
      totalGift: liveHistory.totalGift || 0,
      totalLiveChat: liveHistory.totalLiveChat || 0,
      liveFollowCount: liveHistory.liveFollowCount || 0,
      totalCoinsEarned: liveHistory.totalCoinsEarned || 0,
      duration: liveHistory.duration || "00:00:00",
    };

    return res.status(200).json({
      status: true,
      message: "Live summary fetched successfully.",
      data: responseData,
    });
  } catch (error) {
    console.error("Live summary error:", error);
    return res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
  }
};
