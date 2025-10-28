const mongoose = require("mongoose");

const storyViewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story", default: null },
    expiration_date: { type: Date, required: true, expires: 0 }, //deleted after 24 hours
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("StoryView", storyViewSchema);
