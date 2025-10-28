const Chat = require("../../models/chat.model");

//import models
const ChatTopic = require("../../models/chatTopic.model");
const User = require("../../models/user.model");
const FollowerFollowing = require("../../models/followerFollowing.model");
const ChatRequestTopic = require("../../models/chatRequestTopic.model");
const ChatRequest = require("../../models/chatRequest.model");

//private key
const admin = require("../../util/privateKey");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//mongoose
const mongoose = require("mongoose");

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
    const senderUserId = new mongoose.Types.ObjectId(req.query.senderUserId);
    const receiverUserId = new mongoose.Types.ObjectId(req.query.receiverUserId);

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

      if (messageType == 2) {
        messageRequest.messageType = 2;
        messageRequest.message = "📸 Image";
        messageRequest.image = req?.body?.image ? req?.body?.image : "";
      } else if (messageType == 3) {
        messageRequest.messageType = 3;
        messageRequest.message = "🎤 Audio";
        messageRequest.audio = req?.body?.audio ? req?.body?.audio : "";
      } else {
        if (req?.body?.image) {
          await deleteFromStorage(req?.body?.image);
        }

        if (req?.body?.audio) {
          await deleteFromStorage(req?.body?.audio);
        }

        return res.status(200).json({ status: false, message: "messageType must be passed valid." });
      }

      messageRequest.chatRequestTopicId = chatRequestTopic._id;
      messageRequest.date = new Date().toLocaleString();

      chatRequestTopic.chatRequestId = messageRequest._id;

      chatTopic = foundChatTopic;

      if (!chatTopic) {
        chatTopic = new ChatTopic();

        chatTopic.senderUserId = senderUser._id;
        chatTopic.receiverUserId = receiverUser._id;
        isAccepted = false;
      }

      const chat = new Chat();
      chat.senderUserId = messageRequest.senderUserId;
      chat.messageType = messageRequest.messageType;
      chat.message = messageRequest.message;
      chat.image = messageRequest.image;
      chat.audio = messageRequest.audio;
      chat.chatTopicId = chatTopic._id;
      chat.date = new Date().toLocaleString();

      chatTopic.chatId = chat._id;

      await Promise.all([chatRequestTopic.save(), messageRequest.save(), chatTopic.save(), chat.save()]);

      res.status(200).json({
        status: true,
        message: "Message request created successfully.",
        chat: messageRequest,
      });

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
          .catch((error) => {
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

      if (messageType == 2) {
        chat.messageType = 2;
        chat.message = "📸 Image";
        chat.image = req?.body?.image ? req?.body?.image : "";
      } else if (messageType == 3) {
        chat.messageType = 3;
        chat.message = "🎤 Audio";
        chat.audio = req?.body?.audio ? req?.body?.audio : "";
      } else {
        if (req?.body?.image) {
          await deleteFromStorage(req?.body?.image);
        }

        if (req?.body?.audio) {
          await deleteFromStorage(req?.body?.audio);
        }

        return res.status(200).json({ status: false, message: "messageType must be passed valid." });
      }

      chat.chatTopicId = chatTopic._id;
      chat.date = new Date().toLocaleString();

      chatTopic.chatId = chat._id;
      chatTopic.isAccepted = true;

      await Promise.all([chat.save(), chatTopic.save()]);

      res.status(200).json({
        status: true,
        message: "Message sent successfully.",
        chat: chat,
      });

      if (!receiverUser.isBlock && receiverUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: receiverUser.fcmToken,
          notification: {
            title: `${senderUser.name} sent you a message 📩`,
            body: `🗨️ ${chat.message}`,
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
          .catch((error) => {
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

    await Promise.all([chatTopic.save(), Chat.updateMany({ $and: [{ chatTopicId: chatTopic._id }, { isRead: false }] }, { $set: { isRead: true } }, { new: true })]);

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

    console.log("chat  ", chat);

    return res.status(200).json({ status: true, message: "Retrive old chat between the users.", chatTopic: chatTopic._id, chat: chat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
