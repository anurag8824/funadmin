const mongoose = require("mongoose");
const Note = require("../../models/note.model");
const User = require("../../models/user.model");
const FollowerFollowing = require("../../models/followerFollowing.model");

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
    const following = await FollowerFollowing.find({ fromUserId: uid }).select("toUserId").lean();
    const candidateIds = [uid, ...following.map((f) => f.toUserId).filter(Boolean)];
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
