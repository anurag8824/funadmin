const mongoose = require("mongoose");

const followerFollowingSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //A person who followed me
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //A person to whom followed
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound unique index prevents duplicate follow records
followerFollowingSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
followerFollowingSchema.index({ toUserId: 1 });
followerFollowingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("FollowerFollowing", followerFollowingSchema);
