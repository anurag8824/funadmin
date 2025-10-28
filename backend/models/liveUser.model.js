const mongoose = require("mongoose");

const liveUserSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    userName: { type: String, default: "" },
    image: { type: String, default: "" },
    isProfileImageBanned: { type: Boolean, default: false },
    isFake: { type: Boolean, default: false },
    countryFlagImage: { type: String, default: "" },
    country: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },

    view: { type: Number, default: 0 },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    liveHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveHistory" },

    isPkMode: { type: Boolean, default: false },
    isPkRound: { type: Boolean, default: false },
    pkEndTime: { type: String, default: null },
    pkId: { type: String, default: null },
    pkConfig: {
      host1Id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //user who started Pk
      host2Id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //user who joined in Pk

      host1UniqueId: { type: Number, default: "" },
      host2UniqueId: { type: Number, default: "" },
      host1Name: { type: String, default: "" },
      host2Name: { type: String, default: "" },
      host1Image: { type: String, default: "" },
      host2Image: { type: String, default: "" },
      host1LiveId: { type: String, default: "" },
      host2LiveId: { type: String, default: "" },
      host2ObjId: { type: String, default: "" },

      host1Channel: { type: String, default: "" },
      host2Channel: { type: String, default: "" },

      localRank: { type: Number, default: 0 },
      remoteRank: { type: Number, default: 0 },
      isWinner: { type: Number, enum: [0, 1, 2], default: 0 }, // 0: draw(tie), 1: loose, 2: winner

      host1Details: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        name: { type: String, default: "" },
        userName: { type: String, default: "" },
        coin: { type: Number, default: 0 },
        image: { type: String, default: "" },
        countryFlagImage: { type: String, default: "" },
        country: { type: String, default: "" },
        uniqueId: { type: String, default: "" },
        isProfileImageBanned: { type: Boolean, default: false },
      },

      host2Details: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        name: { type: String, default: "" },
        userName: { type: String, default: "" },
        coin: { type: Number, default: 0 },
        image: { type: String, default: "" },
        countryFlagImage: { type: String, default: "" },
        country: { type: String, default: "" },
        uniqueId: { type: String, default: "" },
        isProfileImageBanned: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

liveUserSchema.index({ userId: 1 });
liveUserSchema.index({ liveHistoryId: 1 });
liveUserSchema.index({ createdAt: -1 });

module.exports = mongoose.model("LiveUser", liveUserSchema);
