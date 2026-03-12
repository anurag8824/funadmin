const mongoose = require("mongoose");

const CALL_STATUS = {
  CALLING: 1,
  RINGING: 2,
  ACCEPTED: 3,
  REJECTED: 4,
  ENDED: 5,
  MISSED: 6,
};

const audioCallSchema = mongoose.Schema(
  {
    callerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    callId: { type: String, unique: true, required: true },
    status: { type: Number, enum: Object.values(CALL_STATUS), default: CALL_STATUS.CALLING },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: 0 }, // Duration in seconds
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

audioCallSchema.index({ callerId: 1, createdAt: -1 });
audioCallSchema.index({ receiverId: 1, createdAt: -1 });
audioCallSchema.index({ callId: 1 });

module.exports = mongoose.model("AudioCall", audioCallSchema);
module.exports.CALL_STATUS = CALL_STATUS;
