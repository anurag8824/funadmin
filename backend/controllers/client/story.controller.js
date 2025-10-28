const Story = require("../../models/story.model");
const User = require("../../models/user.model");
const Song = require("../../models/song.model");
const StoryView = require("../../models/storyView.model");
const StoryReaction = require("../../models/storyReaction.model");
const FollowerFollowing = require("../../models/followerFollowing.model");
const ChatTopic = require("../../models/chatTopic.model");
const ChatRequestTopic = require("../../models/chatRequestTopic.model");
const ChatRequest = require("../../models/chatRequest.model");
const Chat = require("../../models/chat.model");

const mongoose = require("mongoose");

const admin = require("../../util/privateKey");

const { deleteFromStorage } = require("../../util/storageHelper");

//upload story
exports.uploadStory = async (req, res) => {
  try {
    if (!req.body.userId) {
      if (req?.body?.mediaImageUrl) {
        req.body.mediaImageUrl.forEach((image) => deleteFromStorage(image.path));
      }
      if (req?.body?.mediaVideoUrl) {
        req.body.mediaVideoUrl.forEach((video) => deleteFromStorage(video.path));
      }
      return res.status(200).json({ status: false, message: "userId is required." });
    }

    if (!req.body.storyType) {
      if (req?.body?.mediaImageUrl) {
        req.body.mediaImageUrl.forEach((image) => deleteFromStorage(image.path));
      }
      if (req?.body?.mediaVideoUrl) {
        req.body.mediaVideoUrl.forEach((video) => deleteFromStorage(video.path));
      }

      return res.status(200).json({ status: false, message: "Story type is required." });
    }

    const [user, backgroundSong] = await Promise.all([
      User.findOne({ _id: req.body.userId, isFake: false }),
      req.body.backgroundSong ? Song.findById(req.body.backgroundSong).select("_id") : null, // Only fetch backgroundSong if provided
    ]);

    if (!user) {
      if (req?.body?.mediaImageUrl) {
        req.body.mediaImageUrl.forEach((image) => deleteFromStorage(image.path));
      }
      if (req?.body?.mediaVideoUrl) {
        req.body.mediaVideoUrl.forEach((video) => deleteFromStorage(video.path));
      }

      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      if (req?.body?.mediaImageUrl) {
        req.body.mediaImageUrl.forEach((image) => deleteFromStorage(image.path));
      }
      if (req?.body?.mediaVideoUrl) {
        req.body.mediaVideoUrl.forEach((video) => deleteFromStorage(video.path));
      }

      return res.status(403).json({ status: false, message: "User is blocked." });
    }

    if (req.body.backgroundSong && !backgroundSong) {
      if (req?.body?.mediaImageUrl) {
        req.body.mediaImageUrl.forEach((image) => deleteFromStorage(image.path));
      }
      if (req?.body?.mediaVideoUrl) {
        req.body.mediaVideoUrl.forEach((video) => deleteFromStorage(video.path));
      }

      return res.status(200).json({ status: false, message: "Background song not found." });
    }

    res.status(200).json({
      status: true,
      message: "Story has been uploaded successfully.",
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Story expires in 24 hours
    const storyData = {
      user: user._id,
      storyType: req.body.storyType || 1,
      duration: req.body.duration || 0,
      backgroundSong: backgroundSong ? backgroundSong._id : null,
      mediaImageUrl: req.body?.mediaImageUrl ? req.body.mediaImageUrl : "",
      mediaVideoUrl: req.body?.mediaVideoUrl ? req.body.mediaVideoUrl : "",
      userReaction: "",
      viewsCount: 0,
      reactionsCount: 0,
      expiresAt,
    };

    const story = new Story(storyData);
    await story.save();
  } catch (error) {
    console.error("Error uploading story:", error);

    if (req?.body?.mediaImageUrl) {
      req.body.mediaImageUrl.forEach((image) => deleteFromStorage(image.path));
    }
    if (req?.body?.mediaVideoUrl) {
      req.body.mediaVideoUrl.forEach((video) => deleteFromStorage(video.path));
    }

    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//view story
exports.viewStory = async (req, res) => {
  try {
    const { userId, storyId } = req.query;

    if (!userId || !storyId) {
      return res.status(200).json({
        status: false,
        message: "userId and storyId are required.",
      });
    }

    const [user, story, alreadyViewed] = await Promise.all([User.findOne({ _id: userId, isFake: false }), Story.findById(storyId), StoryView.findOne({ userId, storyId })]);

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "User not found.",
      });
    }

    if (user.isBlock) {
      return res.status(403).json({
        status: false,
        message: "User is blocked.",
      });
    }

    if (!story) {
      return res.status(200).json({
        status: false,
        message: "Story not found.",
      });
    }

    if (alreadyViewed) {
      return res.status(200).json({
        status: true,
        message: "Story already viewed by this user.",
      });
    }

    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const viewEntry = new StoryView({
      userId,
      storyId,
      expiration_date: expirationDate,
    });

    await Promise.all([
      viewEntry.save(),
      Story.updateOne({ _id: storyId }, { $inc: { viewsCount: 1 } }), // 2. Increment viewsCount
    ]);

    return res.status(200).json({
      status: true,
      message: "Story view recorded successfully.",
    });
  } catch (error) {
    console.error("Error viewing story:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//reaction story
exports.reactToStory = async (req, res) => {
  try {
    const { userId, storyId, reaction } = req.body;

    if (!userId || !storyId || !reaction) {
      return res.status(200).json({ status: false, message: "userId, storyId, and reaction are required." });
    }

    const [user, story, existingReaction] = await Promise.all([
      User.findById(userId),
      Story.findById(storyId).populate("user"), // get story + owner
      StoryReaction.findOne({ userId, storyId }),
    ]);

    if (!user || !story) {
      return res.status(200).json({ status: false, message: "User or Story not found." });
    }

    res.status(200).json({
      status: true,
      message: "Reaction recorded and message sent.",
    });

    const senderUserId = user._id;
    const receiverUser = story.user;
    const receiverUserId = receiverUser._id;
    const isFirstReaction = !existingReaction;

    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const reactionData = {
      userId,
      storyId,
      reaction,
      expiration_date: expirationDate,
    };

    await (existingReaction ? StoryReaction.updateOne({ _id: existingReaction._id }, reactionData) : new StoryReaction(reactionData).save());

    if (isFirstReaction) {
      await Story.updateOne({ _id: storyId }, { $inc: { reactionsCount: 1 } });
    }

    const [follow, foundChatTopic] = await Promise.all([
      FollowerFollowing.findOne({ fromUserId: senderUserId, toUserId: receiverUserId }),
      ChatTopic.findOne({
        $or: [{ $and: [{ senderUserId }, { receiverUserId }] }, { $and: [{ senderUserId: receiverUserId }, { receiverUserId: senderUserId }] }],
      }),
    ]);

    const messageText = `Reacted to your story: ${reaction}`;
    const date = new Date().toLocaleString();

    if (!follow && !foundChatTopic?.isAccepted) {
      console.log("Users do not follow each other in Reacted to your story.");

      // Request flow
      let chatRequestTopic = await ChatRequestTopic.findOne({
        $or: [
          { senderUserId, receiverUserId },
          { senderUserId: receiverUserId, receiverUserId: senderUserId },
        ],
      });

      if (!chatRequestTopic) {
        chatRequestTopic = new ChatRequestTopic({
          senderUserId,
          receiverUserId,
          status: 1,
        });
        await chatRequestTopic.save();
      }

      const messageRequest = new ChatRequest({
        senderUserId,
        chatRequestTopicId: chatRequestTopic._id,
        storyOwnerId: story.user._id,
        storyId: storyId,
        messageType: 4,
        message: messageText,
        image: reaction,
        date,
      });

      chatRequestTopic.chatRequestId = messageRequest._id;

      let chatTopic =
        foundChatTopic ||
        new ChatTopic({
          senderUserId,
          receiverUserId,
          chatId: null,
          isAccepted: false,
        });

      const chat = new Chat({
        senderUserId,
        chatTopicId: chatTopic._id,
        storyOwnerId: story.user._id,
        storyId: storyId,
        messageType: 4,
        message: messageText,
        image: reaction,
        date,
      });

      chatTopic.chatId = chat._id;

      await Promise.all([messageRequest.save(), chatRequestTopic.save(), chatTopic.save(), chat.save()]);

      if (!receiverUser.isBlock && receiverUser.fcmToken) {
        const adminInstance = await admin;
        const payload = {
          token: receiverUser.fcmToken,
          notification: {
            title: `New Message Request from ${user.name}`,
            body: `${user.name} reacted to your story: ${reaction}`,
            image: user.image || "",
          },
          data: {
            type: "CHAT_REQUEST",
          },
        };

        adminInstance
          .messaging()
          .send(payload)
          .then((response) => console.log("Notification sent:", response))
          .catch((error) => console.error("Notification error:", error));
      }
    } else {
      console.log("Users follow each other Direct chat flow in Reacted to your story.");

      let chatTopic =
        foundChatTopic ||
        new ChatTopic({
          senderUserId,
          receiverUserId,
          isAccepted: true,
        });

      const chat = new Chat({
        senderUserId,
        chatTopicId: chatTopic._id,
        storyOwnerId: story.user._id,
        storyId: storyId,
        messageType: 4,
        message: messageText,
        image: reaction,
        date,
      });

      chatTopic.chatId = chat._id;
      chatTopic.isAccepted = true;

      await Promise.all([chat.save(), chatTopic.save()]);

      if (!receiverUser.isBlock && receiverUser.fcmToken) {
        const adminInstance = await admin;
        const payload = {
          token: receiverUser.fcmToken,
          notification: {
            title: `${user.name} reacted to your story`,
            body: `❤️ ${reaction}`,
            image: user.image || "",
          },
          data: {
            type: "CHAT",
          },
        };

        adminInstance
          .messaging()
          .send(payload)
          .then((response) => console.log("Notification sent:", response))
          .catch((error) => console.error("Notification error:", error));
      }
    }
  } catch (error) {
    console.error("Error in reactToStory:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//reply story
exports.replyToStory = async (req, res) => {
  try {
    const { userId, storyId, message } = req.body;

    if (!userId || !storyId || !message) {
      return res.status(200).json({ status: false, message: "userId, storyId, and message are required." });
    }

    const [user, story] = await Promise.all([User.findById(userId), Story.findById(storyId).populate("user")]);

    if (!user || !story) {
      return res.status(200).json({ status: false, message: "User or Story not found." });
    }

    res.status(200).json({
      status: true,
      message: "Reply recorded and message sent.",
    });

    const senderUserId = user._id;
    const receiverUser = story.user;
    const receiverUserId = receiverUser._id;

    const [follow, foundChatTopic] = await Promise.all([
      FollowerFollowing.findOne({ fromUserId: senderUserId, toUserId: receiverUserId }),
      ChatTopic.findOne({
        $or: [{ $and: [{ senderUserId }, { receiverUserId }] }, { $and: [{ senderUserId: receiverUserId }, { receiverUserId: senderUserId }] }],
      }),
    ]);

    const date = new Date().toLocaleString();

    let messageType = 5;
    let finalMessage = message || "";

    if (!follow && !foundChatTopic?.isAccepted) {
      console.log("Users do not follow each other - creating chat request from replyToStory.");

      let chatRequestTopic = await ChatRequestTopic.findOne({
        $or: [
          { senderUserId, receiverUserId },
          { senderUserId: receiverUserId, receiverUserId: senderUserId },
        ],
      });

      if (!chatRequestTopic) {
        chatRequestTopic = new ChatRequestTopic({
          senderUserId,
          receiverUserId,
          status: 1,
        });
        await chatRequestTopic.save();
      }

      const messageRequest = new ChatRequest({
        senderUserId,
        chatRequestTopicId: chatRequestTopic._id,
        storyOwnerId: story.user._id,
        storyId: storyId,
        messageType,
        message: finalMessage,
        image: "",
        audio: "",
        date,
      });

      chatRequestTopic.chatRequestId = messageRequest._id;

      let chatTopic =
        foundChatTopic ||
        new ChatTopic({
          senderUserId,
          receiverUserId,
          chatId: null,
          isAccepted: false,
        });

      const chat = new Chat({
        senderUserId,
        chatTopicId: chatTopic._id,
        storyOwnerId: story.user._id,
        storyId: storyId,
        messageType,
        message: finalMessage,
        image: "",
        audio: "",
        date,
      });

      chatTopic.chatId = chat._id;

      await Promise.all([messageRequest.save(), chatRequestTopic.save(), chatTopic.save(), chat.save()]);

      if (!receiverUser.isBlock && receiverUser.fcmToken) {
        const adminInstance = await admin;
        const payload = {
          token: receiverUser.fcmToken,
          notification: {
            title: `Reply to your story from ${user.name}`,
            body: `${user.name} replied: ${finalMessage}`,
            image: user.image || "",
          },
          data: {
            type: "CHAT_REQUEST",
          },
        };

        adminInstance
          .messaging()
          .send(payload)
          .then((response) => console.log("Notification sent:", response))
          .catch((error) => console.error("Notification error:", error));
      }
    } else {
      console.log("Users follow each other - sending direct chat from replyToStory.");

      let chatTopic =
        foundChatTopic ||
        new ChatTopic({
          senderUserId,
          receiverUserId,
          isAccepted: true,
        });

      const chat = new Chat({
        senderUserId,
        chatTopicId: chatTopic._id,
        storyOwnerId: story.user._id,
        storyId: storyId,
        messageType,
        message: finalMessage,
        image: "",
        audio: "",
        date,
      });

      chatTopic.chatId = chat._id;
      chatTopic.isAccepted = true;

      await Promise.all([chat.save(), chatTopic.save()]);

      if (!receiverUser.isBlock && receiverUser.fcmToken) {
        const adminInstance = await admin;
        const payload = {
          token: receiverUser.fcmToken,
          notification: {
            title: `${user.name} replied to your story`,
            body: finalMessage,
            image: user.image || "",
          },
          data: {
            type: "CHAT",
          },
        };

        adminInstance
          .messaging()
          .send(payload)
          .then((response) => console.log("Notification sent:", response))
          .catch((error) => console.error("Notification error:", error));
      }
    }
  } catch (error) {
    console.error("Error in replyToStory:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete story
exports.deleteStory = async (req, res) => {
  try {
    const { userId, storyId } = req.query;

    if (!userId || !storyId) {
      return res.status(200).json({
        status: false,
        message: "Both userId and storyId are required.",
      });
    }

    const [user, story] = await Promise.all([User.findOne({ _id: userId, isFake: false }).select("_id"), Story.findOne({ _id: storyId, user: userId })]);

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "User not found.",
      });
    }

    if (user.isBlock) {
      return res.status(403).json({
        status: false,
        message: "User is blocked.",
      });
    }

    if (!story) {
      return res.status(200).json({
        status: false,
        message: "Story not found for this user.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Story deleted successfully.",
    });

    if (story.mediaImageUrl) {
      deleteFromStorage(story.mediaImageUrl);
    }

    if (story.mediaVideoUrl) {
      deleteFromStorage(story.mediaVideoUrl);
    }

    await Promise.all([StoryView.deleteMany({ storyId: storyId }), Story.deleteOne({ _id: storyId })]);
  } catch (error) {
    console.error("Error deleting story:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//get followed user's stories
exports.getFollowedUserStories = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "userId is required." });
    }

    const [user] = await Promise.all([User.findOne({ _id: userId, isFake: false }, "_id isBlock")]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: "User is blocked." });
    }

    const realStoriesPipeline = [
      {
        $match: { isFake: false },
      },
      {
        $lookup: {
          from: "followerfollowings",
          let: { storyUserId: "$user" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$toUserId", "$$storyUserId"] }, { $eq: ["$fromUserId", new mongoose.Types.ObjectId(userId)] }],
                },
              },
            },
          ],
          as: "followMatch",
        },
      },
      {
        $match: { followMatch: { $ne: [] } },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "songs",
          localField: "backgroundSong",
          foreignField: "_id",
          as: "backgroundSong",
        },
      },
      {
        $unwind: {
          path: "$backgroundSong",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "storyviews",
          let: { storyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$storyId", "$$storyId"] },
              },
            },
          ],
          as: "viewsData",
        },
      },
      {
        $lookup: {
          from: "storyreactions",
          let: { storyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$storyId", "$$storyId"] },
              },
            },
          ],
          as: "reactionsData",
        },
      },
      {
        $addFields: {
          viewsCount: { $size: "$viewsData" },
          reactionsCount: { $size: "$reactionsData" },
        },
      },
      {
        $lookup: {
          from: "storyviews",
          let: { storyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$storyId", "$$storyId"] }, { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] }],
                },
              },
            },
          ],
          as: "viewStatus",
        },
      },
      {
        $addFields: {
          isView: { $gt: [{ $size: "$viewStatus" }, 0] },
        },
      },
      {
        $project: {
          _id: 1,
          mediaImageUrl: 1,
          mediaVideoUrl: 1,
          viewsCount: 1,
          reactionsCount: 1,
          isView: 1,
          storyType: 1,
          duration: 1,
          isFake: 1,
          createdAt: 1,
          user: {
            _id: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            image: "$user.image",
            isFake: "$user.isFake",
            isProfileImageBanned: "$user.isProfileImageBanned",
          },
          backgroundSong: {
            _id: "$backgroundSong._id",
            songTitle: "$backgroundSong.songTitle",
            songImage: "$backgroundSong.songImage",
            singerName: "$backgroundSong.singerName",
            songTime: "$backgroundSong.songTime",
            songLink: "$backgroundSong.songLink",
          },
        },
      },
      {
        $sort: {
          isFake: 1,
          isView: 1,
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: "$user._id",
          user: { $first: "$user" },
          stories: {
            $push: {
              _id: "$_id",
              mediaImageUrl: "$mediaImageUrl",
              mediaVideoUrl: "$mediaVideoUrl",
              viewsCount: "$viewsCount",
              reactionsCount: "$reactionsCount",
              isView: "$isView",
              backgroundSong: "$backgroundSong",
              storyType: "$storyType",
              duration: "$duration",
              isFake: "$isFake",
              createdAt: "$createdAt",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          user: 1,
          stories: 1,
        },
      },
    ];

    const fakeStoriesPipeline = [
      {
        $match: { isFake: true },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "songs",
          localField: "backgroundSong",
          foreignField: "_id",
          as: "backgroundSong",
        },
      },
      {
        $unwind: {
          path: "$backgroundSong",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "storyviews",
          let: { storyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$storyId", "$$storyId"] },
              },
            },
          ],
          as: "viewsData",
        },
      },
      {
        $lookup: {
          from: "storyreactions",
          let: { storyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$storyId", "$$storyId"] },
              },
            },
          ],
          as: "reactionsData",
        },
      },
      {
        $addFields: {
          viewsCount: { $size: "$viewsData" },
          reactionsCount: { $size: "$reactionsData" },
        },
      },
      {
        $lookup: {
          from: "storyviews",
          let: { storyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$storyId", "$$storyId"] }, { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] }],
                },
              },
            },
          ],
          as: "viewStatus",
        },
      },
      {
        $addFields: {
          isView: { $gt: [{ $size: "$viewStatus" }, 0] },
        },
      },
      {
        $project: {
          _id: 1,
          mediaImageUrl: 1,
          mediaVideoUrl: 1,
          viewsCount: 1,
          reactionsCount: 1,
          isView: 1,
          storyType: 1,
          duration: 1,
          isFake: 1,
          createdAt: 1,
          user: {
            _id: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            image: "$user.image",
            isFake: "$user.isFake",
            isProfileImageBanned: "$user.isProfileImageBanned",
          },
          backgroundSong: {
            _id: "$backgroundSong._id",
            songTitle: "$backgroundSong.songTitle",
            songImage: "$backgroundSong.songImage",
            singerName: "$backgroundSong.singerName",
            songTime: "$backgroundSong.songTime",
            songLink: "$backgroundSong.songLink",
          },
        },
      },
      {
        $group: {
          _id: "$user._id",
          user: { $first: "$user" },
          stories: {
            $push: {
              _id: "$_id",
              mediaImageUrl: "$mediaImageUrl",
              mediaVideoUrl: "$mediaVideoUrl",
              viewsCount: "$viewsCount",
              reactionsCount: "$reactionsCount",
              isView: "$isView",
              backgroundSong: "$backgroundSong",
              storyType: "$storyType",
              duration: "$duration",
              isFake: "$isFake",
              createdAt: "$createdAt",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          user: 1,
          stories: 1,
        },
      },
    ];

    const [realStories, fakeStories] = await Promise.all([Story.aggregate(realStoriesPipeline), settingJSON?.isFakeData ? Story.aggregate(fakeStoriesPipeline) : []]);

    const combinedStories = [...realStories, ...fakeStories];

    return res.status(200).json({
      status: true,
      message: "Stories from followed users fetched successfully.",
      storyGroup: combinedStories,
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//get own stories
exports.getOwnStories = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(200).json({
        status: false,
        message: "userId is required.",
      });
    }

    const user = await User.findOne({ _id: userId, isFake: false }, "_id name userName image isBlock isProfileImageBanned");

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: "User is blocked." });
    }

    const stories = await Story.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "songs",
          localField: "backgroundSong",
          foreignField: "_id",
          as: "backgroundSong",
        },
      },
      {
        $unwind: {
          path: "$backgroundSong",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          mediaImageUrl: 1,
          mediaVideoUrl: 1,
          viewsCount: 1,
          reactionsCount: 1,
          storyType: 1,
          duration: 1,
          createdAt: 1,
          backgroundSong: {
            _id: "$backgroundSong._id",
            songTitle: "$backgroundSong.songTitle",
            songImage: "$backgroundSong.songImage",
            singerName: "$backgroundSong.singerName",
            songTime: "$backgroundSong.songTime",
            songLink: "$backgroundSong.songLink",
          },
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "User's own stories fetched successfully.",
      storyGroup: {
        user: {
          _id: user._id,
          name: user.name,
          userName: user.userName,
          image: user.image,
          isProfileImageBanned: user.isProfileImageBanned,
        },
        stories: stories,
      },
    });
  } catch (error) {
    console.error("Error fetching own stories:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
