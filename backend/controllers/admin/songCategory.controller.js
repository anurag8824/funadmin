const SongCategory = require("../../models/songCategory.model");

//import model
const Song = require("../../models/song.model");
const SongFavorite = require("../../models/songFavorite.model");
const Notification = require("../../models/notification.model");
const Video = require("../../models/video.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideo = require("../../models/likeHistoryOfpostOrvideo.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const Report = require("../../models/report.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const WatchHistory = require("../../models/watchHistory.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//mongoose
const mongoose = require("mongoose");

//create songCategory
exports.create = async (req, res) => {
  try {
    if (!req.body.name || !req.body.image) {
      if (req.body.image) {
        await deleteFromStorage(req.body.image);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const songCategory = new SongCategory();
    songCategory.name = req.body.name;
    songCategory.image = req?.body?.image;
    await songCategory.save();

    return res.status(200).json({
      status: true,
      message: "SongCategory created by admin!",
      songCategory: songCategory,
    });
  } catch (error) {
    if (req.body.image) {
      await deleteFromStorage(req.body.image);
    }

    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//update songCategory
exports.update = async (req, res) => {
  try {
    if (!req.query.songCategoryId) {
      if (req.body.image) {
        await deleteFromStorage(req.body.image);
      }

      return res.status(200).json({ status: false, message: "songCategoryId must be required!!" });
    }

    const songCategory = await SongCategory.findOne({ _id: req.query.songCategoryId });
    if (!songCategory) {
      if (req.body.image) {
        await deleteFromStorage(req.body.image);
      }

      return res.status(200).json({ status: false, message: "songCategory does not found!!" });
    }

    if (req.body.image) {
      await deleteFromStorage(songCategory?.image);

      songCategory.image = req?.body?.image ? req?.body?.image : songCategory.image;
    }

    songCategory.name = req.body.name ? req.body.name.trim() : songCategory.name;
    await songCategory.save();

    return res.status(200).json({
      status: true,
      message: "SongCategory updated by admin!",
      songCategory: songCategory,
    });
  } catch (error) {
    if (req.body.image) {
      await deleteFromStorage(req.body.image);
    }

    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get all songCategory
exports.getSongCategory = async (req, res, next) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [totalSongCategory, songCategory] = await Promise.all([
      SongCategory.countDocuments(),
      SongCategory.find()
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: true,
      message: "SongCategories get by admin.",
      totalSongCategory: totalSongCategory,
      songCategory: songCategory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete songCategory
exports.destroy = async (req, res) => {
  try {
    if (!req.query.songCategoryId) {
      return res.status(200).json({ status: false, message: "songCategoryId must be required!" });
    }

    const songCategoryId = new mongoose.Types.ObjectId(req.query.songCategoryId);

    const songCategory = await SongCategory.findById(songCategoryId);
    if (!songCategory) {
      return res.status(200).json({ status: false, message: "No songCategory found with the provided ID." });
    }

    res.status(200).json({ status: true, message: "SongCategory has been deleted by admin!" });

    if (songCategory?.image) {
      await deleteFromStorage(songCategory?.image);
    }

    const songsToDelete = await Song.find({ songCategoryId: songCategoryId });

    await songsToDelete.map(async (song) => {
      if (song?.songImage) {
        await deleteFromStorage(song?.songImage);
      }

      if (song?.songLink) {
        await deleteFromStorage(song?.songLink);
      }

      const videosToDelete = await Video.find({ songId: song?._id });

      await videosToDelete.map(async (video) => {
        if (video?.videoImage) {
          await deleteFromStorage(video?.videoImage);
        }

        if (video?.videoUrl) {
          await deleteFromStorage(video?.videoUrl);
        }

        await Promise.all([
          LikeHistoryOfpostOrvideo.deleteMany({ videoId: video._id }),
          PostOrVideoComment.deleteMany({ videoId: video._id }),
          LikeHistoryOfpostOrvideoComment.deleteMany({ videoId: video._id }),
          WatchHistory.deleteMany({ videoId: video._id }),
          HashTagUsageHistory.deleteMany({ videoId: video._id }),
          Notification.deleteMany({ $or: [{ otherUserId: video?.userId }, { userId: video?.userId }] }),
          Report.deleteMany({ videoId: video._id }),
          Video.deleteOne({ _id: video._id }),
        ]);
      });

      await SongFavorite.deleteMany({ songId: song?._id });
      await song.deleteOne();
    });

    await songCategory.deleteOne();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};
