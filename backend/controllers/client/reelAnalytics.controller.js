const { ingestBatch } = require("../../services/reels/reelAnalytics.service");

// POST /client/reelAnalytics/batch?userId=...
exports.postBatch = async (req, res) => {
  try {
    const userId = req.query.userId || req.body?.userId;
    const events = req.body?.events;
    const result = await ingestBatch({ userId, events });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
