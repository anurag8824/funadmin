const { randomUUID } = require("crypto");

/** Attach x-request-id for log correlation (SADD Phase 18). */
function reelsRequestId() {
  return (req, res, next) => {
    const incoming = req.headers["x-request-id"];
    const requestId = typeof incoming === "string" && incoming.trim() ? incoming.trim() : randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  };
}

module.exports = reelsRequestId;
