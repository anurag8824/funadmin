const mongoose = require("mongoose");

const reelAnalyticsEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", index: true },
    type: { type: String, required: true, index: true },
    ts: { type: Number, default: () => Date.now() },
    properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reelAnalyticsEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ReelAnalyticsEvent", reelAnalyticsEventSchema);
