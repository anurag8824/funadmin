const Chat = require("../../models/chat.model");

//import models
const ChatTopic = require("../../models/chatTopic.model");
const User = require("../../models/user.model");
const FollowerFollowing = require("../../models/followerFollowing.model");
const ChatRequestTopic = require("../../models/chatRequestTopic.model");
const ChatRequest = require("../../models/chatRequest.model");
const Notification = require("../../models/notification.model");

//private key
const admin = require("../../util/privateKey");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//mongoose
const mongoose = require("mongoose");
const axios = require("axios");

const CHAT_MESSAGE_TYPES = {
  TEXT: 1,
  IMAGE: 2,
  AUDIO: 3,
  VIDEO: 4,
};

const emitChatRealtime = ({ eventName = "message", messageId, senderUserId, receiverUserId, messageType, message, image, audio, video, thumbnail }) => {
  const io = global.io;
  if (!io || !senderUserId || !receiverUserId) return;
  const payload = {
    data: {
      senderUserId: senderUserId.toString(),
      receiverUserId: receiverUserId.toString(),
      messageType: Number(messageType) || CHAT_MESSAGE_TYPES.TEXT,
      message: message || "",
      image: image || "",
      audio: audio || "",
      video: video || "",
      thumbnail: thumbnail || "",
    },
    messageId: messageId ? messageId.toString() : undefined,
  };
  io.in(`globalRoom:${senderUserId}`).emit(eventName, payload);
  io.in(`globalRoom:${receiverUserId}`).emit(eventName, payload);
};

const emitPeerReadReceipt = (readByUserId, notifyUserId) => {
  const io = global.io;
  if (!io || !readByUserId || !notifyUserId) return;
  io.in(`globalRoom:${notifyUserId.toString()}`).emit("messageReceipt", {
    data: JSON.stringify({ type: "read", readByUserId: readByUserId.toString() }),
  });
};

const emitChatMessageDeleted = (messageId, a, b) => {
  const io = global.io;
  if (!io || !messageId) return;
  const payload = { data: JSON.stringify({ messageId: messageId.toString() }) };
  io.in(`globalRoom:${a.toString()}`).emit("chatMessageDeleted", payload);
  io.in(`globalRoom:${b.toString()}`).emit("chatMessageDeleted", payload);
};

const emitChatMessageEdited = (messageId, newText, a, b) => {
  const io = global.io;
  if (!io || !messageId) return;
  const payload = { data: JSON.stringify({ messageId: messageId.toString(), message: newText || "" }) };
  io.in(`globalRoom:${a.toString()}`).emit("chatMessageEdited", payload);
  io.in(`globalRoom:${b.toString()}`).emit("chatMessageEdited", payload);
};

const emitReactionUpdate = (targetMessageId, reactions, userA, userB) => {
  const io = global.io;
  if (!io || !targetMessageId) return;
  const payload = {
    data: JSON.stringify({
      targetMessageId: targetMessageId.toString(),
      reactions: (reactions || []).map((r) => ({
        userId: r.userId ? r.userId.toString() : "",
        emoji: r.emoji || "",
      })),
    }),
  };
  io.in(`globalRoom:${userA.toString()}`).emit("chatReactionUpdate", payload);
  io.in(`globalRoom:${userB.toString()}`).emit("chatReactionUpdate", payload);
};

