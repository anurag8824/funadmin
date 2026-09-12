const mongoose = require("mongoose");

/**
 * A house or direct-sold campaign. Network (AdMob) demand is not modelled here — the plan
 * service emits a network slot instead, and the SDK runs that auction on device.
 */
const adCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    advertiser: { type: String, default: "FuntApp" },

    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed"],
      default: "draft",
      index: true,
    },

    /** Higher wins when several campaigns are eligible for the same slot. */
    priority: { type: Number, default: 0 },

    startAt: { type: Date, default: () => new Date() },
    endAt: { type: Date, default: null },

    /** 0 means unlimited. Enforced in Redis, not here. */
    capPerUserPerDay: { type: Number, default: 3 },

    /** Total impressions to deliver. 0 means unlimited. */
    impressionGoal: { type: Number, default: 0 },

    /** Even delivery across the day rather than burning the goal in the first hour. */
    pacing: { type: String, enum: ["even", "asap"], default: "even" },

    targeting: {
      surfaces: { type: [String], default: ["feed", "reels"] },
      platforms: { type: [String], default: ["android", "ios"] },
      countries: { type: [String], default: [] },
      minAppVersion: { type: String, default: "" },
    },
  },
  { timestamps: true, versionKey: false },
);

adCampaignSchema.index({ status: 1, startAt: 1, endAt: 1 });

module.exports = mongoose.model("AdCampaign", adCampaignSchema);
