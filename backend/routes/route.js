//express
const express = require("express");
const route = express.Router();

//admin index.js
const admin = require("./admin/route");

//client index.js
const client = require("./client/route");

const { getReelsSubsystemHealth } = require("../services/reels/reelsHealth.service");
const { getMetricsSnapshot } = require("../services/reels/reelsMetrics.service");
const reelsProduction = require("../services/reels/reelsProduction");
const reelsRequestId = require("../middleware/reelsRequestId");

route.use(reelsRequestId);

// simple health check (for load balancers, k8s, monitoring)
route.get("/health", async (req, res) => {
  try {
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
    metrics: getMetricsSnapshot(),
    production: reelsProduction,
    requestId: req.requestId,
  });
});

route.use("/admin", admin);
route.use("/client", client);

module.exports = route;
