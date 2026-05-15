const mongoose = require("mongoose");
const Note = require("../../models/note.model");
const User = require("../../models/user.model");
const FollowerFollowing = require("../../models/followerFollowing.model");
const ChatTopic = require("../../models/chatTopic.model");

/** User ids who should refresh notes when this author posts/deletes a note. */
const collectNoteFeedPeerIds = async (authorUserId) => {
  const uid = new mongoose.Types.ObjectId(authorUserId);
  const me = String(uid);

  const [following, followers, chatTopics] = await Promise.all([
    FollowerFollowing.find({ fromUserId: uid }).select("toUserId").lean(),
    FollowerFollowing.find({ toUserId: uid }).select("fromUserId").lean(),
    ChatTopic.find({
      isAccepted: true,
      chatId: { $ne: null },
      $or: [{ senderUserId: uid }, { receiverUserId: uid }],
    })
      .select("senderUserId receiverUserId")
      .lean(),
  ]);

  const ids = new Set([me]);
  following.forEach((f) => f.toUserId && ids.add(String(f.toUserId)));
  followers.forEach((f) => f.fromUserId && ids.add(String(f.fromUserId)));
  for (const t of chatTopics) {
    const s = t.senderUserId != null ? String(t.senderUserId) : "";
    const r = t.receiverUserId != null ? String(t.receiverUserId) : "";
    if (s && s !== me) ids.add(s);
    if (r && r !== me) ids.add(r);
  }
  return Array.from(ids);
};

const emitNoteFeedUpdated = async (authorUserId) => {
  const io = global.io;
  if (!io || !authorUserId) return;
  const authorId = authorUserId.toString();
  const payload = { userId: authorId };
  try {
    const viewerIds = await collectNoteFeedPeerIds(authorUserId);
    for (const viewerId of viewerIds) {
      io.in(`globalRoom:${viewerId}`).emit("noteFeedUpdated", payload);
    }
  } catch (err) {
    console.log("emitNoteFeedUpdated", err);
    io.in(`globalRoom:${authorId}`).emit("noteFeedUpdated", payload);
  }
};

exports.setNote = async (req, res) => {
  try {
    const userId = req.query.userId;
    const text = String(req.body?.text ?? "")
      .trim()
      .slice(0, 60);
    if (!userId) {
      return res.status(200).json({ status: false, message: "userId is required." });
    }
    if (!text) {
      return res.status(200).json({ status: false, message: "Note text is required." });
    }
    const user = await User.findById(userId).select("_id isBlock").lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }
    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    await Note.deleteMany({ userId });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const created = await Note.create({ userId, text, expiresAt });
    const populated = await Note.findById(created._id)
      .populate("userId", "name userName image isOnline")
      .lean();

    await emitNoteFeedUpdated(userId);

    return res.status(200).json({
      status: true,
      message: "Success",
      data: populated,
    });
  } catch (err) {
    console.log(err);
    return res.status(200).json({ status: false, message: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(200).json({ status: false, message: "userId is required." });
    }
    await Note.deleteMany({ userId });
    await emitNoteFeedUpdated(userId);
    return res.status(200).json({ status: true, message: "Note deleted." });
  } catch (err) {
    console.log(err);
    return res.status(200).json({ status: false, message: err.message });
  }
};

exports.getNotesFeed = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(200).json({ status: false, message: "userId is required." });
    }
    const viewer = await User.findById(userId).select("_id isBlock").lean();
    if (!viewer) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }
    if (viewer.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    const uid = new mongoose.Types.ObjectId(userId);
    const candidateIds = (await collectNoteFeedPeerIds(userId)).map((s) => new mongoose.Types.ObjectId(s));
    const now = new Date();

    const raw = await Note.find({
      userId: { $in: candidateIds },
      expiresAt: { $gt: now },
    })
      .populate("userId", "name userName image isOnline")
      .sort({ createdAt: -1 })
      .lean();

    const best = new Map();
    for (const n of raw) {
      if (!n.userId || !n.userId._id) continue;
      const key = String(n.userId._id);
      if (!best.has(key)) best.set(key, n);
    }
    const list = Array.from(best.values());
    const myStr = String(uid);

    list.sort((a, b) => {
      const aid = String(a.userId._id);
      const bid = String(b.userId._id);
      if (aid === myStr && bid !== myStr) return -1;
      if (bid === myStr && aid !== myStr) return 1;
      const aOn = a.userId.isOnline ? 1 : 0;
      const bOn = b.userId.isOnline ? 1 : 0;
      if (aOn !== bOn) return bOn - aOn;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      status: true,
      message: "Success",
      data: list,
    });
  } catch (err) {
    console.log(err);
    return res.status(200).json({ status: false, message: err.message });
  }
};
