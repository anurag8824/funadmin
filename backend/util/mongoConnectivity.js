function isMongoConnectivityError(err) {
  if (!err) return false;
  const name = err.name || "";
  if (
    name === "MongoNetworkError" ||
    name === "MongoServerSelectionError" ||
    name === "MongoTimeoutError" ||
    name === "MongoNotConnectedError" ||
    name === "MongoWaitQueueTimeoutError" ||
    name === "PoolClearedError" ||
    name === "MongoPoolClearedError"
  ) {
    return true;
  }
  if (String(err.message || "").includes("PoolClearedError")) return true;
  if (String(err.message || "").includes("connection <monitor>") && String(err.message || "").includes("closed")) {
    return true;
  }
  const reason = err.reason;
  if (reason && typeof reason === "object" && reason.type === "ReplicaSetNoPrimary") {
    return true;
  }
  let c = err;
  for (let i = 0; i < 6 && c; i++) {
    const code = c.code;
    if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "ENOTFOUND") return true;
    if (String(c.message || "").includes("ETIMEDOUT")) return true;
    c = c.cause;
  }
  return false;
}

module.exports = { isMongoConnectivityError };
