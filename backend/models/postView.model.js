const mongoose = require("mongoose");

const postViewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    postUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

postViewSchema.index({ createdAt: -1 });
postViewSchema.index({ userId: 1 });
postViewSchema.index({ postId: 1 });
postViewSchema.index({ postUserId: 1 });
postViewSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model("PostView", postViewSchema);
