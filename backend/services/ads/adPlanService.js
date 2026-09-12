const crypto = require("crypto");
const AdPlacement = require("../../models/adPlacement.model");
const AdCampaign = require("../../models/adCampaign.model");
const AdCreative = require("../../models/adCreative.model");
const Setting = require("../../models/setting.model");
const counters = require("./adCounterStore");

/**
 * Builds the ad plan for one content page.
 *
 * Everything that decides *whether* a user sees an ad lives here rather than on the device:
 * density, frequency caps, campaign pacing, kill switches. The client only executes the plan,
 * and only when a slot is genuinely about to be seen.
 */

/** Organic items that must sit between two ads, whatever an admin types. */
const MIN_DENSITY = 5;

/** Seconds a plan stays valid. Past this the client asks for a new one. */
const PLAN_TTL_SECONDS = 900;

/** Minimum gap between two ads for one user, regardless of density. */
const MIN_SECONDS_BETWEEN_ADS = parseInt(process.env.ADS_MIN_SECONDS_BETWEEN || "20", 10);

/** Ads per user per day. 0 disables the cap. */
const DAILY_AD_CAP = parseInt(process.env.ADS_DAILY_CAP_PER_USER || "60", 10);

const CONFIG_CACHE_TTL_MS = 60_000;

let configCache = { loadedAtMs: 0, placements: null, campaigns: null };

function nowMs() {
  return Date.now();
}

function newPlanId() {
  return `pln_${crypto.randomBytes(9).toString("hex")}`;
}

/**
 * Placement config, falling back to the legacy setting document.
 *
 * The fallback matters during rollout: until an adPlacement row exists for a surface, the plan
 * must reproduce exactly what the client was already doing from `/setting`, or shipping the
 * endpoint would silently change ad density for everyone.
 */
async function loadPlacements() {
  const rows = await AdPlacement.find({}).lean();
  const bySurface = {};
  rows.forEach((row) => {
    bySurface[row.surface] = row;
  });

  if (!rows.length) {
    const setting = await Setting.findOne({}).lean();
    const legacyDensity = Number(setting?.adDisplayIndex) > 0 ? Number(setting.adDisplayIndex) : 10;
    const legacy = (surface, enabled) => ({
      surface,
      enabled: Boolean(setting?.isGoogle) && enabled,
      density: legacyDensity,
      houseFillRatio: 0,
      android: { native: setting?.android?.google?.native || "" },
      ios: { native: setting?.ios?.google?.native || "" },
      _legacy: true,
    });
    bySurface.feed = legacy("feed", Boolean(setting?.isFeedAdEnabled));
    bySurface.reels = legacy("reels", Boolean(setting?.isVideoAdEnabled || setting?.isFeedAdEnabled));
    bySurface.chatList = legacy("chatList", Boolean(setting?.isChatAdEnabled));
  }

  return bySurface;
}

async function loadCampaigns() {
  const now = new Date();
  const campaigns = await AdCampaign.find({
    status: "active",
    startAt: { $lte: now },
    $or: [{ endAt: null }, { endAt: { $gte: now } }],
  })
    .sort({ priority: -1 })
    .lean();

  if (!campaigns.length) return [];

  const creatives = await AdCreative.find({
    campaignId: { $in: campaigns.map((c) => c._id) },
    reviewStatus: "approved",
  }).lean();

  const byCampaign = new Map();
  creatives.forEach((creative) => {
    const key = String(creative.campaignId);
    if (!byCampaign.has(key)) byCampaign.set(key, []);
    byCampaign.get(key).push(creative);
  });

  // A campaign with no approved creative cannot fill a slot.
  return campaigns
    .map((campaign) => ({ ...campaign, creatives: byCampaign.get(String(campaign._id)) || [] }))
    .filter((campaign) => campaign.creatives.length > 0);
}

/**
 * Mongo is kept off the request path by a short in-process cache.
 *
 * The reload is single-flighted. Without that, every request in flight when the TTL lapses
 * reloads the config itself: measured on one box, ten concurrent requests crossing the boundary
 * went from 3ms to 1.7s because each one issued its own placement and campaign queries. The
 * first caller here does the work and everyone else awaits the same promise.
 */
let configReload = null;

/**
 * Beyond this the config is too old to serve. Only a reload that keeps failing gets here, and
 * at that point waiting is better than planning against stale placements indefinitely.
 */
const CONFIG_MAX_STALE_MS = CONFIG_CACHE_TTL_MS * 10;

function startConfigReload() {
  if (configReload) return configReload;
  configReload = (async () => {
    try {
      const [placements, campaigns] = await Promise.all([loadPlacements(), loadCampaigns()]);
      configCache = { loadedAtMs: nowMs(), placements, campaigns };
      return configCache;
    } finally {
      // Cleared in `finally` so a failed load cannot wedge every later request on a
      // rejected promise — the next caller retries instead.
      configReload = null;
    }
  })();
  return configReload;
}

async function loadConfig() {
  const age = nowMs() - configCache.loadedAtMs;

  if (configCache.placements && age < CONFIG_CACHE_TTL_MS) return configCache;

  // Stale but usable: refresh in the background and answer from what we already have. Ad
  // placement tolerates a minute of staleness; a latency cliff on every request that happens
  // to cross the expiry does not. Single-flighting alone only collapses the queries — every
  // caller still waits on the one reload, which measured 460ms against 3.6ms warm.
  if (configCache.placements && age < CONFIG_MAX_STALE_MS) {
    startConfigReload().catch(() => {});
    return configCache;
  }

  // Cold start, or stale past the point of usefulness — this one has to wait.
  return startConfigReload();
}

function invalidateConfigCache() {
  configCache = { loadedAtMs: 0, placements: null, campaigns: null };
  configReload = null;
}

