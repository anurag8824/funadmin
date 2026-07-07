const mongoose = require("mongoose");

const purchaseCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
    usedAt: { type: Date, default: null },
    usedByEmail: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("PurchaseCode", purchaseCodeSchema);
