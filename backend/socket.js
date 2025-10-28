///import model
const User = require("./models/user.model");
const ChatTopic = require("./models/chatTopic.model");
const Chat = require("./models/chat.model");
const LiveUser = require("./models/liveUser.model");
const LiveView = require("./models/liveView.model");
const LiveHistory = require("./models/liveHistory.model");
const History = require("./models/history.model");
const FollowerFollowing = require("./models/followerFollowing.model");
const ChatRequestTopic = require("./models/chatRequestTopic.model");
const ChatRequest = require("./models/chatRequest.model");
const TopGifter = require("./models/topGifter.model");
const Gift = require("./models/gift.model");

//private key
const admin = require("./util/privateKey");

//moment
const moment = require("moment-timezone");

//mongoose
const mongoose = require("mongoose");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("./util/generateHistoryUniqueId");

io.on("connection", async (socket) => {
  console.log("Socket Connection done Client ID: ", socket.id);
  console.log("socket.connected:           ", socket.connected);
  console.log("Current rooms:", socket.rooms);
  console.log("socket.handshake.query", socket.handshake.query);

  const { globalRoom } = socket.handshake.query;
  const id = globalRoom && globalRoom.split(":")[1];
  console.log("socket connected with userId:   ", id);

  if (globalRoom) {
    console.log("Socket connected with userId:", id);

    //check if the socket is already in the room
    if (!socket.rooms.has(globalRoom)) {
      socket.join(globalRoom);
      console.log(`Socket joined room: ${globalRoom}`);
    } else {
      console.log(`Socket is already in room: ${globalRoom}`);
    }

    const user = await User.findById(id).select("_id isOnline").lean();

    if (user) {
      await User.findByIdAndUpdate(user._id, { $set: { isOnline: true } }, { new: true });
    }
  }

  //chat
  socket.on("message", async (data) => {
    console.log("data in message =====================================  ", data);

    const parseData = JSON.parse(data);
    console.log("parseData", parseData);

    const [follow, chatTopic] = await Promise.all([
      FollowerFollowing.findOne({ fromUserId: parseData?.senderUserId, toUserId: parseData?.receiverUserId }),
      ChatTopic.findById(parseData?.chatTopicId).populate("senderUserId", "_id name userName image fcmToken isBlock").populate("receiverUserId", "_id name userName image fcmToken isBlock"),
    ]);

    if (!follow && !chatTopic.isAccepted) {
      console.log("Users do not follow each other in message.");

      let chatRequestTopic;
      const foundChatTopic = await ChatRequestTopic.findOne({
        $or: [
          { $and: [{ senderUserId: parseData?.senderUserId }, { receiverUserId: parseData?.receiverUserId }] },
          { $and: [{ senderUserId: parseData?.receiverUserId }, { receiverUserId: parseData?.senderUserId }] },
        ],
      });

      chatRequestTopic = foundChatTopic;

      if (!chatRequestTopic) {
        chatRequestTopic = new ChatRequestTopic();

        chatRequestTopic.senderUserId = parseData?.senderUserId;
        chatRequestTopic.receiverUserId = parseData?.receiverUserId;
      }

      if (parseData?.messageType == 1) {
        const messageRequest = new ChatRequest();

        messageRequest.senderUserId = parseData?.senderUserId;
        messageRequest.messageType = 1;
        messageRequest.message = parseData?.message;
        messageRequest.image = "";
        messageRequest.chatRequestTopicId = chatRequestTopic._id;
        messageRequest.date = new Date().toLocaleString();

        chatRequestTopic.chatRequestId = messageRequest._id;

        const chat = new Chat();
        chat.senderUserId = messageRequest.senderUserId;
        chat.messageType = messageRequest.messageType;
        chat.message = messageRequest.message;
        chat.image = messageRequest.image;
        chat.chatTopicId = chatTopic?._id;
        chat.date = new Date().toLocaleString();

        chatTopic.chatId = chat?._id;

        await Promise.all([chatRequestTopic.save(), messageRequest.save(), chatTopic.save(), chat.save()]);

        io.in("globalRoom:" + chatTopic?.senderUserId?._id.toString()).emit("messageRequest", { data: data, messageId: messageRequest._id });
        io.in("globalRoom:" + chatTopic?.receiverUserId?._id.toString()).emit("messageRequest", { data: data, messageId: messageRequest._id });

        let receiverUser, senderUser;
        if (chatTopic.senderUserId._id.toString() === parseData.senderUserId.toString()) {
          senderUser = chatTopic.senderUserId;
          receiverUser = chatTopic.receiverUserId;
        } else if (chatTopic.receiverUserId._id) {
          senderUser = chatTopic.receiverUserId;
          receiverUser = chatTopic.senderUserId;
        }

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
      } else {
        console.log("other messageType in messageRequest");

        io.in("globalRoom:" + chatTopic?.senderUserId?._id.toString()).emit("messageRequest", { data: data });
        io.in("globalRoom:" + chatTopic?.receiverUserId?._id.toString()).emit("messageRequest", { data: data });
      }
    } else {
      console.log("Users follow each other in message.");

      if (chatTopic && parseData?.messageType == 1) {
        const chat = new Chat();

        chat.senderUserId = parseData?.senderUserId;
        chat.messageType = 1;
        chat.message = parseData?.message;
        chat.image = "";
        chat.chatTopicId = chatTopic._id;
        chat.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        chatTopic.chatId = chat._id;
        chatTopic.isAccepted = true;

        await Promise.all([chat.save(), chatTopic.save()]);

        io.in("globalRoom:" + chatTopic?.senderUserId?._id.toString()).emit("message", { data: data, messageId: chat._id });
        io.in("globalRoom:" + chatTopic?.receiverUserId?._id.toString()).emit("message", { data: data, messageId: chat._id });

        let receiverUser, senderUser;
        if (chatTopic.senderUserId._id.toString() === parseData.senderUserId.toString()) {
          senderUser = chatTopic.senderUserId;
          receiverUser = chatTopic.receiverUserId;
        } else if (chatTopic.receiverUserId._id) {
          senderUser = chatTopic.receiverUserId;
          receiverUser = chatTopic.senderUserId;
        }

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
      } else {
        console.log("other messageType");

        io.in("globalRoom:" + chatTopic?.senderUserId?._id.toString()).emit("message", { data: data });
        io.in("globalRoom:" + chatTopic?.receiverUserId?._id.toString()).emit("message", { data: data });
      }
    }
  });

  socket.on("messageRead", async (data) => {
    try {
      console.log("Data in messageRead event:", data);

      const parsedData = JSON.parse(data);
      console.log("Data in messageRead event:", parsedData.messageId);

      const updated = await Chat.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(parsedData.messageId) }, { $set: { isRead: true } }, { new: true });

      if (!updated) {
        console.log(`No message found with ID ${parsedData.messageId}`);
      } else {
        console.log(`Updated isRead to true for message with ID: ${updated._id}`);
      }
    } catch (error) {
      console.error("Error updating messages:", error);
    }
  });

  socket.on("messageRequestRead", async (data) => {
    try {
      console.log("Data in messageRequestRead event:", data);

      const parsedData = JSON.parse(data);
      console.log("Data in messageRequestRead event:", parsedData.messageId);

      const updated = await ChatRequest.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(parsedData.messageId) }, { $set: { isRead: true } }, { new: true });

      if (!updated) {
        console.log(`No message found with ID ${parsedData.messageId}`);
      } else {
        console.log(`Updated isRead to true for message with ID: ${updated._id}`);
      }
    } catch (error) {
      console.error("Error updating messages:", error);
    }
  });

  //live-streaming
  socket.on("liveRoomConnect", async (data) => {
    console.log("liveRoomConnect  connected:   ");

    const parsedData = JSON.parse(data);
    console.log("liveRoomConnect connected (parsed):   ", parsedData);

    const sockets = await io.in(globalRoom).fetchSockets();
    sockets?.length ? sockets[0].join(parsedData.liveHistoryId) : console.log("sockets not able to emit");

    io.in(parsedData.liveHistoryId).emit("liveRoomConnect", data);
  });

  socket.on("getLiveHostInfo", async (payload) => {
    try {
      const parsedPayload = JSON.parse(payload);
      const { liveUserObjId, userId } = parsedPayload;

      if (!liveUserObjId) {
        return socket.emit("singleLiveUserResponse", "Missing liveHistoryId or liveUserObjId");
      }

      const objId = new mongoose.Types.ObjectId(liveUserObjId);

      const pipeline = [
        {
          $match: {
            _id: objId,
          },
        },
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "userId",
        //     foreignField: "_id",
        //     as: "user",
        //   },
        // },
        // { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
        // { $match: { "user.isBlock": false } },
        {
          $lookup: {
            from: "followerfollowings",
            let: { liveUserId: "$userId", requestingUserId: userId },
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
          $lookup: {
            from: "followerfollowings",
            let: { host2Id: "$pkConfig.host2Id", requestingUserId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$toUserId", "$$host2Id"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                  },
                },
              },
            ],
            as: "host2IsFollow",
          },
        },
        {
          $project: {
            _id: 1,
            liveHistoryId: 1,
            view: 1,
            isPkMode: 1,
            userId: 1,
            name: 1,
            userName: 1,
            image: 1,
            countryFlagImage: 1,
            isProfileImageBanned: 1,
            isVerified: 1,
            isFake: 1,
            view: 1,
            host1Channel: "$pkConfig.host1Channel",
            host1Coin: "$pkConfig.host1Details.coin",
            host2Id: "$pkConfig.host2Id",
            host2UniqueId: "$pkConfig.host2UniqueId",
            host2Name: "$pkConfig.host2Name",
            host2userName: "$pkConfig.host2Details.userName",
            host2Image: "$pkConfig.host2Image",
            host2isProfileImageBanned: "$pkConfig.host2Details.isProfileImageBanned",
            host2Coin: "$pkConfig.host2Details.coin",
            host2Channel: "$pkConfig.host2Channel",
            host2LiveId: "$pkConfig.host2LiveId",
            host2ObjId: "$pkConfig.host2ObjId",
            localRank: "$pkConfig.localRank",
            remoteRank: "$pkConfig.remoteRank",
            host2IsFollow: { $gt: [{ $size: "$host2IsFollow" }, 0] },
            isFollow: { $gt: [{ $size: "$isFollow" }, 0] },

            videoImage: { $ifNull: ["$videoImage", ""] },
            videoUrl: { $ifNull: ["$videoUrl", ""] },
            pkPreviewImages: { $ifNull: ["$pkPreviewImages", []] },
            pkMediaSources: { $ifNull: ["$pkMediaSources", []] },
          },
        },
      ];

      const [liveUserInfo] = await LiveUser.aggregate(pipeline);

      if (!liveUserInfo) {
        return socket.emit("getLiveHostInfo", "Live user not found.");
      }

      socket.emit("getLiveHostInfo", liveUserInfo);
    } catch (err) {
      console.error("Error in getLiveHostInfo:", err);
    }
  });

  socket.on("addView", async (data) => {
    console.log("data in addView:  ", data);

    const dataOfaddView = JSON.parse(data);
    console.log("parsed data in addView:  ", dataOfaddView);

    const [sockets, user, liveUser, pkLiveUser, existLiveView] = await Promise.all([
      io.in(globalRoom).fetchSockets(),
      User.findById(dataOfaddView.userId),
      LiveUser.findOne({ liveHistoryId: dataOfaddView.liveHistoryId }),
      LiveUser.findOne({ isPkMode: true, liveHistoryId: dataOfaddView.liveHistoryId }).select("pkEndTime pkConfig.host1LiveId pkConfig.host2LiveId").lean(),
      LiveView.findOne({
        userId: dataOfaddView.userId,
        liveHistoryId: dataOfaddView.liveHistoryId,
      }),
    ]);

    sockets?.length ? sockets[0].join(dataOfaddView.liveHistoryId) : console.log("sockets not able to emit");

    //If PK mode active
    if (pkLiveUser) {
      const duration = pkLiveUser.pkEndTime ? Math.round((new Date(pkLiveUser?.pkEndTime).getTime() - new Date().getTime()) / 1000) : 0;

      const [rankedLiveUser, topGifterHost1, topGifterHost2] = await Promise.all([
        LiveUser.aggregate([{ $match: { _id: pkLiveUser._id } }, { $addFields: { duration } }]),
        TopGifter.findOne({ liveHistoryId: dataOfaddView.liveHistoryId }).select("gifters").populate("gifters.userId", "name image isProfilePicBanned").limit(5).lean(),
        TopGifter.findOne({ liveHistoryId: pkLiveUser.pkConfig.host2LiveId }).select("gifters").populate("gifters.userId", "name image isProfilePicBanned").limit(5).lean(),
      ]);

      if (rankedLiveUser.length > 0) {
        io.in(dataOfaddView.liveHistoryId).emit("refreshPkRankings", rankedLiveUser[0]);
      }

      const topGiftersHost1 = topGifterHost1?.gifters?.sort((a, b) => b.totalCoins - a.totalCoins)?.slice(0, 5) || [];
      const topGiftersHost2 = topGifterHost2?.gifters?.sort((a, b) => b.totalCoins - a.totalCoins)?.slice(0, 5) || [];

      const eventData = {
        topGiftersHost1,
        topGiftersHost2,
      };

      io.in(dataOfaddView.liveHistoryId).emit("updateTopGiftContributors", eventData);
    }

    if (user && liveUser) {
      if (!existLiveView) {
        console.log("new liveView in addView ");

        const liveView = new LiveView();
        liveView.userId = dataOfaddView.userId;
        liveView.liveHistoryId = dataOfaddView.liveHistoryId;
        liveView.name = user.name;
        liveView.userName = user.userName;
        liveView.image = user.image;
        await liveView.save();
      }
    }

    const view = await LiveView.find({ liveHistoryId: dataOfaddView.liveHistoryId });

    io.in(dataOfaddView.liveHistoryId).emit("addView", view.length);

    await Promise.all([
      LiveUser.updateOne(
        { _id: liveUser?._id },
        {
          $set: { view: view.length },
        }
      ),
      LiveHistory.updateOne(
        { _id: dataOfaddView.liveHistoryId },
        {
          $set: { totalUser: view.length },
        }
      ),
    ]);

    const socket = await io.in(dataOfaddView.liveHistoryId).fetchSockets();
    console.log("liveHistoryId sockets in addView:  ", socket?.length);
  });

  socket.on("lessView", async (data) => {
    console.log("data in lessView:  ", data);

    const dataOflessView = JSON.parse(data);
    console.log("parsed data in lessView:  ", dataOflessView);

    const [sockets, liveUser, existLiveView] = await Promise.all([
      io.in(globalRoom).fetchSockets(),
      LiveUser.findOne({ liveHistoryId: dataOflessView.liveHistoryId }),
      LiveView.findOne({
        userId: dataOflessView.userId,
        liveHistoryId: dataOflessView.liveHistoryId,
      }),
    ]);

    sockets?.length ? sockets[0].leave(dataOflessView.liveHistoryId) : console.log("sockets not able to leave in lessView");
    console.log("sockets in lessView:  ", sockets?.length);

    const socket = await io.in(dataOflessView.liveHistoryId).fetchSockets();
    console.log("liveHistoryId sockets in lessView:  ", socket?.length);

    if (existLiveView) {
      console.log("existLiveView deleted in lessView for that liveHistoryId");
      await existLiveView.deleteOne();
    }

    const liveView = await LiveView.find({ liveHistoryId: dataOflessView.liveHistoryId });
    console.log("liveView in lessView:  ", liveView.length);

    if (liveUser) {
      liveUser.view = liveView.length;
      await liveUser.save();
    }

    if (liveView.length === 0) {
      return io.in(dataOflessView.liveHistoryId).emit("lessView", liveView.length);
    }

    io.in(dataOflessView?.liveHistoryId).emit("lessView", liveView.length);
  });

  socket.on("liveChat", async (data) => {
    const dataOfComment = JSON.parse(data);
    console.log("parsed data in liveChat: ", dataOfComment);

    const sockets = await io.in(globalRoom).fetchSockets();
    sockets?.length ? sockets[0].join(dataOfComment.liveHistoryId) : console.log("sockets not able to emit liveChat");

    io.in(dataOfComment?.liveHistoryId).emit("liveChat", data);

    const liveHistory = await LiveHistory.findById(dataOfComment.liveHistoryId);
    if (liveHistory) {
      liveHistory.totalLiveChat += 1;
      await liveHistory.save();
    }
  });

  socket.on("gift", async (data) => {
    const giftData = JSON.parse(data);
    console.log("data in gift ===================", giftData);

    try {
      const uniqueId = generateHistoryUniqueId();

      const [senderUser, receiverUser] = await Promise.all([User.findById(giftData.senderUserId), User.findById(giftData.receiverUserId)]);

      if (!senderUser) {
        console.log("Sender user not found");
        io.in("globalRoom:" + giftData.senderUserId).emit("gift", "Sender user not found");
        return;
      }

      if (!receiverUser) {
        console.log("Receiver user not found");
        io.in("globalRoom:" + giftData.receiverUserId).emit("gift", "Receiver user not found");
        return;
      }

      //const totalCoin = giftData.giftCount * giftData.coin;
      const coin = Math.abs(giftData.coin);

      if (senderUser.coin < coin) {
        console.log("senderUser does not have sufficient coin ");
        io.in("globalRoom:" + giftData.senderUserId).emit("gift", "you don't have sufficient coin");
        return;
      }

      const [updatedSenderUser, updatedReceiverUser] = await Promise.all([
        User.findOneAndUpdate({ _id: senderUser._id }, { $inc: { coin: -coin } }, { new: true }),
        User.findOneAndUpdate(
          { _id: receiverUser._id },
          {
            $inc: {
              coin: coin,
              receivedCoin: coin,
              receivedGift: 1,
            },
          },
          { new: true }
        ),
      ]);

      const sockets = await io.in(globalRoom).fetchSockets();
      sockets?.length ? sockets[0].join(giftData.liveHistoryId) : console.log("sockets not able to emit gift");

      const eventData = {
        giftData: giftData,
        senderUser: updatedSenderUser,
        receiverUser: updatedReceiverUser,
      };

      io.in(giftData.liveHistoryId).emit("gift", eventData);

      await Promise.all([
        History.create({
          userId: senderUser._id,
          otherUserId: receiverUser._id, // Assuming you want this to always be receiverUser._id (liveUser always be receiver)
          coin: coin,
          uniqueId: uniqueId,
          type: 1,
          giftId: giftData.giftId,
          videoId: null,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
        LiveHistory.updateOne(
          { _id: giftData.liveHistoryId },
          {
            $inc: {
              totalGift: 1,
              totalCoinsEarned: coin,
            },
          }
        ),
      ]);

      const socket = await io.in(giftData.liveHistoryId).fetchSockets();
      console.log("liveHistoryId socket in gift:  ", socket.length);
    } catch (error) {
      console.error("Error in normalUserGift:", error);
    }
  });

  socket.on("followCountUpdated", async (data) => {
    try {
      const { liveHistoryId, incrementBy = 1 } = JSON.parse(data);
      console.log("[followCountUpdated] Data received:", { liveHistoryId, incrementBy });

      const [liveHistory] = await Promise.all([LiveHistory.findById(liveHistoryId).select("_id").lean()]);

      if (!liveHistory) {
        console.log("[followCountUpdated] No LiveStreamerHistory found for ID:", liveHistoryId);
        return;
      }

      if (!socket.rooms.has(liveHistoryId)) {
        socket.join(liveHistoryId);
        console.log(`[followCountUpdated] Joined room: ${liveHistoryId}`);
      } else {
        console.log(`[followCountUpdated] Already in room: ${liveHistoryId}`);
      }

      await LiveHistory.updateOne({ _id: liveHistory._id }, { $inc: { liveFollowCount: incrementBy } });
    } catch (error) {
      console.error("[followCountUpdated] Error:", error);
    }
  });

  //pk
  socket.on("initiatePkRequest", async (data) => {
    const parseData = JSON.parse(data);
    console.log("data in initiatePkRequest ..................................", parseData);

    try {
      if (parseData.InstantCutRequestByHost) {
        console.log("Instant Cut Request By Host", parseData?.InstantCutRequestByHost);

        io.in("globalRoom:" + parseData?.host2Id).emit("pkInviteIncoming", data);
      } else {
        console.log("Request accept by Host");

        io.in("globalRoom:" + parseData?.host2Id.toString()).emit("pkInviteIncoming", data);
      }
    } catch (error) {
      console.error("Error creating PK request:", error);
    }
  });

  socket.on("pkRequestResponse", async (data) => {
    const parseData = JSON.parse(data);
    console.log("data in pkRequestResponse ..................................", parseData);

    const [user1, user2] = await Promise.all([User.findById(parseData.HOST_1_ID), User.findById(parseData.HOST_2_ID)]);

    if (!user1) {
      io.in("globalRoom:" + parseData.host1Id).emit("pkAnswer", "Host 1 is Not Found");
    }

    if (!user2) {
      io.in("globalRoom:" + parseData.host2Id).emit("pkAnswer", "Host 2 is Not Found");
    }

    if (parseData.isAccept) {
      console.log("Pk isAccept: ", parseData.isAccept);

      const pkId = Math.floor(Math.random() * 10000000) + 99999999;

      Date.prototype.addMinutes = function (h) {
        this.setTime(this.getTime() + h * 1000);
        return this;
      };

      let pkTime = settingJSON.pkEndTime ? settingJSON.pkEndTime : 20;
      const endTime = new Date().addMinutes(pkTime);

      var duration = Math.round((endTime - new Date().getTime()) / 1000);
      if (duration < 0) duration = 0;

      const [liveUser1, liveUser2] = await Promise.all([
        LiveUser.findOneAndUpdate(
          {
            userId: parseData?.HOST_1_ID,
          },
          {
            $set: {
              isPkMode: true,
              pkEndTime: endTime,
              pkId: pkId,
              "pkConfig.host1Id": parseData?.HOST_1_ID,
              "pkConfig.host2Id": parseData?.HOST_2_ID,
              "pkConfig.host1Image": parseData?.HOST_1_IMAGE,
              "pkConfig.host2Image": parseData?.HOST_2_IMAGE,
              "pkConfig.host1Name": parseData?.HOST_1_NAME,
              "pkConfig.host2Name": parseData?.HOST_2_NAME,
              "pkConfig.host1UniqueId": parseData?.HOST_1_UNIQUEID,
              "pkConfig.host2UniqueId": parseData?.HOST_2_UNIQUEID,
              "pkConfig.host1Channel": parseData?.HOST_1_CHANNEL,
              "pkConfig.host2Channel": parseData?.HOST_2_CHANNEL,
              "pkConfig.host1LiveId": parseData?.HOST_1_LIVEID,
              "pkConfig.host2LiveId": parseData?.HOST_2_LIVEID,
              "pkConfig.host2ObjId": parseData?.HOST_2_LIVE_OBJ_ID,

              "pkConfig.host1Details.userId": user1?._id,
              "pkConfig.host1Details.name": user1?.name,
              "pkConfig.host1Details.userName": user1?.userName,
              "pkConfig.host1Details.coin": user1?.coin,
              "pkConfig.host1Details.image": user1?.image,
              "pkConfig.host1Details.countryFlagImage": user1?.countryFlagImage,
              "pkConfig.host1Details.country": user1?.country,
              "pkConfig.host1Details.uniqueId": user1?.uniqueId,
              "pkConfig.host1Details.isProfileImageBanned": user1?.isProfileImageBanned,

              "pkConfig.host2Details.userId": user2?._id,
              "pkConfig.host2Details.name": user2?.name,
              "pkConfig.host2Details.coin": user2?.coin,
              "pkConfig.host2Details.image": user2?.image,
              "pkConfig.host2Details.countryFlagImage": user2?.countryFlagImage,
              "pkConfig.host2Details.country": user2?.country,
              "pkConfig.host2Details.uniqueId": user2?.uniqueId,
              "pkConfig.host2Details.isProfileImageBanned": user2?.isProfileImageBanned,
            },
          },
          { new: true }
        ),
        LiveUser.findOneAndUpdate(
          {
            userId: parseData?.HOST_2_ID,
          },
          {
            $set: {
              isPkMode: true,
              pkEndTime: endTime,
              pkId: pkId,
              "pkConfig.host1Id": parseData?.HOST_2_ID,
              "pkConfig.host2Id": parseData?.HOST_1_ID,
              "pkConfig.host1Image": parseData?.HOST_2_IMAGE,
              "pkConfig.host2Image": parseData?.HOST_1_IMAGE,
              "pkConfig.host1Name": parseData?.HOST_2_NAME,
              "pkConfig.host2Name": parseData?.HOST_1_NAME,
              "pkConfig.host1UniqueId": parseData?.HOST_1_UNIQUEID,
              "pkConfig.host2UniqueId": parseData?.HOST_2_UNIQUEID,
              "pkConfig.host1Channel": parseData?.HOST_2_CHANNEL,
              "pkConfig.host2Channel": parseData?.HOST_1_CHANNEL,
              "pkConfig.host1LiveId": parseData?.HOST_2_LIVEID,
              "pkConfig.host2ObjId": parseData?.HOST_1_LIVE_OBJ_ID,
              "pkConfig.host2LiveId": parseData?.HOST_1_LIVEID,

              "pkConfig.host1Details.userId": user2?._id,
              "pkConfig.host1Details.name": user2?.name,
              "pkConfig.host1Details.userName": user2?.userName,
              "pkConfig.host1Details.coin": user2?.coin,
              "pkConfig.host1Details.image": user2?.image,
              "pkConfig.host1Details.countryFlagImage": user2?.countryFlagImage,
              "pkConfig.host1Details.country": user2?.country,
              "pkConfig.host1Details.uniqueId": user2?.uniqueId,
              "pkConfig.host1Details.isProfileImageBanned": user2?.isProfileImageBanned,

              "pkConfig.host2Details.userId": user1?._id,
              "pkConfig.host2Details.name": user1?.name,
              "pkConfig.host2Details.coin": user1?.coin,
              "pkConfig.host2Details.image": user1?.image,
              "pkConfig.host2Details.countryFlagImage": user1?.countryFlagImage,
              "pkConfig.host2Details.country": user1?.country,
              "pkConfig.host2Details.uniqueId": user1?.uniqueId,
              "pkConfig.host2Details.isProfileImageBanned": user1?.isProfileImageBanned,
            },
          },
          { new: true }
        ),
      ]);

      const [responseForUser1, responseForUser2] = await Promise.all([
        LiveUser.aggregate([
          {
            $match: { _id: { $eq: liveUser2?._id } },
          },
          { $addFields: { duration: duration } },
          {
            $project: {
              _id: 1,
              userId: 1,
              name: 1,
              userName: 1,
              image: 1,
              token: 1,
              channel: 1,
              coin: 1,
              duration: 1,
              isPkMode: 1,
              pkConfig: 1,
              liveHistoryId: 1,
              view: 1,
            },
          },
        ]),
        LiveUser.aggregate([
          {
            $match: { _id: { $eq: liveUser1?._id } },
          },
          { $addFields: { duration: duration } },
          {
            $project: {
              _id: 1,
              userId: 1,
              name: 1,
              userName: 1,
              image: 1,
              token: 1,
              channel: 1,
              coin: 1,
              duration: 1,
              isPkMode: 1,
              pkConfig: 1,
              liveHistoryId: 1,
              view: 1,
            },
          },
        ]),
      ]);

      const event1Data = {
        data: data,
        response: responseForUser2[0],
      };

      const event2Data = {
        data: data,
        response: responseForUser1[0],
      };

      io.in(parseData?.HOST_1_LIVEID).emit("pkRequestResponse", event1Data);
      io.in(parseData?.HOST_2_LIVEID).emit("pkRequestResponse", event2Data);

      // const pkHostsInfo = await LiveUser.find({
      //   isPkMode: true,
      //   liveHistoryId: parseData?.HOST_1_LIVEID,
      // })
      //   .select("pkConfig.host1Id pkConfig.host2Id pkConfig.host1Name pkConfig.host1Image pkConfig.host2Name pkConfig.host2Image")
      //   .lean();

      // if (pkHostsInfo) {
      //   io.in(parseData?.HOST_1_LIVEID).emit("pkHostsInfo", pkHostsInfo[0]?.pkConfig);
      //   io.in(parseData?.HOST_2_LIVEID).emit("pkHostsInfo", pkHostsInfo[0]?.pkConfig);
      // }
    } else {
      console.log("Pk isAccept: ", parseData.isAccept);

      const host1LiveId = await LiveHistory.findById(parseData.HOST_1_LIVEID);
      if (host1LiveId) {
        const event1Data = {
          data: data,
          response: {},
        };

        io.in(parseData.HOST_1_LIVEID).emit("pkRequestResponse", event1Data);
        io.in(parseData.HOST_2_LIVEID).emit("pkRequestResponse", event1Data);
      }
    }
  });

  socket.on("submitPkBattleGift", async (data) => {
    const giftData = JSON.parse(data);
    console.log("Received submitPkBattleGift data:", giftData);

    const [gift, senderUser] = await Promise.all([Gift.findById(giftData.giftId), User.findById(giftData.senderUserId)]);

    if (!gift) {
      console.log("Gift not found");
      io.in("globalRoom:" + giftData.senderUserId).emit("submitPkBattleGift", "Gift not found!");
      return;
    }

    if (!senderUser) {
      console.log("Sender user not found");
      io.in("globalRoom:" + giftData.senderUserId).emit("submitPkBattleGift", "Sender user not found!");
      return;
    }

    const receiverUsers = Array.isArray(giftData?.receiverUserId) ? giftData.receiverUserId.map((id) => id.trim()) : [];
    if (receiverUsers.length === 0) {
      console.log("No receiver users provided");
      io.in("globalRoom:" + giftData.senderUserId).emit("submitPkBattleGift", "No receiver user provided!");
      return;
    }

    const missingReceivers = [];
    for (const receiverId of receiverUsers) {
      const receiverUser = await User.findById(receiverId).select("_id").lean();
      if (!receiverUser) {
        missingReceivers.push(receiverId);
      }
    }

    if (missingReceivers.length > 0) {
      const message = `Receiver user(s) not found: ${missingReceivers.join(", ")}`;
      console.log(message);
      io.in("globalRoom:" + giftData.senderUserId).emit("submitPkBattleGift", message);
      return;
    }

    const coin = Math.abs(gift.coin);
    const totalCoinCost = coin * receiverUsers.length;

    if (senderUser.coin < totalCoinCost) {
      console.log("Sender user doesn't have enough coins");
      io.in("globalRoom:" + giftData.senderUserId).emit("submitPkBattleGift", "You don't have sufficient coins!");
      return;
    }

    const receiverPkLiveUser = await LiveUser.findOne({
      userId: receiverUsers[0],
      isPkMode: true,
    });

    if (!receiverPkLiveUser || !receiverPkLiveUser.isPkMode) {
      console.log("PK Mode not active for receiver");
      io.in("globalRoom:" + giftData.senderUserId).emit("submitPkBattleGift", "Something went wrong, PK not active!");
      return;
    }

    const [liveUser1, liveUser2] = await Promise.all([
      LiveUser.findOne({ userId: receiverPkLiveUser.pkConfig.host1Id, isPkMode: true }),
      LiveUser.findOne({ userId: receiverPkLiveUser.pkConfig.host2Id, isPkMode: true }),
    ]);

    if (!liveUser1 || !liveUser2) {
      console.log("Hosts not found for PK");
      io.in("globalRoom:" + giftData.senderUserId).emit("submitPkBattleGift", "Something went wrong, Hosts not found for PK!");
      return;
    }

    if (liveUser1) {
      await liveUser1.updateOne({
        $inc: {
          "pkConfig.localRank": coin,
          "pkConfig.host1Details.coin": coin,
        },
      });
    }

    if (liveUser2) {
      await liveUser2.updateOne({
        $inc: {
          "pkConfig.remoteRank": coin,
          "pkConfig.host2Details.coin": coin,
        },
      });
    }

    for (let receiverUserId of receiverUsers) {
      receiverUserId = receiverUserId.trim();

      const [uniqueId, receiverUser, receiverLiveUser] = await Promise.all([
        generateHistoryUniqueId(),
        User.findById(receiverUserId).select("_id").lean(),
        LiveUser.findOne({
          userId: receiverUserId,
          isPkMode: true,
        }),
      ]);

      if (!receiverUser) {
        console.log("Receiver user not found:", receiverUserId);
        continue;
      }

      if (!receiverLiveUser) {
        console.log("Receiver LiveUser not found for:", receiverUserId);
        continue;
      }

      const topGifter = await TopGifter.findOneAndUpdate(
        { liveHistoryId: receiverLiveUser.liveHistoryId, "gifters.userId": senderUser._id },
        { $inc: { "gifters.$.totalCoins": coin } },
        { new: true }
      );

      if (!topGifter) {
        await TopGifter.findOneAndUpdate(
          { liveHistoryId: receiverLiveUser.liveHistoryId },
          {
            $push: {
              gifters: { userId: senderUser._id, totalCoins: coin },
            },
          },
          { upsert: true, new: true }
        );
      }

      const updatedTopGifterData = await TopGifter.findOne({ liveHistoryId: receiverLiveUser.liveHistoryId }).select("gifters").populate("gifters.userId", "name image isProfilePicBanned").lean();
      const sortedTopGifters = updatedTopGifterData?.gifters?.sort((a, b) => b.totalCoins - a.totalCoins)?.slice(0, 5) || [];

      const topGifterEvent = {
        liveHistoryId: receiverLiveUser.liveHistoryId.toString(),
        topGifters: sortedTopGifters,
      };

      if (liveUser1?.pkConfig?.host1LiveId) {
        io.in(liveUser1.pkConfig.host1LiveId).emit("updateTopGiftContributors", topGifterEvent);
      }

      if (liveUser2?.pkConfig?.host1LiveId) {
        io.in(liveUser2.pkConfig.host1LiveId).emit("updateTopGiftContributors", topGifterEvent);
      }

      await Promise.all([
        User.updateOne(
          { _id: receiverUser._id },
          {
            $inc: {
              coin: coin,
              receivedCoin: coin,
              receivedGift: 1,
            },
          }
        ),
        History.create({
          userId: senderUser._id,
          otherUserId: receiverUser._id,
          coin: coin,
          uniqueId: uniqueId,
          type: 1,
          giftId: giftData.giftId,
          videoId: null,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
      ]);
    }

    var duration = Math.round((new Date(liveUser1?.pkEndTime).getTime() - new Date().getTime()) / 1000);
    if (duration < 0) duration = 0;

    const [host1Response, host2Response] = await Promise.all([
      LiveUser.aggregate([
        { $match: { _id: liveUser1._id } },
        { $addFields: { duration } },
        {
          $project: {
            userId: 1,
            name: 1,
            userName: 1,
            image: 1,
            token: 1,
            channel: 1,
            coin: 1,
            duration: 1,
            isPkMode: 1,
            pkConfig: 1,
            liveHistoryId: 1,
            view: 1,
          },
        },
      ]),
      LiveUser.aggregate([
        { $match: { _id: liveUser2._id } },
        { $addFields: { duration } },
        {
          $project: {
            userId: 1,
            name: 1,
            userName: 1,
            image: 1,
            token: 1,
            channel: 1,
            coin: 1,
            duration: 1,
            isPkMode: 1,
            pkConfig: 1,
            liveHistoryId: 1,
            view: 1,
          },
        },
      ]),
    ]);

    if (liveUser1?.pkConfig?.host1LiveId) {
      io.in(liveUser1.pkConfig.host1LiveId).emit("submitPkBattleGift", {
        giftData,
        response: host2Response[0],
      });
    }

    if (liveUser2?.pkConfig?.host1LiveId) {
      io.in(liveUser2.pkConfig.host1LiveId).emit("submitPkBattleGift", {
        giftData,
        response: host1Response[0],
      });
    }

    await Promise.all([
      User.updateOne({ _id: senderUser._id }, { $inc: { coin: -totalCoinCost } }),
      LiveHistory.updateOne(
        { _id: giftData.liveHistoryId },
        {
          $inc: {
            totalGift: 1,
            totalCoinsEarned: totalCoinCost,
          },
        }
      ),
    ]);
  });

  socket.on("terminatePkBattle", async (data) => {
    const parsedData = JSON.parse(data);
    console.log("parsedData in terminatePkBattle: ", parsedData);

    try {
      const [user, liveUser, liveHistory] = await Promise.all([
        User.findOne({
          _id: parsedData?.userId,
          liveHistoryId: parsedData?.liveHistoryId,
        }),
        LiveUser.findOne({
          isPkMode: true,
          userId: parsedData?.userId,
          liveHistoryId: parsedData?.liveHistoryId,
        }),
        LiveHistory.findById(parsedData?.liveHistoryId),
      ]);

      if (!user) {
        console.error("User not found.");
        return;
      }

      if (!liveUser) {
        console.warn(`No LiveUser found with userId: ${parsedData?.userId} and liveHistoryId: ${parsedData?.liveHistoryId}`);
        return;
      }

      if (user) {
        if (liveUser && liveUser.isPkMode) {
          console.log("When PK started and it's end: ", liveUser.isPkMode);

          const abc = io.sockets.adapter.rooms.get(liveUser.pkConfig.host1LiveId);
          console.log("ROOM host1LiveId ======", liveUser.pkConfig.host1LiveId, abc);

          const xyz = io.sockets.adapter.rooms.get(liveUser.pkConfig.host2LiveId);
          console.log("ROOM host2LiveId ======", liveUser.pkConfig.host2LiveId, xyz);

          var duration = Math.round((new Date(liveUser.pkEndTime).getTime() - new Date().getTime()) / 1000);
          if (duration < 0) {
            duration = 0;
          }

          let winnerHost1 = 0;
          let winnerHost2 = 0;

          if (liveUser.pkConfig.localRank > liveUser.pkConfig.remoteRank) {
            winnerHost1 = 2;
            winnerHost2 = 1;
          } else if (liveUser.pkConfig.localRank < liveUser.pkConfig.remoteRank) {
            winnerHost1 = 1;
            winnerHost2 = 2;
          }

          await Promise.all([
            LiveUser.findOneAndUpdate({ _id: liveUser._id }, { "pkConfig.isWinner": winnerHost1 }, { new: true, lean: true }),
            LiveUser.findOneAndUpdate({ userId: liveUser.pkConfig.host2Id }, { "pkConfig.isWinner": winnerHost2 }, { new: true, lean: true }),
          ]);

          const [responseForUser1, responseForUser2] = await Promise.all([
            LiveUser.aggregate([
              {
                $match: {
                  userId: {
                    $eq: new mongoose.Types.ObjectId(liveUser.pkConfig.host2Id),
                  },
                },
              },
              { $addFields: { duration: duration } },
              {
                $project: {
                  _id: 1,
                  userId: 1,
                  name: 1,
                  userName: 1,
                  image: 1,
                  token: 1,
                  channel: 1,
                  coin: 1,
                  duration: 1,
                  isPkMode: 1,
                  totalPkRounds: 1,
                  pkConfig: 1,
                  liveHistoryId: 1,
                  view: 1,
                },
              },
            ]),
            LiveUser.aggregate([
              {
                $match: {
                  userId: {
                    $eq: new mongoose.Types.ObjectId(liveUser.pkConfig.host1Id),
                  },
                }, //same as liveUser._id
              },
              { $addFields: { duration: duration } },
              {
                $project: {
                  _id: 1,
                  userId: 1,
                  name: 1,
                  userName: 1,
                  image: 1,
                  token: 1,
                  channel: 1,
                  coin: 1,
                  duration: 1,
                  isPkMode: 1,
                  totalPkRounds: 1,
                  pkConfig: 1,
                  liveHistoryId: 1,
                  view: 1,
                },
              },
            ]),
          ]);

          io.in(liveUser.pkConfig.host1LiveId).emit("terminatePkBattle", {
            isManualMode: parsedData?.isManualMode,
            pkEndUserId: parsedData?.pkEndUserId,
            data: responseForUser2[0],
            winner: responseForUser2[0]?.pkConfig.isWinner == 2 ? responseForUser2[0]?.pkConfig.host1Details : responseForUser2[0]?.pkConfig.host2Details,
          });

          io.in(liveUser.pkConfig.host2LiveId).emit("terminatePkBattle", {
            isManualMode: parsedData?.isManualMode,
            pkEndUserId: parsedData?.pkEndUserId,
            data: responseForUser1[0],
            winner: responseForUser1[0]?.pkConfig.isWinner == 2 ? responseForUser1[0]?.pkConfig.host1Details : responseForUser1[0]?.pkConfig.host2Details,
          });

          if (parsedData.isManualMode === true) {
            console.log("isManualMode listen in terminatePkBattle:   ", parsedData.isManualMode);

            if (liveHistory) {
              const endTime = moment().tz("Asia/Kolkata").format();
              const start = moment.tz(liveHistory.startTime, "Asia/Kolkata");
              const end = moment.tz(endTime, "Asia/Kolkata");
              const duration = moment.utc(end.diff(start)).format("HH:mm:ss");

              liveHistory.endTime = endTime;
              liveHistory.duration = duration;
              await liveHistory?.save();
            }

            if (user.isLive) {
              console.log("liveUser and related liveView deleted in pkEnd");

              await Promise.all([
                User.findOneAndUpdate(
                  { _id: user._id },
                  {
                    $set: { isLive: false, isBusy: false, liveHistoryId: null },
                  },
                  { new: true }
                ),
                LiveUser.deleteOne({
                  isPkMode: true,
                  userId: user._id,
                  liveHistoryId: liveHistory._id,
                }),
                LiveView.deleteMany({ liveHistoryId: liveHistory._id }),
              ]);
            }

            const sockets = await io.in(parsedData?.liveHistoryId).fetchSockets();
            sockets?.length ? io.socketsLeave(parsedData?.liveHistoryId) : console.log("sockets not able to leave in terminatePkBattle");
          }

          await Promise.all([
            LiveUser.updateMany(
              { pkId: liveUser.pkId },
              {
                $set: {
                  isPkMode: false,
                  isPkRound: false,
                  pkId: null,
                  pkEndTime: null,
                  "pkConfig.host1Id": null,
                  "pkConfig.host2Id": null,
                  "pkConfig.host1Token": null,
                  "pkConfig.host2Token": null,
                  "pkConfig.host1Channel": null,
                  "pkConfig.host2Channel": null,

                  "pkConfig.host1UniqueId": null,
                  "pkConfig.host2UniqueId": null,
                  "pkConfig.host1Name": null,
                  "pkConfig.host2Name": null,
                  "pkConfig.host1Image": null,
                  "pkConfig.host2Image": null,
                  "pkConfig.host1LiveId": null,
                  "pkConfig.host2LiveId": null,
                  "pkConfig.host1AgoraUID": 0,
                  "pkConfig.host2AgoraUID": 0,

                  "pkConfig.localRank": 0,
                  "pkConfig.remoteRank": 0,
                  "pkConfig.isWinner": 0,

                  "pkConfig.host1Details.name": null,
                  "pkConfig.host1Details.coin": 0,
                  "pkConfig.host1Details.image": null,
                  "pkConfig.host1Details.countryFlagImage": null,
                  "pkConfig.host1Details.country": null,
                  "pkConfig.host1Details.uniqueId": null,

                  "pkConfig.host2Details.name": null,
                  "pkConfig.host2Details.coin": 0,
                  "pkConfig.host2Details.image": null,
                  "pkConfig.host2Details.countryFlagImage": null,
                  "pkConfig.host2Details.country": null,
                  "pkConfig.host2Details.uniqueId": null,
                },
              },
              { new: true }
            ),
            TopGifter.deleteMany({
              liveHistoryId: liveUser.pkConfig.host1LiveId,
            }),
            TopGifter.deleteMany({
              liveHistoryId: liveUser.pkConfig.host2LiveId,
            }),
          ]);
        } else {
          console.log("When PK is not started in terminatePkBattle event");

          io.in(parsedData?.liveHistoryId).emit("terminatePkBattle", data);
        }
      }
    } catch (error) {
      console.error("Error in pkEnd:", error);
    }
  });

  socket.on("endLive", async (data) => {
    console.log("data in endLive: ", data);

    const parsedData = JSON.parse(data);
    console.log("parsedData in endLive: ", parsedData);

    io.in(parsedData?.liveHistoryId).emit("endLive", data);

    try {
      const [user, liveHistory] = await Promise.all([User.findOne({ liveHistoryId: parsedData?.liveHistoryId }), LiveHistory.findById(parsedData?.liveHistoryId)]);

      if (user) {
        if (user.isLive) {
          const endTime = moment().tz("Asia/Kolkata").format();
          const start = moment.tz(liveHistory.startTime, "Asia/Kolkata");
          const end = moment.tz(endTime, "Asia/Kolkata");
          const duration = moment.utc(end.diff(start)).format("HH:mm:ss");

          liveHistory.endTime = endTime;
          liveHistory.duration = duration;

          await Promise.all([
            liveHistory?.save(),
            User.findOneAndUpdate({ _id: user._id }, { $set: { isLive: false, liveHistoryId: null } }, { new: true }),
            LiveUser.deleteOne({ userId: user._id }),
            LiveView.deleteMany({ liveHistoryId: liveHistory._id }),
            TopGifter.deleteMany({ liveHistoryId: liveHistory._id }),
          ]);

          console.log("liveUser and related liveView deleted in endLive");
        }

        const sockets = await io.in(parsedData?.liveHistoryId).fetchSockets();
        sockets?.length ? io.socketsLeave(parsedData?.liveHistoryId) : console.log("sockets not able to leave in endLive");
      }
    } catch (error) {
      console.error("Error in endLive:", error);
    }
  });

  socket.on("disconnect", async (reason) => {
    console.log(`socket disconnect ===============`, id, socket?.id, reason);

    if (globalRoom) {
      const socket = await io.in(globalRoom).fetchSockets();

      if (socket?.length == 0) {
        const userId = new mongoose.Types.ObjectId(id);

        const user = await User.findById(userId);
        if (user) {
          if (user.isLive) {
            const liveHistory = await LiveHistory.findById(user.liveHistoryId);
            console.log("liveHistory in disconnect globalRoom: ", liveHistory);

            const endTime = moment().tz("Asia/Kolkata").format();
            const start = moment.tz(liveHistory.startTime, "Asia/Kolkata");
            const end = moment.tz(endTime, "Asia/Kolkata");
            const duration = moment.utc(end.diff(start)).format("HH:mm:ss");

            liveHistory.endTime = endTime;
            liveHistory.duration = duration;

            await Promise.all([
              liveHistory?.save(),
              User.findOneAndUpdate({ _id: user._id }, { $set: { isOnline: false, isLive: false, liveHistoryId: null } }, { new: true }),
              LiveUser.deleteOne({ userId: user._id }),
              LiveView.deleteMany({ liveHistoryId: liveHistory._id }),
              TopGifter.deleteMany({ liveHistoryId: liveHistory._id }),
            ]);

            console.log("liveUser and related liveView deleted in disconnect");
          }

          const sockets = await io.in(user?.liveHistoryId?.toString()).fetchSockets();
          sockets?.length ? io.socketsLeave(user?.liveHistoryId?.toString()) : console.log("sockets not able to leave in disconnect");
        }
      }
    }
  });
});
