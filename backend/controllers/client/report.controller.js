const Report = require("../../models/report.model");

//import model
const User = require("../../models/user.model");
const Video = require("../../models/video.model");
const Post = require("../../models/post.model");
const Story = require("../../models/story.model");
const ReportReason = require("../../models/reportReason.model");

//mongoose
const mongoose = require("mongoose");

//private key
const admin = require("../../util/privateKey");

function resolveReportType(type) {
  if (type === "video") return 1;
  if (type === "post") return 2;
  if (type === "story") return 4;
  return 3; // user
}

//report made by particular user
exports.reportByUser = async (req, res) => {
  try {
    const { reportReason, type, userId, videoId, postId, toUserId, storyId } = req.query;
    if (!reportReason || !type || !userId) {
      return res.status(400).json({ status: false, message: "Invalid request details." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const videoObjectId = videoId ? new mongoose.Types.ObjectId(videoId) : null;
    const postObjectId = postId ? new mongoose.Types.ObjectId(postId) : null;
    const toUserObjectId = toUserId ? new mongoose.Types.ObjectId(toUserId) : null;
    const storyObjectId = storyId ? new mongoose.Types.ObjectId(storyId) : null;
    const reportType = resolveReportType(type);

    const [user, video, post, toUser, story, existingReport] = await Promise.all([
      User.findOne({ _id: userObjectId }).select("_id isBlock fcmToken name").lean(),
      videoObjectId ? Video.findOne({ _id: videoObjectId }).lean() : null,
      postObjectId ? Post.findOne({ _id: postObjectId }).lean() : null,
      toUserObjectId ? User.findOne({ _id: toUserObjectId }).select("_id isBlock").lean() : null,
      storyObjectId ? Story.findOne({ _id: storyObjectId }).lean() : null,
      Report.findOne({
        ...(videoId && { videoId: videoObjectId, userId: userObjectId, type: 1 }),
        ...(postId && { postId: postObjectId, userId: userObjectId, type: 2 }),
        ...(toUserId && { fromUserId: userObjectId, toUserId: toUserObjectId, type: 3 }),
        ...(storyId && { storyId: storyObjectId, userId: userObjectId, type: 4 }),
      }).lean(),
    ]);

    if (!user) return res.status(200).json({ status: false, message: "User not found." });
    if (user.isBlock) return res.status(403).json({ status: false, message: "You are blocked by admin." });

    if (videoId) {
      if (!video) return res.status(200).json({ status: false, message: "Video not found." });
      if (video.userId.toString() === user._id.toString()) {
        return res.status(200).json({ status: false, message: "You cannot report your own video." });
      }
    }

    if (postId) {
      if (!post) return res.status(200).json({ status: false, message: "Post not found." });
      if (post.userId.toString() === user._id.toString()) {
        return res.status(200).json({ status: false, message: "You cannot report your own post." });
      }
    }

    if (storyId) {
      if (!story) return res.status(200).json({ status: false, message: "Story not found." });
      if (story.user && story.user.toString() === user._id.toString()) {
        return res.status(200).json({ status: false, message: "You cannot report your own story." });
      }
    }

    if (toUserId) {
      if (!toUser) return res.status(200).json({ status: false, message: "Reported user not found." });
      if (toUser.isBlock) return res.status(403).json({ status: false, message: "Reported user is blocked." });
      if (toUser._id.toString() === user._id.toString()) {
        return res.status(200).json({ status: false, message: "You cannot report yourself." });
      }
    }

    if (existingReport) {
      return res.status(200).json({
        status: true,
        message: `A report has already been submitted by ${user.name}.`,
      });
    }

    res.status(200).json({
      status: true,
      message: `A report has been successfully submitted.`,
    });

    const newReport = new Report({
      userId: user._id,
      videoId: videoObjectId || null,
      postId: postObjectId || null,
      storyId: storyObjectId || null,
      toUserId: toUserObjectId || (story?.user ?? null),
      reportReason: reportReason.trim(),
      type: reportType,
    });
    await newReport.save();

    if (user && !user.isBlock && user.fcmToken) {
      const payload = {
        token: user.fcmToken,
        notification: {
          title: "🚨 Report Received & Under Review!",
          body: "🛡️ Your report has been submitted successfully! Our team is reviewing it to keep the community safe. Thank you for your vigilance! 🙌",
        },
        data: {
          type: "REPORT_SUBMISSION",
        },
      };

      const adminPromise = await admin;
      adminPromise
        .messaging()
        .send(payload)
        .then(async (response) => {
          console.log("Notification sent successfully:", response);
        })
        .catch((error) => {
          console.error("Error sending notification:", error);
        });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error." });
  }
};

//when report by the user get reportReason
exports.getReportReason = async (req, res) => {
  try {
    const reportReason = await ReportReason.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      status: true,
      message: "Report reason get successfully.",
      reportReason,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
