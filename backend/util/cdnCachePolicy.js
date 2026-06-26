/** CDN / origin cache headers (SADD Phase 19). */

function cacheControlForUrl(url) {
  const lower = String(url || "").toLowerCase();
  if (lower.includes(".m3u8")) {
    return "public, max-age=30, stale-while-revalidate=60";
  }
  if (lower.includes(".ts") || lower.includes(".m4s")) {
    return "public, max-age=86400, immutable";
  }
  if (lower.endsWith(".mp4")) {
    return "public, max-age=604800, immutable";
  }
  if (lower.match(/\.(jpg|jpeg|png|webp)$/)) {
    return "public, max-age=604800";
  }
  return "public, max-age=3600";
}

function applyCdnCacheHeaders(res, urlOrExt) {
  res.setHeader("Cache-Control", cacheControlForUrl(urlOrExt));
}

module.exports = {
  cacheControlForUrl,
  applyCdnCacheHeaders,
};
