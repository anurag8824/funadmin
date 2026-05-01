const mongoose = require("mongoose");

const reelUploadJobSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sourceUrl: { type: String, default: "" },
    state: {
      type: String,
      enum: ["uploading", "processing", "ready", "degraded", "failed"],
      default: "uploading",
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    queueJobId: { type: String, default: "" },
    error: { type: String, default: "" },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reelUploadJobSchema.index({ state: 1, updatedAt: -1 });
reelUploadJobSchema.index({ createdAt: -1 });
reelUploadJobSchema.index(
  { videoId: 1 },
  {
    unique: true,
    partialFilterExpression: { state: { $in: ["uploading", "processing"] } },
  }
);

module.exports = mongoose.model("ReelUploadJob", reelUploadJobSchema);