const getChatNotificationBody = (messageType, text) => {
  if (messageType === CHAT_MESSAGE_TYPES.IMAGE) return "📷 Sent a photo";
  if (messageType === CHAT_MESSAGE_TYPES.AUDIO) return "🎵 Sent an audio clip";
  if (messageType === CHAT_MESSAGE_TYPES.VIDEO) return "🎬 Sent a video";
  const body = typeof text === "string" ? text.trim() : "";
  if (/\/post\/[a-fA-F0-9]{24}/.test(body) || /funtap:\/\/post\//i.test(body)) return "📎 Shared a post";
  if (/\/video\/[a-fA-F0-9]{24}/.test(body) || /funtap:\/\/(?:reel|video)\//i.test(body)) return "📎 Shared a reel";
  if (/^https?:\/\//i.test(body)) return "🗨️ Sent a message";
  return body ? `🗨️ ${body}` : "🗨️ Sent a message";
};

//send a message or create a message request ( image or audio )
exports.createChat = async (req, res) => {
  try {
    if (!req.query.senderUserId || !req.query.receiverUserId || !req.query.messageType) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      if (req?.body?.audio) {
        await deleteFromStorage(req?.body?.audio);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const messageType = Number(req.query.messageType);
    const incomingText = typeof req?.body?.message === "string" ? req.body.message.trim() : "";
    const senderUserId = new mongoose.Types.ObjectId(req.query.senderUserId);
    const receiverUserId = new mongoose.Types.ObjectId(req.query.receiverUserId);

    if (![CHAT_MESSAGE_TYPES.TEXT, CHAT_MESSAGE_TYPES.IMAGE, CHAT_MESSAGE_TYPES.AUDIO, CHAT_MESSAGE_TYPES.VIDEO].includes(messageType)) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }
      if (req?.body?.audio) {
        await deleteFromStorage(req?.body?.audio);
      }
      return res.status(200).json({ status: false, message: "Invalid messageType. Use 1=text, 2=image, 3=audio, 4=video." });
    }

    if (messageType === CHAT_MESSAGE_TYPES.TEXT && !incomingText) {
      return res.status(200).json({ status: false, message: "message is required for text chat." });
    }

    const imageUrl = typeof req?.body?.image === "string" ? req.body.image.trim() : "";
    const audioUrl = typeof req?.body?.audio === "string" ? req.body.audio.trim() : "";
    const videoUrl = typeof req?.body?.video === "string" ? req.body.video.trim() : "";
    const thumbnailUrl = typeof req?.body?.thumbnail === "string" ? req.body.thumbnail.trim() : "";
    if (messageType === CHAT_MESSAGE_TYPES.IMAGE && !imageUrl) {
      return res.status(200).json({ status: false, message: "image is required for image chat." });
    }
    if (messageType === CHAT_MESSAGE_TYPES.AUDIO && !audioUrl) {
      return res.status(200).json({ status: false, message: "audio is required for audio chat." });
    }
    if (messageType === CHAT_MESSAGE_TYPES.VIDEO && !videoUrl) {
      return res.status(200).json({ status: false, message: "video is required for video chat." });
    }

    let chatTopic;
    const [follow, senderUser, receiverUser, foundChatTopic] = await Promise.all([
      FollowerFollowing.findOne({ fromUserId: senderUserId, toUserId: receiverUserId }),
      User.findById(senderUserId),
      User.findById(receiverUserId),
      ChatTopic.findOne({
        $or: [{ $and: [{ senderUserId: senderUserId }, { receiverUserId: receiverUserId }] }, { $and: [{ senderUserId: receiverUserId }, { receiverUserId: senderUserId }] }],
      }),
    ]);

    if (!senderUser) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      if (req?.body?.audio) {
        await deleteFromStorage(req?.body?.audio);
      }

      return res.status(200).json({ status: false, message: "SenderUser does not found." });
    }

    if (!receiverUser) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      if (req?.body?.audio) {
        await deleteFromStorage(req?.body?.audio);
      }

      return res.status(200).json({ status: false, message: "ReceiverUser dose not found." });
    }

    if (!follow && !foundChatTopic?.isAccepted) {
      console.log("Users do not follow each other.");

      let chatRequestTopic;
      const foundChatRequestTopic = await ChatRequestTopic.findOne({
        $or: [{ $and: [{ senderUserId: senderUserId }, { receiverUserId: receiverUserId }] }, { $and: [{ senderUserId: receiverUserId }, { receiverUserId: senderUserId }] }],
      });

      chatRequestTopic = foundChatRequestTopic;

      if (!chatRequestTopic) {
        chatRequestTopic = new ChatRequestTopic();

        chatRequestTopic.senderUserId = senderUser._id;
        chatRequestTopic.receiverUserId = receiverUser._id;
        chatRequestTopic.status = 1;
      }

      const messageRequest = new ChatRequest();

      messageRequest.senderUserId = senderUser._id;

      messageRequest.messageType = messageType;
      messageRequest.message = messageType === CHAT_MESSAGE_TYPES.TEXT ? incomingText : "";
      messageRequest.image = messageType === CHAT_MESSAGE_TYPES.IMAGE ? imageUrl : "";
      messageRequest.audio = messageType === CHAT_MESSAGE_TYPES.AUDIO ? audioUrl : "";
      messageRequest.video = messageType === CHAT_MESSAGE_TYPES.VIDEO ? videoUrl : "";
      messageRequest.thumbnail = messageType === CHAT_MESSAGE_TYPES.VIDEO ? thumbnailUrl : "";

      messageRequest.chatRequestTopicId = chatRequestTopic._id;
      messageRequest.date = new Date().toLocaleString();

      chatRequestTopic.chatRequestId = messageRequest._id;

      chatTopic = foundChatTopic;

      if (!chatTopic) {
        chatTopic = new ChatTopic();

        chatTopic.senderUserId = senderUser._id;
        chatTopic.receiverUserId = receiverUser._id;
        chatTopic.isAccepted = false;
      }

      const chat = new Chat();
      chat.senderUserId = messageRequest.senderUserId;
      chat.messageType = messageRequest.messageType;
      chat.message = messageRequest.message;
      chat.image = messageRequest.image;
      chat.audio = messageRequest.audio;
      chat.video = messageRequest.video;
      chat.thumbnail = messageRequest.thumbnail;
      chat.chatTopicId = chatTopic._id;
      chat.date = new Date().toLocaleString();
      chat.isDelivered = false;

      chatTopic.chatId = chat._id;

      await Promise.all([chatRequestTopic.save(), messageRequest.save(), chatTopic.save(), chat.save()]);

      res.status(200).json({
        status: true,
        message: "Message request created successfully.",
        chat: messageRequest,
      });

      emitChatRealtime({
        eventName: "messageRequest",
        messageId: messageRequest?._id,
        senderUserId: senderUser._id,
        receiverUserId: receiverUser._id,
        messageType,
        message: messageRequest.message,
        image: messageRequest.image,
        audio: messageRequest.audio,
        video: messageRequest.video,
        thumbnail: messageRequest.thumbnail,
      });

      const requestNotification = new Notification();
      requestNotification.userId = receiverUser._id;
      requestNotification.otherUserId = senderUser._id;
      requestNotification.title = `New Message Request from ${senderUser.name}`;
      requestNotification.message = `${senderUser.name} sent a message request.`;
      requestNotification.image = senderUser?.image || "";
      requestNotification.date = new Date().toLocaleString();
      requestNotification.save().catch((e) => console.log("Error saving message request notification:", e));

      if (!receiverUser.isBlock && receiverUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: receiverUser.fcmToken,
          notification: {
            title: `New Message Request from ${senderUser.name}`,
            body: `${senderUser.name} sent a message request.`,
            image: senderUser.image,
          },
          data: {
            type: "CHAT_REQUEST",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent notification with response: ", response);
          })
          .catch(async (error) => {
            if (error?.errorInfo?.code === "messaging/registration-token-not-registered") {
              await User.updateOne({ _id: receiverUser._id }, { $set: { fcmToken: null } });
            }
            console.log("Error sending notification: ", error);
          });
      }

      if (req?.body?.image && messageType == 2) {
        const chatImage = req?.body?.image;

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

        if (checks.length > 0 && chatImage) {
          try {
            const response = await axios.get("https://api.sightengine.com/1.0/check.json", {
              params: {
                url: chatImage,
                models: checks.join(","),
                api_user: settingJSON?.sightengineUser,
                api_secret: settingJSON?.sightengineSecret,
              },
            });

            const result = response.data;
            console.log("Image moderation result for chat image: ", chatImage, ":", result);

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

            await Chat.updateOne({ _id: chat._id }, { isChatMediaBanned: isBanned });

            console.log(`Image ${chatImage} isBanned for chat image:: ${isBanned}`);

            if (senderUser?.fcmToken !== null && isBanned) {
              const adminPromise = await admin;

              const payload = {
                token: senderUser?.fcmToken,
                notification: {
                  title: "🚫 Chat Image Policy Violation 🚫",
                  body: "Your chat image doesn't meet our community guidelines. Please replace it with an appropriate one to continue uninterrupted. Thank you! 🌟",
                },
                data: {
                  type: "CHAT_IMAGE_BANNED",
                },
              };

              try {
                if (isBanned) {
                  const response = await adminPromise.messaging().send(payload);
                  console.log("Successfully sent notification: ", response);
                } else {
                  console.log("Image not banned for chat image");
                }
              } catch (error) {
                console.error("Error sending notification: ", error);
              }
            }
          } catch (error) {
            console.log(`Error processing chat image: ${chatImage}:`, error.response?.data || error.message);
          }
        } else {
          console.log("No checks selected or no image URL provided.");
        }
      }
    } else {
      console.log("Users follow each other.");

      chatTopic = foundChatTopic;

      if (!chatTopic) {
        chatTopic = new ChatTopic();

        chatTopic.senderUserId = senderUser._id;
        chatTopic.receiverUserId = receiverUser._id;
      }

      const chat = new Chat();

      chat.senderUserId = senderUser._id;

      chat.messageType = messageType;
      chat.message = messageType === CHAT_MESSAGE_TYPES.TEXT ? incomingText : "";
      chat.image = messageType === CHAT_MESSAGE_TYPES.IMAGE ? imageUrl : "";
      chat.audio = messageType === CHAT_MESSAGE_TYPES.AUDIO ? audioUrl : "";
      chat.video = messageType === CHAT_MESSAGE_TYPES.VIDEO ? videoUrl : "";
      chat.thumbnail = messageType === CHAT_MESSAGE_TYPES.VIDEO ? thumbnailUrl : "";

      chat.chatTopicId = chatTopic._id;
      chat.date = new Date().toLocaleString();
      chat.isDelivered = false;

      chatTopic.chatId = chat._id;
      chatTopic.isAccepted = true;

      await Promise.all([chat.save(), chatTopic.save()]);

      res.status(200).json({
        status: true,
        message: "Message sent successfully.",
        chat: chat,
      });

      emitChatRealtime({
        eventName: "message",
        messageId: chat?._id,
        senderUserId: senderUser._id,
        receiverUserId: receiverUser._id,
        messageType,
        message: chat.message,
        image: chat.image,
        audio: chat.audio,
        video: chat.video,
        thumbnail: chat.thumbnail,
      });

      const chatNotification = new Notification();
      chatNotification.userId = receiverUser._id;
      chatNotification.otherUserId = senderUser._id;
      chatNotification.title = `${senderUser.name} sent you a message 📩`;
      chatNotification.message = getChatNotificationBody(messageType, chat.message);
      chatNotification.image = senderUser?.image || "";
      chatNotification.date = new Date().toLocaleString();
      chatNotification.save().catch((e) => console.log("Error saving chat notification:", e));

      if (!receiverUser.isBlock && receiverUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: receiverUser.fcmToken,
          notification: {
            title: `${senderUser.name} sent you a message 📩`,
            body: getChatNotificationBody(messageType, chat.message),
            image: senderUser?.image,
          },
          data: {
            type: "CHAT",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch(async (error) => {
            if (error?.errorInfo?.code === "messaging/registration-token-not-registered") {
              await User.updateOne({ _id: receiverUser._id }, { $set: { fcmToken: null } });
            }
            console.log("Error sending message:      ", error);
          });
      }

      if (req?.body?.image && messageType == 2) {
        const chatImage = req?.body?.image;

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

        if (checks.length > 0 && chatImage) {
          try {
            const response = await axios.get("https://api.sightengine.com/1.0/check.json", {
              params: {
                url: chatImage,
                models: checks.join(","),
                api_user: settingJSON?.sightengineUser,
                api_secret: settingJSON?.sightengineSecret,
              },
            });

            const result = response.data;
            console.log("Image moderation result for chat image: ", chatImage, ":", result);

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

            await Chat.updateOne({ _id: chat._id }, { isChatMediaBanned: isBanned });

            console.log(`Image ${chatImage} isBanned for chat image:: ${isBanned}`);

            if (senderUser?.fcmToken !== null && isBanned) {
              const adminPromise = await admin;

              const payload = {
                token: senderUser?.fcmToken,
                notification: {
                  title: "🚫 Chat Image Policy Violation 🚫",
                  body: "Your chat image doesn't meet our community guidelines. Please replace it with an appropriate one to continue uninterrupted. Thank you! 🌟",
                },
                data: {
                  type: "CHAT_IMAGE_BANNED",
                },
              };

              try {
                if (isBanned) {
                  const response = await adminPromise.messaging().send(payload);
                  console.log("Successfully sent notification: ", response);
                } else {
                  console.log("Image not banned for chat image");
                }
              } catch (error) {
                console.error("Error sending notification: ", error);
              }
            }
          } catch (error) {
            console.log(`Error processing chat image: ${chatImage}:`, error.response?.data || error.message);
          }
        } else {
          console.log("No checks selected or no image URL provided.");
        }
      }
    }
  } catch (error) {
    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    if (req?.body?.audio) {
      await deleteFromStorage(req?.body?.audio);
    }

    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get old chat between the users
exports.getOldChat = async (req, res) => {
  try {
    if (!req.query.senderUserId || !req.query.receiverUserId) {
      return res.status(200).json({ status: false, message: "senderUserId and receiverUserId must be requried." });
    }

    const senderUserId = new mongoose.Types.ObjectId(req.query.senderUserId);
    const receiverUserId = new mongoose.Types.ObjectId(req.query.receiverUserId);

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let chatTopic;
    const [senderUser, receiverUser, foundChatTopic] = await Promise.all([
      User.findById(senderUserId),
      User.findById(receiverUserId),
      ChatTopic.findOne({
        $or: [{ $and: [{ senderUserId: senderUserId }, { receiverUserId: receiverUserId }] }, { $and: [{ senderUserId: receiverUserId }, { receiverUserId: senderUserId }] }],
      }),
    ]);

    chatTopic = foundChatTopic;

    if (!senderUser) {
      return res.status(200).json({ status: false, message: "SenderUser does not found." });
    }

    if (!receiverUser) {
      return res.status(200).json({ status: false, message: "ReceiverUser dose not found." });
    }

    if (!chatTopic) {
      chatTopic = new ChatTopic();

      chatTopic.senderUserId = senderUser._id;
      chatTopic.receiverUserId = receiverUser._id;
    }

    await Promise.all([
      chatTopic.save(),
      Chat.updateMany(
        {
          $and: [
            { chatTopicId: chatTopic._id },
            { isRead: false },
            { senderUserId: { $ne: senderUserId } },
          ],
        },
        { $set: { isRead: true } },
        { new: true }
      ),
    ]);

    emitPeerReadReceipt(senderUserId, receiverUserId);

    const chat = await Chat.find({ chatTopicId: chatTopic._id })
      .populate("storyOwnerId", "name userName image isProfileImageBanned")
      .populate({
        path: "storyId",
        select: "backgroundSong mediaImageUrl mediaVideoUrl storyType duration viewsCount reactionsCount createdAt",
        populate: {
          path: "backgroundSong",
          select: "songTitle songImage singerName songTime songLink",
        },
      })
      .sort({ createdAt: -1 })
      .skip((start - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({ status: true, message: "Retrive old chat between the users.", chatTopic: chatTopic._id, chat: chat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.deleteChatMessage = async (req, res) => {
  try {
    const chatId = req.query.chatId;
    const userId = req.query.userId;
    if (!chatId || !userId) {
      return res.status(200).json({ status: false, message: "chatId and userId are required." });
    }
    const chat = await Chat.findById(chatId).lean();
    if (!chat) {
      return res.status(200).json({ status: false, message: "Message not found." });
    }
    if (chat.senderUserId.toString() !== userId) {
      return res.status(200).json({ status: false, message: "You can only delete your own messages." });
    }
    const topic = await ChatTopic.findById(chat.chatTopicId).lean();
    if (!topic) {
      await Chat.deleteOne({ _id: chatId });
      return res.status(200).json({ status: true, message: "Deleted." });
    }
    const peer =
      topic.senderUserId.toString() === userId ? topic.receiverUserId : topic.senderUserId;
    await Chat.deleteOne({ _id: chatId });
    emitChatMessageDeleted(chat._id, userId, peer);
    return res.status(200).json({ status: true, message: "Message deleted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.editChatMessage = async (req, res) => {
  try {
    const chatId = req.query.chatId;
    const userId = req.query.userId;
    const newText = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!chatId || !userId) {
      return res.status(200).json({ status: false, message: "chatId and userId are required." });
    }
    if (!newText) {
      return res.status(200).json({ status: false, message: "message is required." });
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(200).json({ status: false, message: "Message not found." });
    }
    if (chat.senderUserId.toString() !== userId) {
      return res.status(200).json({ status: false, message: "You can only edit your own messages." });
    }
    if (Number(chat.messageType) !== CHAT_MESSAGE_TYPES.TEXT) {
      return res.status(200).json({ status: false, message: "Only text messages can be edited." });
    }
    chat.message = newText;
    await chat.save();
    const topic = await ChatTopic.findById(chat.chatTopicId).lean();
    if (topic) {
      const peer =
        topic.senderUserId.toString() === userId ? topic.receiverUserId : topic.senderUserId;
      emitChatMessageEdited(chat._id, newText, userId, peer);
    }
    return res.status(200).json({ status: true, message: "Updated.", chat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const senderUserId = req.query.senderUserId;
    const targetMessageId = req.query.targetMessageId;
    const emoji = typeof req.body?.emoji === "string" ? req.body.emoji.trim() : "";
    if (!senderUserId || !targetMessageId || !emoji) {
      return res.status(200).json({ status: false, message: "senderUserId, targetMessageId and emoji are required." });
    }
    const chat = await Chat.findById(targetMessageId);
    if (!chat) {
      return res.status(200).json({ status: false, message: "Message not found." });
    }
    const topic = await ChatTopic.findById(chat.chatTopicId).lean();
    if (!topic) {
      return res.status(200).json({ status: false, message: "Topic not found." });
    }
    const sid = senderUserId.toString();
    const ok =
      topic.senderUserId.toString() === sid || topic.receiverUserId.toString() === sid;
    if (!ok) {
      return res.status(200).json({ status: false, message: "Not allowed." });
    }
    const uid = new mongoose.Types.ObjectId(senderUserId);
    chat.reactions = (chat.reactions || []).filter((r) => r.userId.toString() !== sid);
    chat.reactions.push({ userId: uid, emoji });
    await chat.save();
    emitReactionUpdate(chat._id, chat.reactions, topic.senderUserId, topic.receiverUserId);
    return res.status(200).json({ status: true, message: "OK", chat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
