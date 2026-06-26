#!/usr/bin/env node
/**
 * Run on the server after deploy: node scripts/verify-reels-bootstrap.js
 * Does NOT start the HTTP server (safe while pm2 is running).
 */
const fs = require("fs");
const path = require("path");

const required = [
  "services/reels/feedCacheService.js",
  "services/reels/scalingConfig.js",
  "services/reels/feedService.js",
  "services/reels/trendingFeedService.js",
  "services/reels/videoUpload.service.js",
  "services/reels/videoProcessing.service.js",
  "services/reels/videoService.js",
  "services/reels/reelsHealth.service.js",
  "services/reels/reelsMetrics.service.js",
  "services/reels/reelsProduction.js",
  "middleware/reelsRequestId.js",
  "middleware/reelsRateLimiter.js",
  "util/signedPlaybackUrl.js",
  "util/cdnCachePolicy.js",
  "util/bootstrapSettings.js",
];

const root = path.join(__dirname, "..");
let failed = false;

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error("MISSING:", rel);
    failed = true;
  }
}

const modulesToLoad = [
  "services/reels/feedCacheService.js",
  "services/reels/feedService.js",
  "middleware/reelsRateLimiter.js",
  "middleware/reelsRequestId.js",
];

for (const rel of modulesToLoad) {
  try {
    require(path.join(root, rel));
    console.log("OK:", rel);
  } catch (err) {
    console.error("FAIL:", rel, err.message);
    failed = true;
  }
}

if (failed) {
  console.error("\nBootstrap verification FAILED — deploy missing files before pm2 restart.");
  process.exit(1);
}

console.log("\nBootstrap verification passed.");
process.exit(0);
