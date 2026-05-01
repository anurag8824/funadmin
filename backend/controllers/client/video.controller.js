const Video = require("../../models/video.model");

//mongoose
const mongoose = require("mongoose");

//day.js
const dayjs = require("dayjs");

//import model
const User = require("../../models/user.model");
const Song = require("../../models/song.model");
const LikeHistoryOfPostOrVideo = require("../../models/likeHistoryOfpostOrvideo.model");
const PostOrVideoComment = require("../../models/postOrvideoComment.model");
const LikeHistoryOfpostOrvideoComment = require("../../models/likeHistoryOfpostOrvideoComment.model");
const WatchHistory = require("../../models/watchHistory.model");
const HashTag = require("../../models/hashTag.model");
const HashTagUsageHistory = require("../../models/hashTagUsageHistory.model");
const Report = require("../../models/report.model");
const Notification = require("../../models/notification.model");
const ReelUploadJob = require("../../models/reelUploadJob.model");
const { createAndEnqueueReelJob, getActiveReelJob } = require("../../services/reelProcessing.service");

//private key
const admin = require("../../util/privateKey");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//generateUniqueVideoOrPostId
const { generateUniqueVideoOrPostId } = require("../../util/generateUniqueVideoOrPostId");

//upload video by particular user
exports.uploadvideo = async (req, res, next) => {
  try {
    console.log("[REELS_UPLOAD][REQ]", {
      userId: req.query.userId,
      videoUrl: req?.body?.videoUrl,
      videoImage: req?.body?.videoImage,
      videoTime: req?.body?.videoTime,
      hasCaption: !!req?.body?.caption,
    });
    if (!req.query.userId) {
      if (req?.body?.videoImage) {
        await deleteFromStorage(req?.body?.videoImage);
      }

      if (req?.body?.videoUrl) {
        await deleteFromStorage(req?.body?.videoUrl);
      }

      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    if (!req.body.videoTime || !req?.body?.videoUrl || !req?.body?.videoImage) {
      if (req?.body?.videoImage) {
        await deleteFromStorage(req?.body?.videoImage);
      }

      if (req?.body?.videoUrl) {
        await deleteFromStorage(req?.body?.videoUrl);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const [uniqueVideoId, user, song] = await Promise.all([generateUniqueVideoOrPostId(), User.findOne({ _id: req.query.userId, isFake: false }), Song.findById(req?.body?.songId)]);

    if (!user) {
      if (req?.body?.videoImage) {
        await deleteFromStorage(req?.body?.videoImage);
      }

      if (req?.body?.videoUrl) {
        await deleteFromStorage(req?.body?.videoUrl);
      }

      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req?.body?.videoImage) {
        await deleteFromStorage(req?.body?.videoImage);
      }

      if (req?.body?.videoUrl) {
        await deleteFromStorage(req?.body?.videoUrl);
      }

      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!settingJSON) {
      if (req?.body?.videoImage) {
        await deleteFromStorage(req?.body?.videoImage);
      }

      if (req?.body?.videoUrl) {
        await deleteFromStorage(req?.body?.videoUrl);
      }

      return res.status(200).json({ status: false, message: "setting does not found!" });
    }

    const maxDuration = settingJSON.durationOfShorts ? Math.min(settingJSON.durationOfShorts, 90) : 90;
    if (parseInt(req.body.videoTime) > maxDuration) {
      if (req?.body?.videoImage) {
        await deleteFromStorage(req?.body?.videoImage);
      }

      if (req?.body?.videoUrl) {
        await deleteFromStorage(req?.body?.videoUrl);
      }

      return res.status(400).json({ status: false, message: `Video duration cannot exceed ${maxDuration} seconds.`, code: "DURATION_EXCEEDED" });
    }

    if (req.body.videoUrl && !req.body.videoUrl.match(/\.(mp4)(\?.*)?$/i)) {
      if (req?.body?.videoImage) await deleteFromStorage(req?.body?.videoImage);
      if (req?.body?.videoUrl) await deleteFromStorage(req?.body?.videoUrl);

      return res.status(400).json({
        status: false,
        message: "Only MP4 video format is supported.",
        code: "INVALID_FILE_TYPE"
      });
    }

    if (req?.body?.songId) {
      if (!song) {
        if (req?.body?.videoImage) {
          await deleteFromStorage(req?.body?.videoImage);
        }

        if (req?.body?.videoUrl) {
          await deleteFromStorage(req?.body?.videoUrl);
        }

        return res.status(200).json({ status: false, message: "Song does not found." });
      }
    }

    const video = new Video();

    video.userId = user._id;
    video.caption = req?.body?.caption ? req.body.caption : "";
    video.videoTime = req?.body?.videoTime;
    video.songId = req?.body?.songId ? song._id : video.songId;

    if (req?.body?.hashTagId) {
      const multipleHashTag = req?.body?.hashTagId.toString().split(",");
      video.hashTagId = req?.body?.hashTagId ? multipleHashTag : [];

      //create history for each hashtag used
      await multipleHashTag.map(async (hashTagId) => {
        const hashTag = await HashTag.findById(hashTagId);
        if (hashTag) {
          const hashTagUsageHistory = new HashTagUsageHistory({
            userId: user._id,
            hashTagId: hashTagId,
            videoId: video._id,
          });
          await hashTagUsageHistory.save();
        }
      });
    }

    if (req?.body?.videoImage) {
      video.videoImage = req.body.videoImage;
    }

    if (req?.body?.videoUrl) {
      video.videoUrl = req.body.videoUrl;
    }

    video.uniqueVideoId = uniqueVideoId;
    video.processingStatus = "ready";
    await video.save();

    let uploadJob = null;
    const shouldProcessAsync = String(process.env.REELS_ASYNC_PROCESSING || "false").toLowerCase() === "true";
    if (shouldProcessAsync) {
      const existingJob = await getActiveReelJob(video._id);
      if (existingJob) {
        uploadJob = existingJob;
      } else {
        video.processingStatus = "processing";
        await video.save();
        uploadJob = await createAndEnqueueReelJob({
          videoId: video._id,
          userId: user._id,
          sourceUrl: video.videoUrl,
        });
      }
      if (uploadJob?.state === "failed") {
        video.processingStatus = "failed";
        video.processingError = uploadJob.error || "Queue job creation failed";
        await video.save();
      }
    }

    res.status(200).json({
      status: true,
      message: "Video has been uploaded by the user.",
      data: video,
      uploadJob: uploadJob
        ? {
            id: uploadJob._id,
            state: uploadJob.state,
            progress: uploadJob.progress,
          }
        : null,
    });
    console.log("[REELS_UPLOAD][OK]", {
      videoId: String(video._id),
      userId: String(user._id),
      processingStatus: video.processingStatus,
      uploadJobId: uploadJob?._id ? String(uploadJob._id) : null,
      uploadJobState: uploadJob?.state || null,
    });

    const videoUrl = req?.body?.videoUrl;

    if (videoUrl) {
      var sightengine = require("sightengine")(settingJSON.sightengineUser, settingJSON.sightengineSecret);

      const checks = [];
      if (settingJSON.videoBanned.includes("1")) checks.push("nudity-2.1");
      if (settingJSON.videoBanned.includes("2")) checks.push("offensive");
      if (settingJSON.videoBanned.includes("3")) checks.push("violence");
      if (settingJSON.videoBanned.includes("4")) checks.push("gore-2.0");
      if (settingJSON.videoBanned.includes("5")) checks.push("weapon");
      if (settingJSON.videoBanned.includes("6")) checks.push("tobacco");
      if (settingJSON.videoBanned.includes("7")) checks.push("recreational_drug,medical");
      if (settingJSON.videoBanned.includes("8")) checks.push("gambling");
      if (settingJSON.videoBanned.includes("9")) checks.push("alcohol");
      if (settingJSON.videoBanned.includes("10")) checks.push("money");
      if (settingJSON.videoBanned.includes("11")) checks.push("self-harm");

      console.log("checks when upload video by client side:        ", checks);

      if (checks.length > 0) {
        sightengine
          .check(checks)
          .video_sync(videoUrl)
          .then(async function (result) {
            // console.log("result ", result);

            if (result.status === "success") {
              const frames = result?.data?.frames;
              console.log("frames ", frames);

              if (frames) {
                let isBanned = false;

                for (const check of checks) {
                  if (settingJSON.videoBanned.includes("nudity") && check === "nudity-2.1") {
                    const nudityFrames = frames.map((frame) => frame.nudity?.sexual_activity);
                    const avgNudityProb = nudityFrames.reduce((acc, prob) => acc + prob, 0) / nudityFrames.length;

                    console.log("avgNudityProb ", avgNudityProb);
                    console.log("isBanned ", isBanned);

                    if (avgNudityProb > 0.7) {
                      isBanned = true;

                      console.log("New isBanned ", isBanned);

                      if (isBanned === true) {
                        video.isBanned = isBanned;
                        await video.save();
                      }

                      break;
                    }
                  }

                  if (settingJSON.videoBanned.includes("violence") && check === "violence") {
                    const violenceFrames = frames.map((frame) => frame.violence?.prob);
                    const avgViolenceProb = violenceFrames.reduce((acc, prob) => acc + prob, 0) / violenceFrames.length;

                    console.log("avgViolenceProb ", avgViolenceProb);
                    console.log("isBanned ", isBanned);

                    if (avgViolenceProb > 0.7) {
                      isBanned = true;

                      console.log("New isBanned ", isBanned);

                      if (isBanned === true) {
                        video.isBanned = isBanned;
                        await video.save();
                        console.log("Video isBanned ", video.isBanned);
                      }

                      break;
                    }
                  }

                  if (settingJSON.videoBanned.includes("offensive") && check === "offensive") {
                    const offensiveFrames = frames.map((frame) => frame.offensive?.prob);
                    const avgOffensiveProb = offensiveFrames.reduce((acc, prob) => acc + prob, 0) / offensiveFrames.length;

                    console.log("avgOffensiveProb ", avgOffensiveProb);
                    console.log("isBanned ", isBanned);

                    if (avgOffensiveProb > 0.7) {
                      isBanned = true;

                      console.log("New isBanned ", isBanned);

                      if (isBanned === true) {
                        video.isBanned = isBanned;
                        await video.save();
                        console.log("Video isBanned ", video.isBanned);
                      }

                      break;
                    }
                  }

                  if (settingJSON.videoBanned.includes("weapon") && check === "weapon") {
                    const weaponFrames = frames.flatMap((frame) => {
                      const classesProbs = frame.weapon?.classes ? Object.values(frame.weapon.classes).map((prob) => prob || 0) : [];
                      const firearmTypeProbs = frame.weapon?.firearm_type ? Object.values(frame.weapon.firearm_type).map((prob) => prob || 0) : [];
                      const firearmActionProbs = frame.weapon?.firearm_action ? Object.values(frame.weapon.firearm_action).map((prob) => prob || 0) : [];

                      return [...classesProbs, ...firearmTypeProbs, ...firearmActionProbs];
                    });

                    if (weaponFrames.length > 0) {
                      const avgWeaponProb = weaponFrames.reduce((acc, prob) => acc + prob, 0) / weaponFrames.length;
                      console.log("avgWeaponProb:", avgWeaponProb);

                      if (avgWeaponProb > 0.7) {
                        isBanned = true;
                        console.log("New isBanned:", isBanned);

                        if (isBanned) {
                          video.isBanned = isBanned;
                          console.log("Video isBanned:", video.isBanned);
                        }
                      }
                    } else {
                      console.log("No weapon probabilities found in frames.");
                    }
                  }

                  if (settingJSON.videoBanned.includes("gore") && check === "gore-2.0") {
                    const goreFrames = frames.map((frame) => frame.gore?.prob);
                    const avgGoreProb = goreFrames.reduce((acc, prob) => acc + prob, 0) / goreFrames.length;

                    console.log("avgGoreProb ", avgGoreProb);
                    console.log("isBanned ", isBanned);

                    if (avgGoreProb > 0.7) {
                      isBanned = true;

                      console.log("New isBanned ", isBanned);

                      if (isBanned === true) {
                        video.isBanned = isBanned;
                        await video.save();
                        console.log("Video isBanned ", video.isBanned);
                      }

                      break;
                    }
                  }

                  if (settingJSON.videoBanned.includes("recreationalDrug") && check === "recreational_drug,medical") {
                    const recreationalDrugFrames = frames.map((frame) => frame.recreational_drug?.prob);
                    const avgRecreationalDrugProb = recreationalDrugFrames.reduce((acc, prob) => acc + prob, 0) / recreationalDrugFrames.length;

                    console.log("avgRecreationalDrugProb ", avgRecreationalDrugProb);
                    console.log("isBanned ", isBanned);

                    if (avgRecreationalDrugProb > 0.7) {
                      isBanned = true;

                      console.log("New isBanned ", isBanned);

                      if (isBanned === true) {
                        video.isBanned = isBanned;
                        await video.save();
                        console.log("Video isBanned ", video.isBanned);
                      }

                      break;
                    }
                  }

                  if (settingJSON.videoBanned.includes("alcohol") && check === "alcohol") {
                    const alcoholFrames = frames.map((frame) => frame.alcohol?.prob);
                    const avgAlcoholProb = alcoholFrames.reduce((acc, prob) => acc + prob, 0) / alcoholFrames.length;

                    console.log("avgAlcoholProb ", avgAlcoholProb);
                    console.log("isBanned ", isBanned);

                    if (avgAlcoholProb > 0.7) {
                      isBanned = true;

                      console.log("New isBanned ", isBanned);

                      if (isBanned === true) {
                        video.isBanned = isBanned;
                        await video.save();
                        console.log("Video isBanned ", video.isBanned);
                      }

                      break;
                    }
                  }

                  if (settingJSON.videoBanned.includes("gambling") && check === "gambling") {
                    const gamblingFrames = frames.map((frame) => frame.gambling?.prob);
                    const avgGamblingProb = gamblingFrames.reduce((acc, prob) => acc + prob, 0) / gamblingFrames.length;

                    console.log("avgGamblingProb ", avgGamblingProb);
                    console.log("isBanned ", isBanned);

                    if (avgGamblingProb > 0.7) {
                      isBanned = true;

                      console.log("New isBanned ", isBanned);

                      if (isBanned === true) {
                        video.isBanned = isBanned;
                        await video.save();
                        console.log("Video isBanned ", video.isBanned);
                      }

                      break;
                    }
                  }

                  if (settingJSON.videoBanned.includes("tobacco") && check === "tobacco") {
                    const tobaccoFrames = frames.map((frame) => frame.tobacco?.prob);
                    const avgTobaccoProb = tobaccoFrames.reduce((acc, prob) => acc + prob, 0) / tobaccoFrames.length;

                    console.log("avgTobaccoProb ", avgTobaccoProb);
                    console.log("isBanned ", isBanned);

                    if (avgTobaccoProb > 0.7) {
                      isBanned = true;

                      console.log("New isBanned ", isBanned);

                      if (isBanned === true) {
                        video.isBanned = isBanned;
                        await video.save();
                        console.log("Video isBanned ", video.isBanned);
                      }

                      break;
                    }
                  }

                  if (settingJSON.videoBanned.includes("money") && check === "money") {
                    const moneyFrames = frames.map((frame) => frame.money?.prob);
                    const avgMoneyProb = moneyFrames.reduce((acc, prob) => acc + prob, 0) / moneyFrames.length;

                    console.log("avgMoneyProb ", avgMoneyProb);
                    console.log("isBanned ", isBanned);

                    if (avgMoneyProb > 0.7) {
                      isBanned = true;

                      console.log("New isBanned ", isBanned);

                      if (isBanned === true) {
                        video.isBanned = isBanned;
                        await video.save();
                        console.log("Video isBanned ", video.isBanned);
                      }

                      break;
                    }
                  }

                  if (settingJSON.videoBanned.includes("selfHarm") && check === "self-harm") {
                    const selfHarmFrames = frames.map((frame) => frame["self-harm"]?.prob);
                    const avgSelfHarmProb = selfHarmFrames.reduce((acc, prob) => acc + prob, 0) / selfHarmFrames.length;

                    console.log("avgSelfHarmProb ", avgSelfHarmProb);
                    console.log("isBanned ", isBanned);

                    if (avgSelfHarmProb > 0.7) {
                      isBanned = true;

                      console.log("New isBanned ", isBanned);

                      if (isBanned === true) {
                        video.isBanned = isBanned;
                        await video.save();
                        console.log("Video isBanned ", video.isBanned);
                      }

                      break;
                    }
                  }
                }
              }
            }
          })
          .catch(function (err) {
            console.log(err);
          });
      }
    }
  } catch (error) {
    console.log(error);

    if (req?.body?.videoImage) {
      await deleteFromStorage(req?.body?.videoImage);
    }

    if (req?.body?.videoUrl) {
      await deleteFromStorage(req?.body?.videoUrl);
    }

    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//update video by particular user
exports.getReelUploadJobStatus = async (req, res) => {
  try {
    const { videoId, uploadJobId } = req.query;
    if (!videoId && !uploadJobId) {
      return res.status(400).json({ status: false, message: "videoId or uploadJobId is required." });
    }

    const filter = uploadJobId ? { _id: uploadJobId } : { videoId };
    const uploadJob = await ReelUploadJob.findOne(filter).sort({ createdAt: -1 }).lean();
    if (!uploadJob) {
      return res.status(200).json({ status: true, message: "No upload job found.", data: null });
    }

    return res.status(200).json({
      status: true,
      message: "Upload job status fetched successfully.",
      data: {
        id: uploadJob._id,
        videoId: uploadJob.videoId,
        state: uploadJob.state,
        progress: uploadJob.progress,
        error: uploadJob.error,
        startedAt: uploadJob.startedAt,
        completedAt: uploadJob.completedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal server error" });
  }
};

exports.retryReelProcessing = async (req, res) => {
  try {
    const { userId, videoId } = req.query;
    if (!userId || !videoId) {
      return res.status(400).json({ status: false, message: "userId and videoId are required." });
    }
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ status: false, message: "Invalid userId or videoId." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const videoObjectId = new mongoose.Types.ObjectId(videoId);
    const video = await Video.findById(videoObjectId).select("_id userId videoUrl processingStatus").lean();
    if (!video) {
      return res.status(404).json({ status: false, message: "Video not found." });
    }
    if (String(video.userId) !== String(userObjectId)) {
      return res.status(403).json({ status: false, message: "You can retry only your own reel processing." });
    }
    if (!video.videoUrl) {
      return res.status(400).json({ status: false, message: "Source video URL is missing." });
    }

    const existingJob = await getActiveReelJob(videoObjectId);
    if (existingJob) {
      return res.status(200).json({
        status: true,
        message: "Reel processing already in progress.",
        data: {
          videoId: videoObjectId,
          uploadJobId: existingJob._id,
          state: existingJob.state,
          progress: existingJob.progress,
        },
      });
    }

    await Video.updateOne(
      { _id: videoObjectId },
      {
        $set: {
          processingStatus: "processing",
          processingError: "",
        },
      }
    );

    const uploadJob = await createAndEnqueueReelJob({
      videoId: videoObjectId,
      userId: userObjectId,
      sourceUrl: video.videoUrl,
    });

    if (uploadJob?.state === "failed") {
      await Video.updateOne(
        { _id: videoObjectId },
        {
          $set: {
            processingStatus: "failed",
            processingError: uploadJob.error || "Queue job creation failed",
          },
        }
      );
      return res.status(500).json({
        status: false,
        message: uploadJob.error || "Failed to enqueue reel processing job.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Reel processing retried successfully.",
      data: {
        videoId: videoObjectId,
        uploadJobId: uploadJob._id,
        state: uploadJob.state,
        progress: uploadJob.progress,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal server error" });
  }
};

exports.updateVideoByUser = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      if (req?.body?.videoImage) {
        await deleteFromStorage(req?.body?.videoImage);
      }

      if (req?.body?.videoUrl) {
        await deleteFromStorage(req?.body?.videoUrl);
      }

      return res.status(200).json({ status: false, message: "userId and videoId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [user, videoOfUser, song] = await Promise.all([User.findOne({ _id: userId }), Video.findOne({ _id: videoId, userId: userId }), Song.findById(req?.body?.songId)]);

    if (!user) {
      if (req?.body?.videoImage) {
        await deleteFromStorage(req?.body?.videoImage);
      }

      if (req?.body?.videoUrl) {
        await deleteFromStorage(req?.body?.videoUrl);
      }
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      if (req?.body?.videoImage) {
        await deleteFromStorage(req?.body?.videoImage);
      }

      if (req?.body?.videoUrl) {
        await deleteFromStorage(req?.body?.videoUrl);
      }

      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!videoOfUser) {
      if (req?.body?.videoImage) {
        await deleteFromStorage(req?.body?.videoImage);
      }

      if (req?.body?.videoUrl) {
        await deleteFromStorage(req?.body?.videoUrl);
      }

      return res.status(200).json({ status: false, message: "video does not found for this user." });
    }

    if (req?.body?.songId) {
      if (!song) {
        if (req?.body?.videoImage) {
          await deleteFromStorage(req?.body?.videoImage);
        }

        if (req?.body?.videoUrl) {
          await deleteFromStorage(req?.body?.videoUrl);
        }

        return res.status(200).json({ status: false, message: "Song does not found." });
      }
    }

    if (req?.body?.videoImage) {
      await deleteFromStorage(videoOfUser?.videoImage);

      videoOfUser.videoImage = req?.body?.videoImage ? req?.body?.videoImage : videoOfUser.videoImage;
    }

    if (req?.body?.hashTagId) {
      const existingHistory = await HashTagUsageHistory.find({ userId: user._id, videoId: videoOfUser._id });

      if (existingHistory.length > 0) {
        console.log("Check if a history record already exists for the user and video");

        await HashTagUsageHistory.deleteMany({ userId: user._id, videoId: videoOfUser._id });
      }

      const multipleHashTag = req?.body?.hashTagId.toString().split(",");
      videoOfUser.hashTagId = multipleHashTag.length > 0 ? multipleHashTag : [];

      await Promise.all(
        multipleHashTag.map(async (hashTagId) => {
          const hashTag = await HashTag.findById(hashTagId);

          if (hashTag) {
            console.log("Create a new history record if it doesn't exist");

            const hashTagUsageHistory = new HashTagUsageHistory({
              userId: user._id,
              videoId: videoOfUser._id,
              hashTagId: hashTagId,
            });
            await hashTagUsageHistory.save();
          }
        })
      );
    }

    videoOfUser.songId = req?.body?.songId ? song._id : videoOfUser.songId;
    videoOfUser.caption = req.body.caption ? req.body.caption : videoOfUser.caption;
    await videoOfUser.save();

    return res.status(200).json({ status: true, message: "Video has been updated.", data: videoOfUser });
  } catch (error) {
    if (req?.body?.videoImage) {
      await deleteFromStorage(req?.body?.videoImage);
    }

    if (req?.body?.videoUrl) {
      await deleteFromStorage(req?.body?.videoUrl);
    }

    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//get particular user's videos
exports.videosOfUser = async (req, res, next) => {
  try {
    if (!req.query.userId || !req.query.toUserId) {
      return res.status(200).json({ status: false, message: "Both userId and toUserId are required." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId); // Logged-in userId
    const userIdOfVideo = new mongoose.Types.ObjectId(req.query.toUserId); // userId of video

    const [user, videos] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      Video.aggregate([
        {
          $match: {
            userId: userIdOfVideo,
            ...(req.query.userId === req.query.toUserId ? {} : { isBanned: false }),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        {
          $unwind: {
            path: "$song",
            preserveNullAndEmptyArrays: true, //to include documents with empty 'song' array (when songId is null)
          },
        },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashTagId",
            foreignField: "_id",
            as: "hashTag",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            let: { videoId: "$_id" },
            pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", userId] }] } } }],
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "videoId",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $addFields: {
            isLike: { $cond: { if: { $gt: [{ $size: "$likes" }, 0] }, then: true, else: false } },
            isSaved: { $cond: { if: { $in: [userId, { $ifNull: ["$savedBy", []] }] }, then: true, else: false } },
            totalLikes: { $size: "$totalLikes" },
            totalComments: { $size: "$comments" },
            totalViews: { $size: "$views" },
          },
        },
        {
          $project: {
            videoImage: 1,
            songId: 1,
            videoUrl: 1,
            assets: 1,
            processingStatus: 1,
            processingError: 1,
            caption: 1,
            isBanned: 1,
            hashTag: "$hashTag.hashTag",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            userIsFake: "$user.isFake",

            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",

            isLike: 1,
            isSaved: 1,
            totalLikes: 1,
            totalComments: 1,
            totalViews: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Videos of the particular user.",
      data: videos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//if isFakeData on then real+fake videos otherwise fake videos
exports.getAllVideos = async (req, res, next) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    let now = dayjs();

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    if (req.query.videoId) {
      const videoId = new mongoose.Types.ObjectId(req.query.videoId);

      const [user, video] = await Promise.all([User.findOne({ _id: userId }), Video.findById(videoId)]);

      if (!video) {
        return res.status(200).json({ status: false, message: "No video found with the provided ID." });
      }

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      const data = [
        {
          $match: { isBanned: false },
        },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        {
          $unwind: {
            path: "$song",
            preserveNullAndEmptyArrays: true, //to include documents with empty 'song' array (when songId is null)
          },
        },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashTagId",
            foreignField: "_id",
            as: "hashTag",
          },
        },
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
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "videoId",
            as: "totalComments",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            let: { videoId: "$_id", userId: user._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
                  },
                },
              },
            ],
            as: "likeHistory",
          },
        },
        {
          $lookup: {
            from: "followerfollowings",
            let: { postUserId: "$userId", requestingUserId: user._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$toUserId", "$$postUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                  },
                },
              },
            ],
            as: "isFollow",
          },
        },
        {
          $project: {
            caption: 1,
            videoImage: 1,
            videoUrl: 1,
            assets: 1,
            processingStatus: 1,
            processingError: 1,
            shareCount: 1,
            isFake: 1,
            songId: 1,
            createdAt: 1,

            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",

            hashTag: "$hashTag.hashTag",

            userIsFake: "$user.isFake",
            isProfileImageBanned: "$user.isProfileImageBanned",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isVerified: "$user.isVerified",
            isLike: { $cond: { if: { $gt: [{ $size: "$likeHistory" }, 0] }, then: true, else: false } },
            isFollow: { $cond: { if: { $gt: [{ $size: "$isFollow" }, 0] }, then: true, else: false } },
            isSaved: { $cond: { if: { $in: [userId, { $ifNull: ["$savedBy", []] }] }, then: true, else: false } },
            totalLikes: { $size: "$totalLikes" },
            totalComments: { $size: "$totalComments" },
            time: {
              $let: {
                vars: {
                  timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
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
      ];

      if (settingJSON.isFakeData) {
        const [realVideoOfUser, fakeVideoOfUser] = await Promise.all([Video.aggregate([{ $match: { isFake: false } }, ...data]), Video.aggregate([{ $match: { isFake: true } }, ...data])]);

        let allVideos = [...realVideoOfUser, ...fakeVideoOfUser];

        //Sort allVideos by createdAt date
        //allVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allVideos = allVideos.sort(() => 0.5 - Math.random());

        const videoIndex = allVideos.findIndex((short) => short._id.toString() === videoId.toString());

        //If the videoId is found, move it to the 0th index
        if (videoIndex !== -1) {
          const [movedVideo] = allVideos.splice(videoIndex, 1);
          allVideos.unshift(movedVideo);
        }

        const adjustedStart = videoIndex !== -1 ? 1 : start;

        allVideos = allVideos.slice(adjustedStart - 1, adjustedStart - 1 + limit);

        return res.status(200).json({
          status: true,
          message: "Retrieve the videos uploaded by users.",
          data: allVideos,
        });
      } else {
        let realVideoOfUser = await Video.aggregate([{ $match: { isFake: false } }, ...data]);

        //Sort videos by createdAt date
        //realVideoOfUser.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        realVideoOfUser = realVideoOfUser.sort(() => 0.5 - Math.random());

        const videoIndex = realVideoOfUser.findIndex((short) => short._id.toString() === videoId.toString());

        //If the videoId is found, move it to the 0th index
        if (videoIndex !== -1) {
          const [movedVideo] = realVideoOfUser.splice(videoIndex, 1);
          realVideoOfUser.unshift(movedVideo);
        }

        const adjustedStart = videoIndex !== -1 ? 1 : start;

        realVideoOfUser = realVideoOfUser.slice(adjustedStart - 1, adjustedStart - 1 + limit);

        return res.status(200).json({
          status: true,
          message: "Retrieve the videos uploaded by users.",
          data: realVideoOfUser,
        });
      }
    } else {
      const userId = new mongoose.Types.ObjectId(req.query.userId);

      const user = await User.findOne({ _id: userId }).lean();
      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }
      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      // Production optimization:
      // - paginate at DB level (skip/limit) instead of loading full feed then slicing
      // - stable sort by recency (createdAt desc) for cacheability and deterministic UX
      const baseMatch = {
        isBanned: false,
        ...(settingJSON.isFakeData ? {} : { isFake: false }),
      };

      const paginatedVideos = await Video.aggregate([
        { $match: baseMatch },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        {
          $unwind: {
            path: "$song",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashTagId",
            foreignField: "_id",
            as: "hashTag",
          },
        },
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
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "videoId",
            as: "totalComments",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            let: { videoId: "$_id", userId: user._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
                  },
                },
              },
            ],
            as: "likeHistory",
          },
        },
        {
          $lookup: {
            from: "followerfollowings",
            let: { postUserId: "$userId", requestingUserId: user._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$toUserId", "$$postUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                  },
                },
              },
            ],
            as: "isFollow",
          },
        },
        {
          $project: {
            caption: 1,
            videoImage: 1,
            videoUrl: 1,
            assets: 1,
            processingStatus: 1,
            processingError: 1,
            videoTime: 1,
            shareCount: 1,
            isFake: 1,
            songId: 1,
            createdAt: 1,
            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",
            hashTag: "$hashTag.hashTag",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isVerified: "$user.isVerified",
            userIsFake: "$user.isFake",
            isProfileImageBanned: "$user.isProfileImageBanned",
            isLike: { $cond: { if: { $gt: [{ $size: "$likeHistory" }, 0] }, then: true, else: false } },
            isFollow: { $cond: { if: { $gt: [{ $size: "$isFollow" }, 0] }, then: true, else: false } },
            isSaved: { $cond: { if: { $in: [userId, { $ifNull: ["$savedBy", []] }] }, then: true, else: false } },
            totalLikes: { $size: "$totalLikes" },
            totalComments: { $size: "$totalComments" },
          },
        },
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrieve the videos uploaded by users.",
        data: paginatedVideos,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

// Lightweight reels feed (metadata-first, cursor-ready).
// GET /client/video/getReelsFeedLite?userId=...&limit=20&cursorCreatedAt=...&cursorId=...
exports.getReelsFeedLite = async (req, res) => {
  try {
    console.log("[REELS_FEED][REQ]", {
      userId: req.query.userId,
      start: req.query.start,
      limit: req.query.limit,
      cursorCreatedAt: req.query.cursorCreatedAt || null,
      cursorId: req.query.cursorId || null,
      videoId: req.query.videoId || null,
    });
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
    const start = Math.max(parseInt(req.query.start || "1", 10), 1);
    const cursorCreatedAt = req.query.cursorCreatedAt ? new Date(req.query.cursorCreatedAt) : null;
    const cursorId = req.query.cursorId && mongoose.Types.ObjectId.isValid(req.query.cursorId)
      ? new mongoose.Types.ObjectId(req.query.cursorId)
      : null;
    const requestedVideoId = req.query.videoId && mongoose.Types.ObjectId.isValid(req.query.videoId)
      ? new mongoose.Types.ObjectId(req.query.videoId)
      : null;

    const user = await User.findOne({ _id: userId }).select("_id isBlock").lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }
    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    const baseMatch = {
      isBanned: false,
      ...(settingJSON.isFakeData ? {} : { isFake: false }),
    };

    if (req.query.videoId && !requestedVideoId) {
      return res.status(400).json({ status: false, message: "Invalid videoId format." });
    }
    if (requestedVideoId) {
      baseMatch._id = requestedVideoId;
    }

    // Cursor pagination: (createdAt desc, _id desc)
    if (!requestedVideoId && cursorCreatedAt && cursorId) {
      baseMatch.$or = [
        { createdAt: { $lt: cursorCreatedAt } },
        { createdAt: cursorCreatedAt, _id: { $lt: cursorId } },
      ];
    }

    const videos = await Video.aggregate([
      { $match: baseMatch },
      { $sort: { createdAt: -1, _id: -1 } },
      ...(!requestedVideoId && !(cursorCreatedAt && cursorId) ? [{ $skip: (start - 1) * limit }] : []),
      { $limit: limit + 1 }, // fetch one extra to determine hasMore
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "songs",
          localField: "songId",
          foreignField: "_id",
          as: "song",
        },
      },
      { $unwind: { path: "$song", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "likehistoryofpostorvideos",
          let: { videoId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$videoId", "$$videoId"] } } },
            { $count: "count" },
          ],
          as: "totalLikesAgg",
        },
      },
      {
        $lookup: {
          from: "postorvideocomments",
          let: { videoId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$videoId", "$$videoId"] } } },
            { $count: "count" },
          ],
          as: "totalCommentsAgg",
        },
      },
      {
        $lookup: {
          from: "likehistoryofpostorvideos",
          let: { videoId: "$_id", userId: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "likeHistory",
        },
      },
      {
        $lookup: {
          from: "followerfollowings",
          let: { postUserId: "$userId", requestingUserId: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$toUserId", "$$postUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "isFollowAgg",
        },
      },
      {
        $project: {
          caption: 1,
          videoImage: 1,
          videoUrl: 1,
          assets: 1,
          processingStatus: 1,
          processingError: 1,
          videoTime: 1,
          createdAt: 1,
          userId: "$user._id",
          name: "$user.name",
          userName: "$user.userName",
          userImage: "$user.image",
          isVerified: "$user.isVerified",
          userIsFake: "$user.isFake",
          isProfileImageBanned: "$user.isProfileImageBanned",
          songId: 1,
          songTitle: "$song.songTitle",
          songImage: "$song.songImage",
          songLink: "$song.songLink",
          singerName: "$song.singerName",
          isLike: { $gt: [{ $size: "$likeHistory" }, 0] },
          isFollow: { $gt: [{ $size: "$isFollowAgg" }, 0] },
          isSaved: { $in: [userId, { $ifNull: ["$savedBy", []] }] },
          totalLikes: {
            $ifNull: [{ $arrayElemAt: ["$totalLikesAgg.count", 0] }, 0],
          },
          totalComments: {
            $ifNull: [{ $arrayElemAt: ["$totalCommentsAgg.count", 0] }, 0],
          },
          totalShares: "$shareCount",
        },
      },
    ]);

    const hasMore = videos.length > limit;
    const items = hasMore ? videos.slice(0, limit) : videos;
    const lastItem = items.length > 0 ? items[items.length - 1] : null;

    const responsePayload = {
      status: true,
      message: "Retrieve the videos uploaded by users.",
      data: items,
      paging: {
        hasMore,
        nextCursorCreatedAt: hasMore ? lastItem.createdAt : null,
        nextCursorId: hasMore ? lastItem._id : null,
      },
    };
    console.log("[REELS_FEED][OK]", {
      count: items.length,
      hasMore,
      ids: items.map((v) => String(v._id || "")),
    });
    return res.status(200).json(responsePayload);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//delete video of the particular user
exports.deleteVideoOfUser = async (req, res) => {
  try {
    if (!req.query.videoId || !req.query.userId) {
      return res.status(200).json({ status: false, message: "videoId and userId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [user, video] = await Promise.all([User.findOne({ _id: userId, isFake: false }), Video.findOne({ _id: videoId, userId: userId, isFake: false })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found for that user." });
    }

    res.status(200).json({ status: true, message: "Video has been deleted by the user." });

    if (video?.videoImage) {
      await deleteFromStorage(video?.videoImage);
    }

    if (video?.videoUrl) {
      await deleteFromStorage(video?.videoUrl);
    }

    await Promise.all([
      LikeHistoryOfPostOrVideo.deleteMany({ videoId: video._id }),
      PostOrVideoComment.deleteMany({ videoId: video._id }),
      LikeHistoryOfpostOrvideoComment.deleteMany({ videoId: video._id }),
      WatchHistory.deleteMany({ videoId: video._id }),
      HashTagUsageHistory.deleteMany({ videoId: video._id }),
      Notification.deleteMany({ $or: [{ otherUserId: video?.userId }, { userId: video?.userId }] }),
      Report.deleteMany({ videoId: video._id }),
      Video.deleteOne({ _id: video._id }),
    ]);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

//like or dislike of particular video by the particular user
exports.likeOrDislikeOfVideo = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [user, video, alreadylikedVideo] = await Promise.all([
      User.findOne({ _id: userId }),
      Video.findById(videoId),
      LikeHistoryOfPostOrVideo.findOne({
        userId: userId,
        videoId: videoId,
      }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found." });
    }

    if (alreadylikedVideo) {
      await LikeHistoryOfPostOrVideo.deleteOne({
        userId: user._id,
        videoId: video._id,
      });

      return res.status(200).json({
        status: true,
        message: "The Video was marked with a dislike by the user.",
        isLike: false,
      });
    } else {
      console.log("else");

      const likeHistory = new LikeHistoryOfPostOrVideo();

      likeHistory.userId = user._id;
      likeHistory.videoId = video._id;
      likeHistory.uploaderId = video.userId;
      await likeHistory.save();

      res.status(200).json({
        status: true,
        message: "The Video was marked with a like by the user.",
        isLike: true,
      });

      const videoUser = await User.findOne({ _id: video.userId }).lean();

      //checks if the user has an fcmToken
      if (videoUser && videoUser.fcmToken && videoUser.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: videoUser?.fcmToken,
          notification: {
            title: "🔔 Video Liked Alert! 🔔",
            body: "Hey there! A user has just liked your video. Check it out now!",
          },
          data: {
            type: "VIDEOLIKE",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);

            const notification = new Notification();
            notification.userId = userId; //login userId i.e, to whom notification send
            notification.otherUserId = videoUser._id;
            notification.title = "🔔 Video Liked Alert! 🔔";
            notification.message = "Hey there! A user has just liked your video. Check it out now!";
            notification.image = video.videoImage;
            notification.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            await notification.save();
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//when user share the video then shareCount of the particular video increased
exports.shareCountOfVideo = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [user, video] = await Promise.all([User.findOne({ _id: userId }), Video.findById(videoId)]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found." });
    }

    video.shareCount += 1;
    await video.save();

    return res.status(200).json({ status: true, message: "video has been shared by the user then shareCount has been increased.", video });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete video
exports.deleteParticularVideo = async (req, res) => {
  try {
    if (!req.query.videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required." });
    }

    const video = await Video.findById(req.query.videoId);
    if (!video) {
      return res.status(200).json({ status: false, message: "No video found with the provided ID." });
    }

    res.status(200).json({ status: true, message: "Success." });

    if (video?.videoImage) {
      await deleteFromStorage(video?.videoImage);
    }

    if (video?.videoUrl) {
      await deleteFromStorage(video?.videoUrl);
    }

    await Promise.all([
      LikeHistoryOfPostOrVideo.deleteMany({ videoId: video._id }),
      PostOrVideoComment.deleteMany({ videoId: video._id }),
      LikeHistoryOfpostOrvideoComment.deleteMany(),
      WatchHistory.deleteMany({ videoId: video._id }),
      HashTagUsageHistory.deleteMany({ videoId: video._id }),
      Report.deleteMany({ videoId: video._id }),
      Notification.deleteMany({ otherUserId: video?.userId }),
      Video.deleteOne({ _id: video._id }),
    ]);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get videos of the particular song by particular user
exports.fetchVideosOfParticularSong = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.songId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const songId = new mongoose.Types.ObjectId(req.query.songId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [user, song, totalVideosOfSong, videos] = await Promise.all([
      User.findOne({ _id: userId }).lean(),
      Song.findOne({ _id: songId }).lean(),
      Video.countDocuments({ songId: songId }),
      Video.aggregate([
        { $match: { songId: songId } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        { $unwind: { path: "$song", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashTagId",
            foreignField: "_id",
            as: "hashTag",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            let: { videoId: "$_id" },
            pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", userId] }] } } }],
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "videoId",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $addFields: {
            isLike: { $cond: { if: { $gt: [{ $size: "$likes" }, 0] }, then: true, else: false } },
            isSaved: { $cond: { if: { $in: [userId, { $ifNull: ["$savedBy", []] }] }, then: true, else: false } },
            totalLikes: { $size: "$totalLikes" },
            totalComments: { $size: "$comments" },
            totalViews: { $size: "$views" },
          },
        },
        {
          $project: {
            videoImage: 1,
            videoUrl: 1,
            assets: 1,
            processingStatus: 1,
            processingError: 1,
            caption: 1,
            isBanned: 1,
            isLike: 1,
            isSaved: 1,
            totalLikes: 1,
            totalComments: 1,
            totalViews: 1,
            songId: 1,
            createdAt: 1,
            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",
            hashTag: "$hashTag.hashTag",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            userIsFake: "$user.isFake",
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit }, //how many records you want to skip
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (!song) {
      return res.status(200).json({ status: false, message: "Song does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive videos with the use of that song.",
      totalVideosOfSong: totalVideosOfSong,
      videos: videos,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get particular user's videos ( web )
exports.fetchUserVideos = async (req, res, next) => {
  try {
    if (!req.query.toUserId) {
      return res.status(200).json({ status: false, message: "toUserId must be required." });
    }

    if (req.query.userId) {
      const userId = new mongoose.Types.ObjectId(req.query.userId); // Logged-in userId
      const userIdOfVideo = new mongoose.Types.ObjectId(req.query.toUserId); // userId of video

      const [user, videos] = await Promise.all([
        User.findOne({ _id: userId }).select("_id isBlock").lean(),
        Video.aggregate([
          {
            $match: {
              userId: userIdOfVideo,
              ...(req.query.userId === req.query.toUserId ? {} : { isBanned: false }),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
          {
            $lookup: {
              from: "songs",
              localField: "songId",
              foreignField: "_id",
              as: "song",
            },
          },
          {
            $unwind: {
              path: "$song",
              preserveNullAndEmptyArrays: true, //to include documents with empty 'song' array (when songId is null)
            },
          },
          {
            $lookup: {
              from: "hashtags",
              localField: "hashTagId",
              foreignField: "_id",
              as: "hashTag",
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideos",
              let: { videoId: "$_id" },
              pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", userId] }] } } }],
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideos",
              localField: "_id",
              foreignField: "videoId",
              as: "totalLikes",
            },
          },
          {
            $lookup: {
              from: "postorvideocomments",
              localField: "_id",
              foreignField: "videoId",
              as: "comments",
            },
          },
          {
            $lookup: {
              from: "watchhistories",
              localField: "_id",
              foreignField: "videoId",
              as: "views",
            },
          },
          {
            $addFields: {
              isLike: { $cond: { if: { $gt: [{ $size: "$likes" }, 0] }, then: true, else: false } },
              isSaved: { $cond: { if: { $in: [userId, { $ifNull: ["$savedBy", []] }] }, then: true, else: false } },
              totalLikes: { $size: "$totalLikes" },
              totalComments: { $size: "$comments" },
              totalViews: { $size: "$views" },
            },
          },
          {
            $project: {
              videoImage: 1,
              songId: 1,
              videoUrl: 1,
              assets: 1,
              processingStatus: 1,
              processingError: 1,
              caption: 1,
              isBanned: 1,
              hashTag: "$hashTag.hashTag",
              userId: "$user._id",
              isProfileImageBanned: "$user.isProfileImageBanned",
              name: "$user.name",
              userName: "$user.userName",
              userImage: "$user.image",
              userIsFake: "$user.isFake",

              songTitle: "$song.songTitle",
              songImage: "$song.songImage",
              songLink: "$song.songLink",
              singerName: "$song.singerName",

              isLike: 1,
              isSaved: 1,
              totalLikes: 1,
              totalComments: 1,
              totalViews: 1,
              createdAt: 1,
            },
          },
          { $sort: { createdAt: -1 } },
        ]),
      ]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "You are blocked by the admin." });
      }

      return res.status(200).json({
        status: true,
        message: "Videos of the particular user.",
        data: videos,
      });
    } else {
      const userIdOfVideo = new mongoose.Types.ObjectId(req.query.toUserId); // userId of video

      const [toUser, videos] = await Promise.all([
        User.findOne({ _id: userIdOfVideo }).select("_id isBlock").lean(),
        Video.aggregate([
          {
            $match: {
              userId: userIdOfVideo,
              isBanned: false,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
          {
            $lookup: {
              from: "songs",
              localField: "songId",
              foreignField: "_id",
              as: "song",
            },
          },
          {
            $unwind: {
              path: "$song",
              preserveNullAndEmptyArrays: true, //to include documents with empty 'song' array (when songId is null)
            },
          },
          {
            $lookup: {
              from: "hashtags",
              localField: "hashTagId",
              foreignField: "_id",
              as: "hashTag",
            },
          },
          {
            $lookup: {
              from: "likehistoryofpostorvideos",
              localField: "_id",
              foreignField: "videoId",
              as: "totalLikes",
            },
          },
          {
            $lookup: {
              from: "postorvideocomments",
              localField: "_id",
              foreignField: "videoId",
              as: "comments",
            },
          },
          {
            $lookup: {
              from: "watchhistories",
              localField: "_id",
              foreignField: "videoId",
              as: "views",
            },
          },
          {
            $addFields: {
              totalLikes: { $size: "$totalLikes" },
              totalComments: { $size: "$comments" },
              totalViews: { $size: "$views" },
            },
          },
          {
            $project: {
              videoImage: 1,
              songId: 1,
              videoUrl: 1,
              assets: 1,
              processingStatus: 1,
              processingError: 1,
              caption: 1,
              isBanned: 1,
              hashTag: "$hashTag.hashTag",
              userId: "$user._id",
              isProfileImageBanned: "$user.isProfileImageBanned",
              name: "$user.name",
              userName: "$user.userName",
              userImage: "$user.image",
              userIsFake: "$user.isFake",

              songTitle: "$song.songTitle",
              songImage: "$song.songImage",
              songLink: "$song.songLink",
              singerName: "$song.singerName",

              totalLikes: 1,
              totalComments: 1,
              totalViews: 1,
              createdAt: 1,
            },
          },
          { $sort: { createdAt: -1 } },
        ]),
      ]);

      if (!toUser) {
        return res.status(200).json({ status: false, message: "User not found." });
      }

      if (toUser.isBlock) {
        return res.status(200).json({ status: false, message: "You are blocked by the admin." });
      }

      return res.status(200).json({
        status: true,
        message: "Videos of the particular user.",
        data: videos,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//if isFakeData on then real+fake videos otherwise fake videos ( web )
exports.getVideoLibrary = async (req, res, next) => {
  try {
    let now = dayjs();

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    if (req.query.userId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
        return res.status(200).json({
          status: false,
          message: "Invalid userId format. It must be a valid ObjectId.",
        });
      }

      const userId = new mongoose.Types.ObjectId(req.query.userId);

      const user = await User.findOne({ _id: userId }).select("_id isBlock").lean();

      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by the admin." });
      }

      const data = [
        {
          $match: { isBanned: false },
        },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        {
          $unwind: {
            path: "$song",
            preserveNullAndEmptyArrays: true, //to include documents with empty 'song' array (when songId is null)
          },
        },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashTagId",
            foreignField: "_id",
            as: "hashTag",
          },
        },
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
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "videoId",
            as: "totalComments",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikes",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            let: { videoId: "$_id", userId: user._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
                  },
                },
              },
            ],
            as: "likeHistory",
          },
        },
        {
          $lookup: {
            from: "followerfollowings",
            let: { postUserId: "$userId", requestingUserId: user._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$toUserId", "$$postUserId"] }, { $eq: ["$fromUserId", "$$requestingUserId"] }],
                  },
                },
              },
            ],
            as: "isFollow",
          },
        },
        {
          $project: {
            caption: 1,
            videoImage: 1,
            videoUrl: 1,
            assets: 1,
            processingStatus: 1,
            processingError: 1,
            shareCount: 1,
            isFake: 1,
            songId: 1,
            createdAt: 1,

            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",

            hashTag: "$hashTag.hashTag",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isVerified: "$user.isVerified",
            userIsFake: "$user.isFake",
            isProfileImageBanned: "$user.isProfileImageBanned",
            isLike: { $cond: { if: { $gt: [{ $size: "$likeHistory" }, 0] }, then: true, else: false } },
            isFollow: { $cond: { if: { $gt: [{ $size: "$isFollow" }, 0] }, then: true, else: false } },
            isSaved: { $cond: { if: { $in: [userId, { $ifNull: ["$savedBy", []] }] }, then: true, else: false } },
            totalLikes: { $size: "$totalLikes" },
            totalComments: { $size: "$totalComments" },
            time: {
              $let: {
                vars: {
                  timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
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
      ];

      let totalVideos, allVideos;
      if (settingJSON.isFakeData) {
        const [total, realVideoOfUser, fakeVideoOfUser] = await Promise.all([
          Video.countDocuments({ isBanned: false }),
          Video.aggregate([{ $match: { isFake: false } }, ...data]),
          Video.aggregate([{ $match: { isFake: true } }, ...data]),
        ]);

        totalVideos = total;
        allVideos = [...realVideoOfUser, ...fakeVideoOfUser];

        allVideos = allVideos.sort(() => 0.5 - Math.random());
      } else {
        [totalVideos, allVideos] = await Promise.all([Video.countDocuments({ isBanned: false }), Video.aggregate([{ $match: { isFake: false } }, ...data])]);

        allVideos = allVideos.sort(() => 0.5 - Math.random());
      }

      const paginatedVideos = allVideos.slice((start - 1) * limit, start * limit);

      return res.status(200).json({
        status: true,
        message: "Retrieve the videos uploaded by users.",
        total: totalVideos,
        data: paginatedVideos,
      });
    } else {
      const data = [
        {
          $match: { isBanned: false },
        },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        {
          $unwind: {
            path: "$song",
            preserveNullAndEmptyArrays: true, //to include documents with empty 'song' array (when songId is null)
          },
        },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashTagId",
            foreignField: "_id",
            as: "hashTag",
          },
        },
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
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "videoId",
            as: "totalComments",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikes",
          },
        },
        {
          $project: {
            caption: 1,
            videoImage: 1,
            videoUrl: 1,
            assets: 1,
            processingStatus: 1,
            processingError: 1,
            shareCount: 1,
            isFake: 1,
            songId: 1,
            createdAt: 1,

            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",

            hashTag: "$hashTag.hashTag",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isVerified: "$user.isVerified",
            userIsFake: "$user.isFake",
            isProfileImageBanned: "$user.isProfileImageBanned",
            totalLikes: { $size: "$totalLikes" },
            totalComments: { $size: "$totalComments" },
            time: {
              $let: {
                vars: {
                  timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
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
      ];

      let totalVideos, allVideos;
      if (settingJSON.isFakeData) {
        const [total, realVideoOfUser, fakeVideoOfUser] = await Promise.all([
          Video.countDocuments({ isBanned: false }),
          Video.aggregate([{ $match: { isFake: false } }, ...data]),
          Video.aggregate([{ $match: { isFake: true } }, ...data]),
        ]);

        totalVideos = total;
        allVideos = [...realVideoOfUser, ...fakeVideoOfUser];

        allVideos = allVideos.sort(() => 0.5 - Math.random());
      } else {
        [totalVideos, allVideos] = await Promise.all([Video.countDocuments({ isBanned: false }), Video.aggregate([{ $match: { isFake: false } }, ...data])]);

        allVideos = allVideos.sort(() => 0.5 - Math.random());
      }

      const paginatedVideos = allVideos.slice((start - 1) * limit, start * limit);

      return res.status(200).json({
        status: true,
        message: "Retrieve the videos uploaded by users.",
        total: totalVideos,
        data: paginatedVideos,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Sever Error" });
  }
};

// GET /client/video/getVideoById/:videoId
// Returns a single, fully-populated video document. Used by deep-link handler.
exports.getVideoById = async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!req.query.userId || !videoId) {
      return res.status(400).json({ status: false, message: "userId and videoId are required." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const vidId = new mongoose.Types.ObjectId(videoId);

    const [user, videos] = await Promise.all([
      User.findById(userId).lean(),
      Video.aggregate([
        { $match: { _id: vidId } },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        { $unwind: { path: "$song", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "hashtags",
            localField: "hashTagId",
            foreignField: "_id",
            as: "hashTag",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            let: { videoId: "$_id", userId: userId },
            pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }] } } }],
            as: "likeHistory",
          },
        },
        {
          $lookup: {
            from: "likehistoryofpostorvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "totalLikesArr",
          },
        },
        {
          $lookup: {
            from: "postorvideocomments",
            localField: "_id",
            foreignField: "videoId",
            as: "commentsArr",
          },
        },
        {
          $project: {
            caption: 1,
            videoImage: 1,
            videoUrl: 1,
            assets: 1,
            processingStatus: 1,
            processingError: 1,
            shareCount: 1,
            isFake: 1,
            songId: 1,
            createdAt: 1,
            songTitle: "$song.songTitle",
            songImage: "$song.songImage",
            songLink: "$song.songLink",
            singerName: "$song.singerName",
            hashTag: "$hashTag.hashTag",
            userId: "$user._id",
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            isVerified: "$user.isVerified",
            isLike: { $cond: { if: { $gt: [{ $size: "$likeHistory" }, 0] }, then: true, else: false } },
            isSaved: { $cond: { if: { $in: [userId, { $ifNull: ["$savedBy", []] }] }, then: true, else: false } },
            totalLikes: { $size: "$totalLikesArr" },
            totalComments: { $size: "$commentsArr" },
          },
        },
      ]),
    ]);

    if (!user) return res.status(200).json({ status: false, message: "User not found." });
    if (user.isBlock) return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    if (!videos || videos.length === 0) return res.status(200).json({ status: false, message: "Video not found." });

    return res.status(200).json({ status: true, message: "Video retrieved successfully.", data: videos[0] });
  } catch (error) {
    console.error("getVideoById error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
