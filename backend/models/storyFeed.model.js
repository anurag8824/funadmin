const mongoose = require("mongoose");

const MEDIA_TYPES = ["image", "video"];

const storyFeedSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true, trim: true, maxlength: 4096 },
    mediaType: { type: String, enum: MEDIA_TYPES, required: true },
    viewCount: { type: Number, default: 0, min: 0 },
    // Capped implicitly by MongoDB 16MB doc limit; hot paths must not load this array into Node.
    viewers: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

storyFeedSchema.index({ userId: 1, createdAt: -1 });
storyFeedSchema.index({ userId: 1, expiresAt: 1, createdAt: -1 });
storyFeedSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("StoryFeed", storyFeedSchema);
module.exports.MEDIA_TYPES = MEDIA_TYPES;
