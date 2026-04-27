const ChatTopic = require("../../models/chatTopic.model");

//import model
const User = require("../../models/user.model");
const ChatRequestTopic = require("../../models/chatRequestTopic.model");
const FollowerFollowing = require("../../models/followerFollowing.model");

//day.js
const dayjs = require("dayjs");

//mongoose
const mongoose = require("mongoose");

//get thumb list of chat between the users
exports.getChatList = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "UserId must be required." });
    }

    let now = dayjs();

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    if (settingJSON?.isFakeData) {
      const [user, pendingCount, chatList, fakeUserChatList] = await Promise.all([
        User.findById(userId).select("_id isBlock").lean(),
        ChatRequestTopic.countDocuments({ status: 1, receiverUserId: userId }),
        ChatTopic.aggregate([
          // {
          //   $match: {
          //     $or: [{ senderUserId: userId }, { receiverUserId: userId }],
          //   },
          // },
          {
            $match: {
              chatId: { $ne: null },
              $or: [
                {
                  $and: [{ senderUserId: userId }, { $or: [{ isAccepted: true }, { isAccepted: false }] }],
                },
                {
                  $and: [{ receiverUserId: userId }, { isAccepted: true }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: "users",
              let: {
                senderUserId: "$senderUserId",
                receiverUserId: "$receiverUserId",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $cond: {
                        if: { $eq: ["$$senderUserId", userId] },
                        then: { $eq: ["$$receiverUserId", "$_id"] },
                        else: { $eq: ["$$senderUserId", "$_id"] },
                      },
                    },
                  },
                },
              ],
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "chats",
              let: { topicId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$chatTopicId", "$$topicId"],
                    },
                  },
                },
                { $sort: { createdAt: -1 } },
                { $limit: 1 },
              ],
              as: "chats",
            },
          },
          {
            $unwind: {
              path: "$chats",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "chats",
              let: { topicId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$chatTopicId", "$$topicId"] }, { $eq: ["$isRead", false] }, { $ne: ["$senderUserId", userId] }],
                    },
                  },
                },
                { $count: "unreadCount" },
              ],
              as: "unreads",
            },
          },
          {
            $addFields: {
              unreadCount: {
                $cond: [{ $gt: [{ $size: "$unreads" }, 0] }, { $arrayElemAt: ["$unreads.unreadCount", 0] }, 0],
              },
            },
          },
          {
            $group: {
              _id: "$_id",
              name: { $first: "$user.name" },
              userName: { $first: "$user.userName" },
              isProfileImageBanned: { $first: "$user.isProfileImageBanned" },
              image: { $first: "$user.image" },
              isOnline: { $first: "$user.isOnline" },
              isVerified: { $first: "$user.isVerified" },
              isFake: { $first: "$user.isFake" },
              userId: { $first: "$user._id" },
              chatTopicId: { $first: "$chats.chatTopicId" },
              senderUserId: { $first: "$chats.senderUserId" },
              lastChatMessageTime: { $first: "$chats.createdAt" },
              message: { $first: "$chats.message" },
              isAccepted: { $first: "$isAccepted" },
              unreadCount: { $first: "$unreadCount" },
            },
          },
          {
            $project: {
              name: 1,
              userName: 1,
              isProfileImageBanned: 1,
              image: 1,
              isOnline: 1,
              isVerified: 1,
              isFake: 1,
              userId: 1,
              chatTopicId: 1,
              senderUserId: 1,
              message: 1,
              isAccepted: 1,
              unreadCount: 1,
              lastChatMessageTime: 1,
              time: {
                $let: {
                  vars: {
                    timeDiff: { $subtract: [now.toDate(), "$lastChatMessageTime"] },
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
          { $sort: { lastChatMessageTime: -1 } },
          { $skip: (start - 1) * limit },
          { $limit: limit },
        ]),
        User.aggregate([
          {
            $match: {
              $and: [{ isFake: true }],
            },
          },
          { $sample: { size: limit } },
          {
            $addFields: {
              chatTopicId: "",
              time: "",
              userId: "",
              senderUserId: "",
              isAccepted: true,
              message: {
                $let: {
                  vars: {
                    randomIndex: { $floor: { $multiply: [{ $rand: {} }, 15] } },
                  },
                  in: {
                    $arrayElemAt: [
                      [
                        "What's the most interesting thing you've done this week? 🤔✨",
                        "If we could travel anywhere together, where would we go? 🌍✈️",
                        "Swipe right on adventure! What's next on your bucket list? 🎒🌄",
                        "Looking for a partner in crime for spontaneous weekend getaways! 🚗💨",
                        "What’s one thing about you that might surprise me? 🤫👀",
                        "Coffee or cocktails? Let's grab a drink and see where the night takes us. ☕🍸",
                        "Let’s skip the small talk — what's your dream date? 💭❤️",
                        "What's the last song you had on repeat? Maybe we could share playlists. 🎶📀",
                        "Adventure awaits! What’s your favorite way to spend a Saturday? ⛰️🏙️",
                        "Hey there! What's something you're passionate about? 🔥❤️",
                        "Let’s start with a good conversation — what's one thing you can’t live without? 💬🔑",
                        "Looking for someone to laugh with — what’s your best joke? 😂🎭",
                        "What’s something you've always wanted to try but haven't yet? 🤩📝",
                        "First impressions: Describe yourself in three emojis! 👀💡🤔",
                        "Love a good story. What’s the last book you couldn’t put down? 📚📖",
                      ],
                      "$$randomIndex",
                    ],
                  },
                },
              },
              unreadCount: {
                $floor: {
                  $add: [
                    1,
                    {
                      $multiply: [10, { $rand: {} }],
                    },
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              userName: 1,
              isProfileImageBanned: 1,
              image: 1,
              isOnline: 1,
              isVerified: 1,
              userId: 1,
              isFake: 1,
              chatTopicId: 1,
              senderUserId: 1,
              message: 1,
              time: 1,
              unreadCount: 1,
              isAccepted: 1,
            },
          },
        ]),
      ]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      const combinedData = [...chatList, ...fakeUserChatList];

      const paginatedData = combinedData.slice((start - 1) * limit, start * limit);

      return res.status(200).json({
        status: true,
        message: "Success",
        pendingCount: pendingCount > 0 ? pendingCount : 0,
        data: paginatedData.length > 0 ? paginatedData : [],
      });
    } else {
      const [user, pendingCount, chatList] = await Promise.all([
        User.findById(userId).select("_id isBlock").lean(),
        ChatRequestTopic.countDocuments({ status: 1, receiverUserId: userId }),
        ChatTopic.aggregate([
          // {
          //   $match: {
          //     $or: [{ senderUserId: userId }, { receiverUserId: userId }],
          //   },
          // },
          {
            $match: {
              chatId: { $ne: null },
              $or: [
                {
                  $and: [{ senderUserId: userId }, { $or: [{ isAccepted: true }, { isAccepted: false }] }],
                },
                {
                  $and: [{ receiverUserId: userId }, { isAccepted: true }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: "users",
              let: {
                senderUserId: "$senderUserId",
                receiverUserId: "$receiverUserId",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $cond: {
                        if: { $eq: ["$$senderUserId", userId] },
                        then: { $eq: ["$$receiverUserId", "$_id"] },
                        else: { $eq: ["$$senderUserId", "$_id"] },
                      },
                    },
                  },
                },
              ],
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "chats",
              let: { topicId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$chatTopicId", "$$topicId"],
                    },
                  },
                },
                { $sort: { createdAt: -1 } },
                { $limit: 1 },
              ],
              as: "chats",
            },
          },
          {
            $lookup: {
              from: "chats",
              let: { topicId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$chatTopicId", "$$topicId"] }, { $eq: ["$isRead", false] }, { $ne: ["$senderUserId", userId] }],
                    },
                  },
                },
                { $count: "unreadCount" },
              ],
              as: "unreads",
            },
          },
          {
            $addFields: {
              unreadCount: {
                $cond: [{ $gt: [{ $size: "$unreads" }, 0] }, { $arrayElemAt: ["$unreads.unreadCount", 0] }, 0],
              },
            },
          },
          {
            $group: {
              _id: "$_id",
              name: { $first: "$user.name" },
              userName: { $first: "$user.userName" },
              isProfileImageBanned: { $first: "$user.isProfileImageBanned" },
              image: { $first: "$user.image" },
              isOnline: { $first: "$user.isOnline" },
              isVerified: { $first: "$user.isVerified" },
              isFake: { $first: "$user.isFake" },
              userId: { $first: "$user._id" },
              chatTopicId: { $first: "$chats.chatTopicId" },
              senderUserId: { $first: "$chats.senderUserId" },
              lastChatMessageTime: { $first: "$chats.createdAt" },
              isAccepted: { $first: "$isAccepted" },
              message: { $first: "$chats.message" },
              unreadCount: { $first: "$unreadCount" },
            },
          },
          {
            $project: {
              name: 1,
              userName: 1,
              isProfileImageBanned: 1,
              image: 1,
              isOnline: 1,
              isVerified: 1,
              isFake: 1,
              userId: 1,
              chatTopicId: 1,
              senderUserId: 1,
              message: 1,
              unreadCount: 1,
              isAccepted: 1,
              lastChatMessageTime: 1,
              time: {
                $let: {
                  vars: {
                    timeDiff: { $subtract: [now.toDate(), "$lastChatMessageTime"] },
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
          { $sort: { lastChatMessageTime: -1 } },
          { $skip: (start - 1) * limit },
          { $limit: limit },
        ]),
      ]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      return res.status(200).json({
        status: true,
        message: "Success",
        pendingCount: pendingCount > 0 ? pendingCount : 0,
        data: chatList,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.errorMessage || "Internal Server Error" });
  }
};

//search the users with chat has been done
exports.chatWithUserSearch = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.searchString) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const searchString = req.query.searchString.trim();
    const escapedSearch = searchString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");

    const [user, response] = await Promise.all([
      User.findById(userId).select("_id isBlock").lean(),
      User.aggregate([
        {
          $match: {
            isBlock: false,
            _id: { $ne: userId },
            $or: [{ name: { $regex: searchRegex } }, { userName: { $regex: searchRegex } }],
          },
        },
        {
          $lookup: {
            from: "chattopics",
            let: { otherUserId: "$_id", me: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $and: [{ $eq: ["$senderUserId", "$$me"] }, { $eq: ["$receiverUserId", "$$otherUserId"] }] },
                      { $and: [{ $eq: ["$senderUserId", "$$otherUserId"] }, { $eq: ["$receiverUserId", "$$me"] }] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: "chatTopics",
          },
        },
        {
          $lookup: {
            from: "followerfollowings",
            let: { otherUserId: "$_id", me: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $and: [{ $eq: ["$fromUserId", "$$me"] }, { $eq: ["$toUserId", "$$otherUserId"] }] },
                      { $and: [{ $eq: ["$fromUserId", "$$otherUserId"] }, { $eq: ["$toUserId", "$$me"] }] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: "followLinks",
          },
        },
        {
          $addFields: {
            hasChatTopic: { $gt: [{ $size: "$chatTopics" }, 0] },
            hasFollowerLink: { $gt: [{ $size: "$followLinks" }, 0] },
          },
        },
        {
          $match: {
            $or: [{ hasChatTopic: true }, { hasFollowerLink: true }],
          },
        },
        {
          $project: {
            _id: 1,
            userId: "$_id",
            name: 1,
            userName: 1,
            isProfileImageBanned: 1,
            image: 1,
            isVerified: 1,
            isFake: 1,
            hasChatTopic: 1,
          },
        },
        { $sort: { hasChatTopic: -1, userName: 1 } },
        { $limit: 30 },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (response.length > 0) {
      return res.status(200).json({
        status: true,
        message: "Success",
        data: response,
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "No data found.",
        data: [],
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get recent chat with user
exports.recentChatWithUsers = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(400).json({ status: false, message: "userId is required." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, recentChats] = await Promise.all([
      User.findById(userId).select("_id isBlock").lean(),
      ChatTopic.aggregate([
        {
          $match: {
            $or: [{ senderUserId: userId }, { receiverUserId: userId }],
          },
        },
        {
          $lookup: {
            from: "users",
            let: {
              senderUserId: "$senderUserId",
              receiverUserId: "$receiverUserId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $cond: {
                      if: { $eq: ["$$senderUserId", userId] },
                      then: { $eq: ["$$receiverUserId", "$_id"] },
                      else: { $eq: ["$$senderUserId", "$_id"] },
                    },
                  },
                },
              },
            ],
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
            from: "chats",
            localField: "chatId",
            foreignField: "_id",
            as: "chat",
          },
        },
        {
          $unwind: {
            path: "$chat",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            name: "$user.name",
            userName: "$user.userName",
            image: "$user.image",
            isOnline: "$user.isOnline",
            isVerified: "$user.isVerified",
            userId: "$user._id",
          },
        },
        { $sort: { createdAt: 1 } },
        { $limit: 10 },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "Recent chats retrieved successfully.", data: recentChats });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
