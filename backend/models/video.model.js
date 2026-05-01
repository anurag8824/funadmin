const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    uniqueVideoId: { type: String, unique: true, trim: true, default: "" },
    caption: { type: String, default: "" },

    videoTime: { type: Number, min: 0 }, //that value always save in seconds
    videoUrl: { type: String, default: "" },
    videoImage: { type: String, default: "" },

    location: { type: String, default: "" },
    locationCoordinates: {
      latitude: { type: String, default: "" },
      longitude: { type: String, default: "" },
    },

    hashTagId: [{ type: mongoose.Schema.Types.ObjectId, ref: "HashTag", default: [] }],
    songId: { type: mongoose.Schema.Types.ObjectId, ref: "Song", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    shareCount: { type: Number, default: 0 }, //when user share the video then shareCount increased
    isFake: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    processingStatus: {
      type: String,
      enum: ["uploading", "processing", "ready", "degraded", "failed"],
      default: "ready",
      index: true,
    },
    processingError: { type: String, default: "" },
    assets: {
      hlsMasterUrl: { type: String, default: "" },
      hlsVariants: {
        hls1080Url: { type: String, default: "" },
        hls720Url: { type: String, default: "" },
        hls480Url: { type: String, default: "" },
      },
      mp4_1080_url: { type: String, default: "" },
      mp4_720_url: { type: String, default: "" },
      mp4_480_url: { type: String, default: "" },
      thumbUrl: { type: String, default: "" },
      previewUrl: { type: String, default: "" },
    },

    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

videoSchema.index({ hashTagId: 1 });
videoSchema.index({ userId: 1 });
videoSchema.index({ songId: 1 });
videoSchema.index({ isFake: 1 });
videoSchema.index({ isBanned: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ isBanned: 1, isFake: 1, createdAt: -1 });

module.exports = mongoose.model("Video", videoSchema);
