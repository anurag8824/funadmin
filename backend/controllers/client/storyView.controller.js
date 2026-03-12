const StoryView = require("../../models/storyView.model");

const mongoose = require("mongoose");

//get user's story viewers
exports.getStoryViewers = async (req, res) => {
  try {
    const { storyId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid storyId.",
      });
    }

    const viewers = await StoryView.aggregate([
      {
        $match: {
          storyId: new mongoose.Types.ObjectId(storyId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "viewer",
        },
      },
      { $unwind: "$viewer" },
      {
        $lookup: {
          from: "storyreactions",
          let: { storyId: "$storyId", userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$storyId", "$$storyId"] }, { $eq: ["$userId", "$$userId"] }],
                },
              },
            },
            {
              $project: {
                _id: 0,
                reaction: 1,
              },
            },
          ],
          as: "userReaction",
        },
      },
      {
        $addFields: {
          reaction: {
            $ifNull: [{ $arrayElemAt: ["$userReaction.reaction", 0] }, null],
          },
        },
      },

      {
        $project: {
          _id: 0,
          viewerId: "$viewer._id",
          name: "$viewer.name",
          userName: "$viewer.userName",
          image: "$viewer.image",
          isProfileImageBanned: "$viewer.isProfileImageBanned",
          viewedAt: "$createdAt",
          reaction: 1,
        },
      },
      {
        $sort: { viewedAt: -1 },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Story viewers fetched successfully.",
      viewers,
    });
  } catch (error) {
    console.error("getStoryViewers error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
    });
  }
};
