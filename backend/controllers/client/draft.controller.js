const Draft = require("../../models/draft.model");

// Save or update a draft
exports.saveDraft = async (req, res) => {
  try {
    const { userId, draftId, mediaType, videoUrl, thumbnailUrl, caption, hashtags, songId, overlayData, filterApplied } = req.body;

    if (!userId) {
      return res.status(400).json({ status: false, message: "userId is required" });
    }

    let draft;
    if (draftId) {
      draft = await Draft.findOneAndUpdate(
        { _id: draftId, userId },
        {
          ...(mediaType && { mediaType }),
          ...(videoUrl !== undefined && { videoUrl }),
          ...(thumbnailUrl !== undefined && { thumbnailUrl }),
          ...(caption !== undefined && { caption }),
          ...(hashtags && { hashtags }),
          ...(songId !== undefined && { songId }),
          ...(overlayData !== undefined && { overlayData }),
          ...(filterApplied !== undefined && { filterApplied }),
        },
        { new: true }
      );

      if (!draft) {
        return res.status(404).json({ status: false, message: "Draft not found" });
      }
    } else {
      draft = await Draft.create({
        userId,
        mediaType: mediaType || "reel",
        videoUrl: videoUrl || "",
        thumbnailUrl: thumbnailUrl || "",
        caption: caption || "",
        hashtags: hashtags || [],
        songId: songId || null,
        overlayData: overlayData || {},
        filterApplied: filterApplied || "normal",
      });
    }

    return res.status(200).json({
      status: true,
      message: draftId ? "Draft updated successfully" : "Draft saved successfully",
      data: draft,
    });
  } catch (error) {
    console.error("saveDraft error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Get all drafts for a user
exports.getDrafts = async (req, res) => {
  try {
    const { userId, mediaType } = req.query;

    if (!userId) {
      return res.status(400).json({ status: false, message: "userId is required" });
    }

    const filter = { userId };
    if (mediaType) {
      filter.mediaType = mediaType;
    }

    const drafts = await Draft.find(filter)
      .populate("songId", "songTitle singerName songImage songTime")
      .populate("hashtags", "hashTag hashTagIcon")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      status: true,
      message: "Drafts fetched successfully",
      data: drafts,
    });
  } catch (error) {
    console.error("getDrafts error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Delete a draft
exports.deleteDraft = async (req, res) => {
  try {
    const { userId, draftId } = req.query;

    if (!userId || !draftId) {
      return res.status(400).json({ status: false, message: "userId and draftId are required" });
    }

    const draft = await Draft.findOneAndDelete({ _id: draftId, userId });

    if (!draft) {
      return res.status(404).json({ status: false, message: "Draft not found" });
    }

    return res.status(200).json({
      status: true,
      message: "Draft deleted successfully",
      data: draft,
    });
  } catch (error) {
    console.error("deleteDraft error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Update specific fields of a draft
exports.updateDraft = async (req, res) => {
  try {
    const { draftId, userId, ...fieldsToUpdate } = req.body;

    if (!draftId || !userId) {
      return res.status(400).json({ status: false, message: "draftId and userId are required" });
    }

    const draft = await Draft.findOneAndUpdate(
      { _id: draftId, userId },
      fieldsToUpdate,
      { new: true }
    );

    if (!draft) {
      return res.status(404).json({ status: false, message: "Draft not found" });
    }

    return res.status(200).json({
      status: true,
      message: "Draft updated successfully",
      data: draft,
    });
  } catch (error) {
    console.error("updateDraft error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
