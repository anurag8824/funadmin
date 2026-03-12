const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reactionSchema.index({ isActive: 1 });

module.exports = mongoose.model("Reaction", reactionSchema);
