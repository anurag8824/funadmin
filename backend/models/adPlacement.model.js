const mongoose = require("mongoose");

/**
 * One row per ad surface (feed, reels, chatList…).
 *
 * Google paces, frequency-caps and prices per ad unit, so every surface gets its own unit
 * rather than sharing one app-wide native unit. Replaces the ad fields in setting.model.js.
 */
const adPlacementSchema = new mongoose.Schema(
  {
    surface: {
      type: String,
      required: true,
      unique: true,
      enum: ["feed", "reels", "chatList", "story"],
      index: true,
    },
    enabled: { type: Boolean, default: true },

    /** Organic items between two ads. Clamped by MIN_DENSITY in the plan service. */
    density: { type: Number, default: 8 },

    /** Share of slots filled from house inventory rather than the ad network, 0..1. */
    houseFillRatio: { type: Number, default: 0, min: 0, max: 1 },

    android: {
      native: { type: String, default: "" },
      banner: { type: String, default: "" },
      interstitial: { type: String, default: "" },
    },
    ios: {
      native: { type: String, default: "" },
      banner: { type: String, default: "" },
      interstitial: { type: String, default: "" },
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("AdPlacement", adPlacementSchema);