function versionAtLeast(actual, minimum) {
  if (!minimum) return true;
  if (!actual) return false;
  const a = String(actual).split(".").map((n) => parseInt(n, 10) || 0);
  const b = String(minimum).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff > 0;
  }
  return true;
}

function matchesTargeting(campaign, { surface, platform, country, appVersion }) {
  const t = campaign.targeting || {};
  if (t.surfaces?.length && !t.surfaces.includes(surface)) return false;
  if (t.platforms?.length && platform && !t.platforms.includes(platform)) return false;
  if (t.countries?.length && country && !t.countries.includes(country)) return false;
  if (!versionAtLeast(appVersion, t.minAppVersion)) return false;
  return true;
}

/**
 * Even-paced campaigns get roughly goal/24 impressions per hour. Without this a campaign with
 * a daily goal burns it in the first busy hour and shows nothing for the rest of the day.
 */
function withinPacing(campaign, hourlyCount) {
  if (campaign.pacing !== "even") return true;
  if (!campaign.impressionGoal || campaign.impressionGoal <= 0) return true;
  const hourlyBudget = Math.ceil(campaign.impressionGoal / 24);
  return hourlyCount < hourlyBudget;
}

function pickCreative(campaign) {
  const list = campaign.creatives;
  return list[Math.floor(Math.random() * list.length)];
}

function networkUnitId(placement, platform) {
  const ids = platform === "ios" ? placement.ios : placement.android;
  return ids?.native || "";
}

/**
 * @returns {{planId: string, ttlSeconds: number, slots: Array, caps: object}}
 */
async function buildPlan({
  userId,
  surface = "feed",
  contentCount = 20,
  platform = "android",
  appVersion = "",
  country = "",
  startContentIndex = 0,
}) {
  const emptyPlan = (reason) => ({
    planId: newPlanId(),
    ttlSeconds: PLAN_TTL_SECONDS,
    slots: [],
    caps: { remainingToday: 0, minSecondsBetweenAds: MIN_SECONDS_BETWEEN_ADS },
    reason,
  });

  const { placements, campaigns } = await loadConfig();
  const placement = placements[surface];

  if (!placement || !placement.enabled) return emptyPlan("surface_disabled");
  if (await counters.isSurfaceKilled(surface)) return emptyPlan("surface_killed");
  if (await counters.isUserBlocked(userId)) return emptyPlan("user_blocked");

  const eligible = campaigns.filter((campaign) =>
    matchesTargeting(campaign, { surface, platform, country, appVersion }),
  );
  const eligibleIds = eligible.map((campaign) => String(campaign._id));

  const [userState, pacing] = await Promise.all([
    counters.readUserState(userId, eligibleIds),
    counters.readCampaignPacing(eligibleIds),
  ]);

  const remainingToday =
    DAILY_AD_CAP > 0 ? Math.max(0, DAILY_AD_CAP - userState.servedToday) : Number.MAX_SAFE_INTEGER;
  if (remainingToday <= 0) return emptyPlan("daily_cap_reached");

  const density = Math.max(MIN_DENSITY, Number(placement.density) || 10);
  const planId = newPlanId();
  const slots = [];
  const usedCampaignIds = [];

  // Slots land after every `density`-th organic item, continuing the running count across
  // pages so pagination does not restart the cadence and double up at a page boundary.
  for (let i = 0; i < contentCount; i += 1) {
    const absoluteIndex = startContentIndex + i;
    const isSlotBoundary = (absoluteIndex + 1) % density === 0;
    if (!isSlotBoundary) continue;
    if (slots.length >= remainingToday) break;

    const slotId = `${planId}:${slots.length}`;
    const houseCandidates = eligible.filter((campaign) => {
      const id = String(campaign._id);
      const seen = userState.campaignCounts[id] || 0;
      if (campaign.capPerUserPerDay > 0 && seen >= campaign.capPerUserPerDay) return false;
      return withinPacing(campaign, pacing[id] || 0);
    });

    const wantsHouse = Math.random() < (Number(placement.houseFillRatio) || 0);
    const campaign = wantsHouse ? houseCandidates[0] : null;

    if (campaign) {
      const creative = pickCreative(campaign);
      usedCampaignIds.push(String(campaign._id));
      slots.push({
        slotId,
        afterContentIndex: absoluteIndex,
        fill: {
          type: "house",
          campaignId: String(campaign._id),
          creativeId: String(creative._id),
          format: creative.format,
          headline: creative.headline,
          body: creative.body,
          callToAction: creative.callToAction,
          advertiserName: creative.advertiserName,
          mediaUrl: creative.mediaUrl,
          iconUrl: creative.iconUrl,
          mediaAspectRatio: creative.mediaAspectRatio,
          clickUrl: creative.clickUrl,
        },
      });
    } else {
      const unitId = networkUnitId(placement, platform);
      if (!unitId) continue;
      slots.push({
        slotId,
        afterContentIndex: absoluteIndex,
        fill: { type: "network", format: "native", unitId },
      });
    }
  }

  if (slots.length) {
    await counters.commitPlan({ userId, slotCount: slots.length, campaignIds: usedCampaignIds });
  }

  return {
    planId,
    ttlSeconds: PLAN_TTL_SECONDS,
    slots,
    caps: {
      remainingToday: remainingToday === Number.MAX_SAFE_INTEGER ? -1 : remainingToday - slots.length,
      minSecondsBetweenAds: MIN_SECONDS_BETWEEN_ADS,
    },
  };
}

module.exports = {
  buildPlan,
  invalidateConfigCache,
  MIN_DENSITY,
  PLAN_TTL_SECONDS,
  MIN_SECONDS_BETWEEN_ADS,
  DAILY_AD_CAP,
};
