//express
const express = require("express");
const route = express.Router();

//admin index.js
const admin = require("./admin/route");

//client index.js
const client = require("./client/route");

function safeRequire(label, resolver) {
  try {
    return resolver();
  } catch (err) {
    console.error(`[ROUTES] Failed to load ${label}:`, err.message);
    return null;
  }
}

const reelsRequestId =
  safeRequire("reelsRequestId", () => require("../middleware/reelsRequestId")) ||
  ((req, res, next) => next());

const getReelsSubsystemHealth = safeRequire("reelsHealth", () =>
  require("../services/reels/reelsHealth.service").getReelsSubsystemHealth,
);

const getMetricsSnapshot = safeRequire("reelsMetrics", () =>
  require("../services/reels/reelsMetrics.service").getMetricsSnapshot,
);

const reelsProduction = safeRequire("reelsProduction", () => require("../services/reels/reelsProduction"));

route.use(reelsRequestId);

// simple health check (for load balancers, k8s, monitoring)
route.get("/health", async (req, res) => {
  try {
    if (!getReelsSubsystemHealth) {
      return res.status(200).json({
        status: "ok",
        message: "Server is running",
        requestId: req.requestId,
      });
    }
    const reels = await getReelsSubsystemHealth();
    const statusCode = reels.status === "ok" ? 200 : 503;
    return res.status(statusCode).json({
      status: reels.status,
      message: "Server is running",
      reels,
      requestId: req.requestId,
    });
  } catch (error) {
    return res.status(503).json({
      status: "degraded",
      message: error.message || "Health check failed",
      requestId: req.requestId,
    });
  }
});

route.get("/health/reels/metrics", (req, res) => {
  return res.status(200).json({
    status: true,
    metrics: getMetricsSnapshot ? getMetricsSnapshot() : {},
    production: reelsProduction || {},
    requestId: req.requestId,
  });
});

route.use("/admin", admin);
route.use("/client", client);

module.exports = route;
