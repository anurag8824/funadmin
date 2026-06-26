const crypto = require("crypto");

const DEFAULT_TTL_SECONDS = 4 * 60 * 60;

function isSigningEnabled() {
  return Boolean(String(process.env.REELS_SIGN_PLAYBACK_SECRET || "").trim());
}

function signToken({ videoId, userId, exp }) {
  const secret = process.env.REELS_SIGN_PLAYBACK_SECRET;
  return crypto.createHmac("sha256", secret).update(`${videoId}:${userId}:${exp}`).digest("hex");
}

function verifyToken({ videoId, userId, exp, sig }) {
  if (!isSigningEnabled()) return true;
  if (!videoId || !userId || !exp || !sig) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Number(exp) < now) return false;
  const expected = signToken({ videoId, userId, exp: String(exp) });
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(sig)));
  } catch {
    return false;
  }
}

function appendSignedQuery(url, { videoId, userId, ttlSeconds = DEFAULT_TTL_SECONDS }) {
  if (!url || !isSigningEnabled()) return url;
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = signToken({ videoId: String(videoId), userId: String(userId), exp });
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}exp=${exp}&uid=${encodeURIComponent(String(userId))}&sig=${sig}`;
}

function signPlaybackUrls(playback, { videoId, userId }) {
  if (!playback || !isSigningEnabled()) return playback;
  const signed = {};
  for (const [key, value] of Object.entries(playback)) {
    if (typeof value === "string" && value.trim()) {
      signed[key] = appendSignedQuery(value, { videoId, userId });
    } else {
      signed[key] = value;
    }
  }
  signed.signed = true;
  signed.expiresInSec = DEFAULT_TTL_SECONDS;
  return signed;
}

module.exports = {
  isSigningEnabled,
  appendSignedQuery,
  signPlaybackUrls,
  verifyToken,
};
