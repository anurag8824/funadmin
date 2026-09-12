const mongoose = require("mongoose");

/**
 * A single renderable creative belonging to a campaign.
 *
 * Geometry fields exist so the client can reserve the exact slot size before the media loads —
 * an ad that changes a row's height after render shifts the feed under the reader's thumb.
 */
const adCreativeSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdCampaign",
      required: true,
      index: true,
    },

    format: { type: String, enum: ["native", "fullBleed"], default: "native" },

    headline: { type: String, required: true },
    body: { type: String, default: "" },
    callToAction: { type: String, default: "Learn more" },
    advertiserName: { type: String, default: "FuntApp" },

    mediaUrl: { type: String, default: "" },
    iconUrl: { type: String, default: "" },
    /** width / height of mediaUrl, used to reserve space before the image arrives. */
    mediaAspectRatio: { type: Number, default: 1.91 },

    /** Deep link or https target opened on tap. */
    clickUrl: { type: String, required: true },

    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

adCreativeSchema.index({ campaignId: 1, reviewStatus: 1 });

module.exports = mongoose.model("AdCreative", adCreativeSchema);
