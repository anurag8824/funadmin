/**
 * Centralized logging for Story Feed APIs (production-safe context, full stack in logs only).
 */
function logStoryFeedError(apiName, userId, err) {
  const uid = userId != null ? String(userId) : null;
  const msg = err && err.message ? String(err.message) : String(err);
  const stack = err && err.stack ? String(err.stack) : undefined;
  console.error(`[StoryFeed][${apiName}]`, { userId: uid, message: msg, stack });
}

function logStoryFeedWarn(apiName, userId, message, extra) {
  console.warn(`[StoryFeed][${apiName}]`, { userId: userId != null ? String(userId) : null, message, ...extra });
}

module.exports = { logStoryFeedError, logStoryFeedWarn };
