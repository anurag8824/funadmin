const { buildPlan } = require("../../services/ads/adPlanService");
const { ingestBatch } = require("../../services/ads/adEventService");

// POST /client/ads/plan?userId=...
exports.postPlan = async (req, res) => {
  try {
    const userId = req.query.userId || req.body?.userId;
    const body = req.body || {};
    const device = body.device || {};

    const contentCount = Math.min(Math.max(parseInt(body.contentCount, 10) || 0, 0), 100);
    const startContentIndex = Math.max(parseInt(body.startContentIndex, 10) || 0, 0);

    const plan = await buildPlan({
      userId,
      surface: String(body.surface || "feed"),
      contentCount,
      startContentIndex,
      platform: String(device.platform || "android").toLowerCase(),
      appVersion: String(device.appVersion || ""),
      country: String(device.country || ""),
    });

    return res.status(200).json({ status: true, message: "Success", data: plan });
  } catch (error) {
    console.log(error);
    // A failed plan must not fail the feed — the client falls back to its cached density.
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// POST /client/ads/events?userId=...
exports.postEvents = async (req, res) => {
  try {
    const userId = req.query.userId || req.body?.userId;
    const body = req.body || {};
    const events = Array.isArray(body) ? body : body.events;

    const result = await ingestBatch({
      userId,
      events,
      platform: body.platform,
      appVersion: body.appVersion,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
