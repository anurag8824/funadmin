const Story = require("../../models/story.model");
const User = require("../../models/user.model");
const Song = require("../../models/song.model");

const mongoose = require("mongoose");

const { deleteFromStorage } = require("../../util/storageHelper");

// Upload Fake Story
exports.uploadFakeStory = async (req, res) => {
  try {
    console.log("uploadFakeStory req.body:", req.body);

    const { userId, storyType, backgroundSong, storyMediaType, mediaImageUrl, mediaVideoUrl, duration } = req.body;

    if (!userId) {
      if (mediaImageUrl) {
        await deleteFromStorage(mediaImageUrl);
      }

      if (mediaVideoUrl) {
        await deleteFromStorage(mediaVideoUrl);
      }

      return res.status(200).json({ status: false, message: "userId is required." });
    }

    if (!storyType) {
      if (mediaImageUrl) {
        await deleteFromStorage(mediaImageUrl);
      }

      if (mediaVideoUrl) {
        await deleteFromStorage(mediaVideoUrl);
      }

      return res.status(200).json({ status: false, message: "storyType is required." });
    }

    if (!storyMediaType) {
      if (mediaImageUrl) {
        await deleteFromStorage(mediaImageUrl);
      }

      if (mediaVideoUrl) {
        await deleteFromStorage(mediaVideoUrl);
      }

      return res.status(200).json({ status: false, message: "storyMediaType is required." });
    }

    const [user, bgSong] = await Promise.all([User.findOne({ _id: userId, isFake: true }), backgroundSong ? Song.findById(backgroundSong).select("_id") : null]);

    if (!user) {
      if (mediaImageUrl) {
        await deleteFromStorage(mediaImageUrl);
      }

      if (mediaVideoUrl) {
        await deleteFromStorage(mediaVideoUrl);
      }

      return res.status(200).json({ status: false, message: "Fake user not found." });
    }

    if (user.isBlock) {
      if (mediaImageUrl) {
        await deleteFromStorage(mediaImageUrl);
      }

      if (mediaVideoUrl) {
        await deleteFromStorage(mediaVideoUrl);
      }

      return res.status(403).json({ status: false, message: "User is blocked." });
    }

    if (backgroundSong && !bgSong) {
      if (mediaImageUrl) {
        await deleteFromStorage(mediaImageUrl);
      }

      if (mediaVideoUrl) {
        await deleteFromStorage(mediaVideoUrl);
      }

      return res.status(200).json({ status: false, message: "Background song not found." });
    }

    res.status(200).json({
      status: true,
      message: "Fake story uploaded successfully.",
    });

    const storyData = {
      user: user._id,
      storyType: storyType,
      storyMediaType: storyMediaType,
      duration: duration || 0,
      backgroundSong: bgSong ? bgSong._id : null,
      mediaImageUrl: mediaImageUrl || "",
      mediaVideoUrl: mediaVideoUrl || "",
      viewsCount: 0,
      reactionsCount: 0,
      isFake: true,
      expiresAt: null,
    };

    await new Story(storyData).save();
  } catch (error) {
    console.error("uploadFakeStory error:", error);

    if (req.body.mediaImageUrl) {
      await deleteFromStorage(req.body.mediaImageUrl);
    }

    if (req.body.mediaVideoUrl) {
      await deleteFromStorage(req.body.mediaVideoUrl);
    }

    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

// Update Fake Story
exports.updateFakeStory = async (req, res) => {
  try {
    const { storyMediaType, storyId, userId, storyType, backgroundSong, duration } = req.body;
    const mediaImageUrl = req.body.mediaImageUrl || "";
    const mediaVideoUrl = req.body.mediaVideoUrl || "";

    if (!storyId) {
      if (req.body.mediaImageUrl) {
        deleteFromStorage(req.body.mediaImageUrl);
      }

      if (req.body.mediaVideoUrl) {
        deleteFromStorage(req.body.mediaVideoUrl);
      }

      return res.status(200).json({ status: false, message: "storyId is required." });
    }

    const story = await Story.findOne({ _id: storyId, isFake: true });

    if (!story) {
      if (req.body.mediaImageUrl) {
        deleteFromStorage(req.body.mediaImageUrl);
      }

      if (req.body.mediaVideoUrl) {
        deleteFromStorage(req.body.mediaVideoUrl);
      }

      return res.status(200).json({ status: false, message: "Fake story not found." });
    }

    if (userId) {
      const user = await User.findOne({ _id: userId, isFake: true });
      if (!user) {
        if (req.body.mediaImageUrl) {
          deleteFromStorage(req.body.mediaImageUrl);
        }

        if (req.body.mediaVideoUrl) {
          deleteFromStorage(req.body.mediaVideoUrl);
        }

        return res.status(200).json({ status: false, message: "Fake user not found." });
      }

      if (user.isBlock) {
        if (req.body.mediaImageUrl) {
          deleteFromStorage(req.body.mediaImageUrl);
        }

        if (req.body.mediaVideoUrl) {
          deleteFromStorage(req.body.mediaVideoUrl);
        }

        return res.status(403).json({ status: false, message: "User is blocked." });
      }

      story.user = user._id;
    }

    if (storyMediaType !== undefined) story.storyMediaType = storyMediaType;
    if (storyType !== undefined) story.storyType = storyType;
    if (duration !== undefined) story.duration = duration;

    if (backgroundSong !== undefined) {
      if (backgroundSong) {
        const bgSong = await Song.findById(backgroundSong).select("_id");
        if (!bgSong) {
          if (req.body.mediaImageUrl) {
            deleteFromStorage(req.body.mediaImageUrl);
          }

          if (req.body.mediaVideoUrl) {
            deleteFromStorage(req.body.mediaVideoUrl);
          }

          return res.status(200).json({ status: false, message: "Background song not found." });
        }
        story.backgroundSong = bgSong._id;
      } else {
        story.backgroundSong = null;
      }
    }

    if (mediaImageUrl) {
      if (story.mediaImageUrl) {
        deleteFromStorage(story.mediaImageUrl);
      }

      story.mediaImageUrl = mediaImageUrl;
    }

    if (mediaVideoUrl) {
      if (story.mediaVideoUrl) {
        deleteFromStorage(story.mediaVideoUrl);
      }

      story.mediaVideoUrl = mediaVideoUrl;
    }

    await story.save();

    return res.status(200).json({
      status: true,
      message: "Fake story updated successfully.",
      data: story,
    });
  } catch (error) {
    console.error("updateFakeStory error:", error);

    if (req.body.mediaImageUrl) {
      deleteFromStorage(req.body.mediaImageUrl);
    }

    if (req.body.mediaVideoUrl) {
      deleteFromStorage(req.body.mediaVideoUrl);
    }

    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get all stories
exports.getAllStories = async (req, res) => {
  try {
    const { userId = "All", includeFake } = req.query;

    const matchFilter = includeFake === "true" ? { isFake: true } : { isFake: false };

    if (userId !== "All") {
      const user = await User.findOne({ _id: userId }, "_id isBlock");
      if (!user) {
        return res.status(200).json({ status: false, message: "User not found." });
      }
      if (user.isBlock) {
        return res.status(403).json({ status: false, message: "User is blocked." });
      }
      matchFilter.user = new mongoose.Types.ObjectId(userId);
    }

    console.log("matchFilter : ", matchFilter);

    const [total, allStories] = await Promise.all([
      Story.countDocuments(matchFilter),
      Story.aggregate([
        { $match: matchFilter },
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
          $project: {
            _id: 1,
            mediaImageUrl: 1,
            mediaVideoUrl: 1,
            viewsCount: 1,
            reactionsCount: 1,
            storyType: 1,
            storyMediaType: 1,
            duration: 1,
            createdAt: 1,
            user: {
              _id: "$user._id",
              name: "$user.name",
              userName: "$user.userName",
              image: "$user.image",
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
            createdAt: -1,
          },
        },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Stories fetched successfully.",
      total,
      story: allStories,
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Delete Story
exports.removeStory = async (req, res) => {
  try {
    const { storyId, userId } = req.body;

    if (!storyId || !userId) {
      return res.status(400).json({ status: false, message: "storyId and userId are required." });
    }

    const story = await Story.findOne({ _id: storyId });

    if (!story) {
      return res.status(404).json({ status: false, message: "Story not found." });
    }

    if (String(story.user) !== String(userId)) {
      return res.status(403).json({ status: false, message: "You are not authorized to delete this story." });
    }

    if (story.mediaImageUrl) {
      deleteFromStorage(story.mediaImageUrl);
    }

    if (story.mediaVideoUrl) {
      deleteFromStorage(story.mediaVideoUrl);
    }

    await Story.deleteOne({ _id: storyId });

    return res.status(200).json({
      status: true,
      message: "Story deleted successfully.",
    });
  } catch (error) {
    console.error("deleteStory error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
