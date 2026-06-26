const fs = require("fs");
const path = require("path");
const Setting = require("../models/setting.model");

let settingsPromise = null;

async function loadSettingsFromDb() {
  try {
    const setting = await Setting.findOne().sort({ createdAt: -1 }).maxTimeMS(10_000);
    if (setting) {
      global.settingJSON = setting.toObject();
      console.log("✅ Settings loaded:", global.settingJSON._id);
    } else {
      global.settingJSON = require("../setting");
      console.warn("⚠️ No DB settings found. Using fallback.");
    }
  } catch (err) {
    console.error("❌ Failed to initialize settings:", err);
    if (!global.settingJSON || Object.keys(global.settingJSON).length === 0) {
      global.settingJSON = require("../setting");
    }
  }
}

/** Idempotent settings bootstrap — safe to call from index and Firebase init. */
function ensureSettingsLoaded() {
  if (!settingsPromise) {
    settingsPromise = loadSettingsFromDb();
  }
  return settingsPromise;
}

function updateSettingFile(settingData) {
  const settingJSON = JSON.stringify(settingData, null, 2);
  fs.writeFileSync(path.join(__dirname, "..", "setting.js"), `module.exports = ${settingJSON};`, "utf8");
  global.settingJSON = settingData;
  console.log("Settings file updated.");
}

module.exports = {
  ensureSettingsLoaded,
  updateSettingFile,
};
