const Livevideo = require("../../models/livevideo.model");

//mongoose
const mongoose = require("mongoose");

//import model
const User = require("../../models/user.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//upload live video
exports.uploadLivevideo = async (req, res) => {
  try {
    console.log("req.body : ", req.body);

    const { userId, videoTime, videoImage, videoUrl, liveStreamMode, thumbnailType, mediaSourceKind, pkPreviewImages, pkMediaSources } = req.body;

    const deleteUploads = async () => {
      try {
        if (videoImage) await deleteFromStorage(videoImage);
        if (videoUrl) await deleteFromStorage(videoUrl);
        if (Array.isArray(pkPreviewImages)) {
          for (const img of pkPreviewImages) {
            if (img) await deleteFromStorage(img);
          }
        }
        if (Array.isArray(pkMediaSources)) {
          for (const vid of pkMediaSources) {
            if (vid) await deleteFromStorage(vid);
          }
        }
      } catch (err) {
        console.warn("Error during cleanup:", err.message);
      }
    };

    const isValidArray = (arr) => Array.isArray(arr) && arr.every((item) => typeof item === "string" && item.trim());

    const mode = parseInt(liveStreamMode);
    const thumbnail = parseInt(thumbnailType);
    const sourceKind = parseInt(mediaSourceKind);

    if (!userId || !mode) {
      await deleteUploads();
      return res.status(200).json({ status: false, message: "Required fields are missing." });
    }

    if (mode === 1) {
      if (!videoImage || !videoUrl || !thumbnail) {
        await deleteUploads();
        return res.status(200).json({
          status: false,
          message: "For liveStreamMode 1, videoImage, videoUrl, and thumbnailType are required.",
        });
      }
    } else if (mode === 2) {
      if (!sourceKind || !isValidArray(pkPreviewImages) || !isValidArray(pkMediaSources)) {
        await deleteUploads();
        return res.status(200).json({
          status: false,
          message: "For liveStreamMode 2, mediaSourceKind, pkPreviewImages, and pkMediaSources are required and must not contain null values.",
        });
      }
    }

    const [user, existingLiveVideo] = await Promise.all([
      User.findOne({ _id: userId, isFake: true }).select("name userName image isBlock"),
      Livevideo.findOne({ userId, liveStreamMode: mode }).lean(),
    ]);

    if (!user) {
      await deleteUploads();
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      await deleteUploads();
      return res.status(200).json({ status: false, message: "User is blocked by admin." });
    }

    if (existingLiveVideo) {
      await deleteUploads();
      return res.status(200).json({ status: false, message: "Live video already exists for this user." });
    }

    if (!settingJSON) {
      await deleteUploads();
      return res.status(200).json({ status: false, message: "System settings not found." });
    }

    if (parseInt(videoTime) > settingJSON.durationOfShorts) {
      await deleteUploads();
      return res.status(200).json({ status: false, message: "Video duration exceeds admin limit." });
    }

    const newVideo = new Livevideo({
      userId: user._id,
      videoTime: videoTime ? parseInt(videoTime) : 0,
      liveStreamMode: mode,
      thumbnailType: thumbnail || 0,
      mediaSourceKind: sourceKind || 0,
      videoImage: videoImage || "",
      videoUrl: videoUrl || "",
      pkPreviewImages: isValidArray(pkPreviewImages) ? pkPreviewImages : [],
      pkMediaSources: isValidArray(pkMediaSources) ? pkMediaSources : [],
      isLive: true,
    });

    await newVideo.save();

    return res.status(200).json({
      status: true,
      message: "Live video uploaded successfully.",
      data: {
        ...newVideo.toObject(),
        userId: user,
      },
    });
  } catch (error) {
    console.error("uploadLivevideo error:", error);

    try {
      if (req?.body?.videoImage) await deleteFromStorage(req.body.videoImage);
      if (req?.body?.videoUrl) await deleteFromStorage(req.body.videoUrl);
      if (Array.isArray(req.body?.pkPreviewImages)) {
        for (const img of req.body.pkPreviewImages) {
          if (img) await deleteFromStorage(img);
        }
      }
      if (Array.isArray(req.body?.pkMediaSources)) {
        for (const vid of req.body.pkMediaSources) {
          if (vid) await deleteFromStorage(vid);
        }
      }
    } catch (cleanupErr) {
      console.warn("Error during error cleanup:", cleanupErr.message);
    }

    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//update live video
exports.updateLivevideo = async (req, res) => {
  try {
    console.log("req.body: ", req.body);

    const { userId, videoId, videoImage, videoUrl, videoTime, liveStreamMode, thumbnailType, mediaSourceKind, pkPreviewImages, pkMediaSources } = req.body;

    if (!userId || !videoId) {
      if (videoImage) await deleteFromStorage(videoImage);
      if (videoUrl) await deleteFromStorage(videoUrl);
      return res.status(200).json({ status: false, message: "userId and videoId are required." });
    }

    const [user, video] = await Promise.all([User.findOne({ _id: userId }).select("name userName image"), Livevideo.findOne({ _id: videoId, userId })]);

    if (!user) {
      if (videoImage) await deleteFromStorage(videoImage);
      if (videoUrl) await deleteFromStorage(videoUrl);
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      if (videoImage) await deleteFromStorage(videoImage);
      if (videoUrl) await deleteFromStorage(videoUrl);
      return res.status(200).json({ status: false, message: "User is blocked by admin." });
    }

    if (!video) {
      if (videoImage) await deleteFromStorage(videoImage);
      if (videoUrl) await deleteFromStorage(videoUrl);
      return res.status(200).json({ status: false, message: "Video not found for this user." });
    }

    if (videoImage) {
      await deleteFromStorage(video.videoImage);
      video.videoImage = videoImage;
    }

    if (videoUrl) {
      await deleteFromStorage(video.videoUrl);
      video.videoUrl = videoUrl;
    }

    if (videoTime) video.videoTime = parseInt(videoTime);
    if (liveStreamMode) video.liveStreamMode = parseInt(liveStreamMode);
    if (mediaSourceKind) video.mediaSourceKind = parseInt(mediaSourceKind);
    if (thumbnailType) video.thumbnailType = parseInt(thumbnailType);

    if (Array.isArray(pkPreviewImages)) {
      console.log("Starting index-wise update for pkPreviewImages...");
      const oldImages = video.pkPreviewImages || [];

      for (let i = 0; i < pkPreviewImages.length; i++) {
        const newImg = pkPreviewImages[i];
        const oldImg = oldImages[i];
        if (newImg && oldImg && newImg !== oldImg) {
          console.log(`Deleting replaced pkPreviewImage at index ${i}: ${oldImg}`);
          await deleteFromStorage(oldImg);
        }
      }

      video.pkPreviewImages = pkPreviewImages;
      console.log("Updated pkPreviewImages:", pkPreviewImages);
    }

    if (Array.isArray(pkMediaSources)) {
      console.log("Starting index-wise update for pkMediaSources...");
      const oldSources = video.pkMediaSources || [];

      for (let i = 0; i < pkMediaSources.length; i++) {
        const newVid = pkMediaSources[i];
        const oldVid = oldSources[i];
        if (newVid && oldVid && newVid !== oldVid) {
          console.log(`Deleting replaced pkMediaSource at index ${i}: ${oldVid}`);
          await deleteFromStorage(oldVid);
        }
      }

      video.pkMediaSources = pkMediaSources;
      console.log("Updated pkMediaSources:", pkMediaSources);
    }

    await video.save();

    return res.status(200).json({
      status: true,
      message: "Live video updated successfully.",
      data: { ...video.toObject(), userId: user },
    });
  } catch (error) {
    if (req?.body?.videoImage) await deleteFromStorage(req.body.videoImage);
    if (req?.body?.videoUrl) await deleteFromStorage(req.body.videoUrl);
    console.error("updateLivevideo error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get live videos
exports.getVideos = async (req, res, next) => {
  try {
    if (!req.query.startDate || !req.query.endDate) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let dateFilterQuery = {};
    if (req.query.startDate !== "All" && req.query.endDate !== "All") {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const liveStreamModeFilter = req?.query?.liveStreamMode || "All";
    if (liveStreamModeFilter && liveStreamModeFilter !== "All") {
      dateFilterQuery.liveStreamMode = parseInt(liveStreamModeFilter);
    }

    const [totalLivevideo, livevideos] = await Promise.all([
      Livevideo.countDocuments(dateFilterQuery),
      Livevideo.aggregate([
        { $match: dateFilterQuery },
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
          $project: {
            _id: 1,
            liveStreamMode: 1,
            thumbnailType: 1,
            mediaSourceKind: 1,
            pkPreviewImages: 1,
            pkMediaSources: 1,
            isLive: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            createdAt: 1,
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: `Retrive live videos.`,
      total: totalLivevideo,
      data: livevideos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete video
exports.deleteVideo = async (req, res) => {
  try {
    if (!req.query.videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required." });
    }

    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const livevideo = await Livevideo.findOne({ _id: videoId });
    if (!livevideo) {
      return res.status(200).json({ status: false, message: "video does not found for this user." });
    }

    res.status(200).json({ status: true, message: "Videos have been deleted by the admin." });

    if (livevideo?.videoImage) {
      await deleteFromStorage(livevideo?.videoImage);
    }

    if (livevideo?.videoUrl) {
      await deleteFromStorage(livevideo?.videoUrl);
    }

    if (Array.isArray(livevideo.pkPreviewImages)) {
      for (const imgUrl of livevideo.pkPreviewImages) {
        try {
          await deleteFromStorage(imgUrl);
        } catch (error) {
          console.error(`Error deleting preview image: ${imgUrl}`, error);
        }
      }
    }

    if (Array.isArray(livevideo.pkMediaSources)) {
      for (const mediaUrl of livevideo.pkMediaSources) {
        try {
          await deleteFromStorage(mediaUrl);
        } catch (error) {
          console.error(`Error deleting media source: ${mediaUrl}`, error);
        }
      }
    }

    await Livevideo.deleteOne({ _id: livevideo._id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//video live or not
exports.isLive = async (req, res) => {
  try {
    if (!req.query.videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required." });
    }

    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const livevideo = await Livevideo.findOne({ _id: videoId });
    if (!livevideo) {
      return res.status(200).json({ status: false, message: "video does not found for this user." });
    }

    livevideo.isLive = !livevideo.isLive;
    await livevideo.save();

    return res.status(200).json({
      status: true,
      message: "livevideo has been updated by admin!",
      data: livevideo,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
