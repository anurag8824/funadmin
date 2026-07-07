//express
const express = require("express");
const app = express();

// Admin/API JSON responses should never be cached by browsers (prevents empty 304 bodies).
app.set("etag", false);
app.use((req, res, next) => {
  if (req.path.startsWith("/admin") || req.path.startsWith("/client")) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
  }
  next();
});

//dotenv (load before connection + routes)
require("dotenv").config({ path: ".env" });

//cors
const cors = require("cors");
app.use(cors());
app.use(express.json({ limit: "100mb" }));

// Always-on liveness probe — does not depend on Mongo or route bootstrap.
app.get("/ping", (_req, res) => {
  res.status(200).json({ ok: true, ts: Date.now() });
});

// Fail hung requests instead of leaving clients waiting until app timeout.
app.use((req, res, next) => {
  const timeoutMs = parseInt(process.env.API_REQUEST_TIMEOUT_MS || "12000", 10);
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`[API_TIMEOUT] ${req.method} ${req.originalUrl}`);
      res.status(503).json({
        status: false,
        message: "Request timeout. Please try again.",
        code: "API_TIMEOUT",
      });
    }
  }, timeoutMs);
  res.on("finish", () => clearTimeout(timer));
  res.on("close", () => clearTimeout(timer));
  next();
});

//logging middleware
const logger = require("morgan");
app.use(logger("dev"));

const path = require("path");
const mongoose = require("mongoose");
const { ensureSettingsLoaded, updateSettingFile } = require("./util/bootstrapSettings");

global.settingJSON = global.settingJSON || {};
global.updateSettingFile = updateSettingFile;

// Load file fallback before route require chain (upload middleware reads storage config).
try {
  if (!global.settingJSON._id) {
    global.settingJSON = require("./setting");
    console.log("✅ Loaded setting.js fallback for startup");
  }
} catch (err) {
  console.warn("⚠️ setting.js fallback unavailable:", err.message);
}

// Mount API routes at startup so the server never listens without handlers.
try {
  const routes = require("./routes/route");
  app.use(routes);
  console.log("✅ API routes mounted successfully");
} catch (err) {
  console.error("❌ CRITICAL: Failed to mount API routes:", err);
  app.use((req, res) => {
    res.status(503).json({
      status: false,
      message: "API temporarily unavailable (route bootstrap failed). Check server logs.",
    });
  });
}

const db = require("./util/connection");

db.on("error", (err) => {
  console.error("Mongo connection error:", err?.message || err);
});

db.once("open", async () => {
  console.log("Mongo: successfully connected to db");
  try {
    await ensureSettingsLoaded();
  } catch (err) {
    console.error("❌ Settings bootstrap failed:", err);
  }
  try {
    const { ensurePurchaseCode } = require("./util/ensurePurchaseCode");
    await ensurePurchaseCode();
  } catch (err) {
    console.error("❌ Purchase code bootstrap failed:", err);
  }
});

//socket io
const http = require("http");
const server = http.createServer(app);
global.io = require("socket.io")(server, {
  pingInterval: 25000,
  pingTimeout: 60000,
  connectTimeout: 45000,
});

// Load socket handlers before accepting traffic — require() is sync and blocks the event loop.
require("./socket");
console.log("✅ Socket handlers registered");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

server.listen(process?.env.PORT, () => {
  console.log("Hello World ! listening on " + process?.env?.PORT);
});
