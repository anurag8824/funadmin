const mongoose = require("mongoose");

const { STORY_TYPE, STORY_MEDIA_TYPE } = require("../types/constant");

const storySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    backgroundSong: { type: mongoose.Schema.Types.ObjectId, ref: "Song", default: null },
    storyMediaType: { type: Number, enum: STORY_MEDIA_TYPE },
    storyType: { type: Number, enum: STORY_TYPE },
    mediaImageUrl: { type: String, default: "" },
    mediaVideoUrl: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    reactionsCount: { type: Number, default: 0 },
    isFake: { type: Boolean, default: false },
    // TTL field: set explicitly on upload; MongoDB removes the document after this date.
    // Default ensures even admin-created stories without explicit expiresAt also expire.
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Proper TTL index – MongoDB polls this once per minute and auto-deletes expired docs.
// NOTE: if the index already exists in Atlas/local with wrong settings,
// drop it first: db.stories.dropIndex("expiresAt_1")
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Story", storySchema);

