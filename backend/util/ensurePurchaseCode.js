const PurchaseCode = require("../models/purchaseCode.model");

async function ensurePurchaseCode() {
  const raw = process.env.ADMIN_PURCHASE_CODE;
  if (!raw || !String(raw).trim()) {
    console.warn(
      "⚠️ ADMIN_PURCHASE_CODE not set — seed a code in MongoDB or set env before admin registration."
    );
    return;
  }

  const codes = String(raw)
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);

  for (const code of codes) {
    await PurchaseCode.findOneAndUpdate(
      { code },
      {
        $set: { code, isActive: true },
        $setOnInsert: { usedAt: null, usedByEmail: "" },
      },
      { upsert: true, new: true }
    );
  }

  console.log(`✅ Admin purchase code(s) ready in DB (${codes.length})`);
}

module.exports = { ensurePurchaseCode };
