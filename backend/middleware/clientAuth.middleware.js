const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      return res.status(401).json({ status: false, message: "Authorization token is required." });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenUserId = decoded?._id ? String(decoded._id) : null;
    const requestUserId = req.query?.userId ? String(req.query.userId) : null;

    if (!tokenUserId || !requestUserId || tokenUserId !== requestUserId) {
      return res.status(403).json({ status: false, message: "Unauthorized user context." });
    }

    req.clientUser = { _id: tokenUserId };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ status: false, message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ status: false, message: "Invalid token" });
    }
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
