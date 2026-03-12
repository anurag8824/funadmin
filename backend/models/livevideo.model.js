const mongoose = require("mongoose");

const livevideoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    liveStreamMode: { type: Number, enum: [1, 2, 3] }, // 1.normal-live, 2.pk-live

    thumbnailType: { type: Number, enum: [0, 1, 2] }, // 1.link, 2.file ( thumbnail )
    mediaSourceKind: { type: Number, enum: [0, 1, 2] }, // 1.link, 2.file ( video )

    pkPreviewImages: { type: Array, default: [] },
    pkMediaSources: { type: Array, default: [] },

    videoImage: { type: String, default: "" },
    videoUrl: { type: String, default: "" },

    videoTime: { type: Number, min: 0 }, //in seconds
    isLive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

livevideoSchema.index({ userId: 1 });
livevideoSchema.index({ createdAt: -1 });
livevideoSchema.index({ isLive: 1 });

module.exports = mongoose.model("Livevideo", livevideoSchema);
