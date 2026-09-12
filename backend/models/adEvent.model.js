const mongoose = require("mongoose");

/**
 * Raw ad beacons. Deliberately TTL'd: at scale this collection is a firehose, and the
 * durable record is the rolled-up aggregate, not the raw row.
 *
 * The analytics store decision (ClickHouse / BigQuery) is still open — see the plan's
 * section H. Until then this keeps 30 days in Mongo, which is enough for dashboards and
 * for the invalid-traffic checks in adEventService.
 */
const adEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    planId: { type: String, index: true },
    slotId: { type: String },
    surface: { type: String, index: true },

    event: {
      type: String,
      required: true,
      enum: [
        "reserved",
        "gated",
        "requested",
        "filled",
        "nofill",
        "rendered",
        "viewable",
        "clicked",
        "expired",
        "disposed",
      ],
      index: true,
    },

    /** "network" or "house". */
    source: { type: String, default: "network" },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "AdCampaign", default: null },
    creativeId: { type: mongoose.Schema.Types.ObjectId, ref: "AdCreative", default: null },

    ts: { type: Number, default: () => Date.now() },
    dwellMs: { type: Number, default: 0 },
    appVersion: { type: String, default: "" },
    platform: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

adEventSchema.index({ createdAt: -1 });
adEventSchema.index({ surface: 1, event: 1, createdAt: -1 });
// Raw beacons expire after 30 days; aggregates outlive them.
adEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("AdEvent", adEventSchema);
