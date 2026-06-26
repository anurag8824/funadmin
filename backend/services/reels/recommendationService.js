/**
 * Lightweight recommendation layer (SADD Phase 13).
 * v1: recency + engagement score + creator diversity re-rank.
 */
function engagementScore(video) {
  const likes = Number(video.totalLikes || 0);
  const comments = Number(video.totalComments || 0);
  const shares = Number(video.totalShares || video.shareCount || 0);
  return likes * 2 + comments * 3 + shares * 5;
}

function recencyBoost(createdAt) {
  if (!createdAt) return 0;
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (ageHours <= 6) return 50;
  if (ageHours <= 24) return 20;
  if (ageHours <= 72) return 5;
  return 0;
}

/**
 * Rank feed candidates. Stable sort with diversity: max 2 reels per creator in top 10.
 */
function rankFeedItems(items, { explorationRatio = 0.15 } = {}) {
  if (!Array.isArray(items) || items.length <= 1) return items;

  const scored = items.map((video, index) => ({
    video,
    index,
    score: engagementScore(video) + recencyBoost(video.createdAt),
  }));

  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  const explorationCount = Math.floor(items.length * explorationRatio);
  const topEngaged = scored.slice(0, Math.max(items.length - explorationCount, 1));
  const exploration = scored.slice(-explorationCount);

  const merged = [...topEngaged, ...exploration].map((s) => s.video);

  const result = [];
  const creatorCounts = new Map();
  const deferred = [];

  for (const video of merged) {
    const creatorId = String(video.userId || video.user?._id || "");
    const count = creatorCounts.get(creatorId) || 0;
    if (result.length < 10 && count >= 2) {
      deferred.push(video);
      continue;
    }
    result.push(video);
    creatorCounts.set(creatorId, count + 1);
  }

  return [...result, ...deferred.filter((v) => !result.includes(v))];
}

module.exports = {
  rankFeedItems,
  engagementScore,
};
