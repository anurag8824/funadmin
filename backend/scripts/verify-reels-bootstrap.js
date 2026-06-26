#!/usr/bin/env node
/**
 * Run on the server after deploy: node scripts/verify-reels-bootstrap.js
 */
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
];

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let failed = false;

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error("MISSING:", rel);
    failed = true;
  }
}

try {
  require(path.join(root, "routes/client/video.route.js"));
  console.log("OK: video.route loads");
} catch (err) {
  console.error("FAIL: video.route", err.message);
  failed = true;
}

try {
  require(path.join(root, "services/reels/feedCacheService.js"));
  console.log("OK: feedCacheService loads");
} catch (err) {
  console.error("FAIL: feedCacheService", err.message);
  failed = true;
}

if (failed) {
  console.error("\nBootstrap verification FAILED — deploy missing files before pm2 restart.");
  process.exit(1);
}

console.log("\nBootstrap verification passed.");
