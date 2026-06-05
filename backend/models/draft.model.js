const mongoose = require("mongoose");

const draftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mediaType: {
      type: String,
      enum: ["reel", "story"],
      default: "reel",
    },
    videoUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    caption: { type: String, default: "" },
    hashtags: [
      { type: mongoose.Schema.Types.ObjectId, ref: "HashTag", default: [] },
    ],
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      default: null,
    },
    overlayData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    filterApplied: { type: String, default: "normal" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

draftSchema.index({ userId: 1, createdAt: -1 });
draftSchema.index({ mediaType: 1 });

module.exports = mongoose.model("Draft", draftSchema);
