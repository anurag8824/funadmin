const mongoose = require("mongoose");

const { STORY_TYPE, STORY_MEDIA_TYPE } = require("../types/constant");

const storySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The owner of the story
    backgroundSong: { type: mongoose.Schema.Types.ObjectId, ref: "Song", default: null }, // Song used in the story
    storyMediaType: { type: Number, enum: STORY_MEDIA_TYPE },
    storyType: { type: Number, enum: STORY_TYPE },
    mediaImageUrl: { type: String, default: "" }, // If it's an image story
    mediaVideoUrl: { type: String, default: "" }, // If it's a video story
    duration: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    reactionsCount: { type: Number, default: 0 },
    isFake: { type: Boolean, default: false },
    expiresAt: { type: Date, expires: 0 }, // TTL field: story auto-deletes after 24 hours
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Story", storySchema);
