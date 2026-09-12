const AdPlacement = require("../../models/adPlacement.model");
const AdCampaign = require("../../models/adCampaign.model");
const AdCreative = require("../../models/adCreative.model");
const counters = require("../../services/ads/adCounterStore");
const { invalidateConfigCache, MIN_DENSITY } = require("../../services/ads/adPlanService");
const { readSurfaceStats } = require("../../services/ads/adEventService");

const SURFACES = ["feed", "reels", "chatList", "story"];

const ok = (res, data, message = "Success") =>
  res.status(200).json({ status: true, message, data });
const bad = (res, message) => res.status(400).json({ status: false, message });
const oops = (res, error) => {
  console.log(error);
  return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
};

// GET /admin/ads/placements
exports.getPlacements = async (req, res) => {
  try {
    const rows = await AdPlacement.find({}).lean();
    const bySurface = {};
    rows.forEach((row) => {
      bySurface[row.surface] = row;
    });

    // Surfaces with no row yet are reported as unconfigured rather than omitted, so the
    // console shows every surface the app can serve instead of only the ones touched before.
    const placements = await Promise.all(
      SURFACES.map(async (surface) => ({
        surface,
        configured: Boolean(bySurface[surface]),
        killed: await counters.isSurfaceKilled(surface),
        ...(bySurface[surface] || {
          enabled: false,
          density: 10,
          houseFillRatio: 0,
          android: { native: "", banner: "", interstitial: "" },
          ios: { native: "", banner: "", interstitial: "" },
        }),
      })),
    );

    return ok(res, { placements, minDensity: MIN_DENSITY, redisReady: counters.isRedisReady() });
  } catch (error) {
    return oops(res, error);
  }
};

// PATCH /admin/ads/placement
exports.upsertPlacement = async (req, res) => {
  try {
    const { surface } = req.body || {};
    if (!SURFACES.includes(surface)) return bad(res, `surface must be one of ${SURFACES.join(", ")}`);

    const update = {};
    if (req.body.enabled !== undefined) update.enabled = Boolean(req.body.enabled);
    if (req.body.density !== undefined) {
      const density = parseInt(req.body.density, 10);
      if (!Number.isFinite(density) || density < MIN_DENSITY) {
        return bad(res, `density must be at least ${MIN_DENSITY}`);
      }
      update.density = density;
    }
    if (req.body.houseFillRatio !== undefined) {
      const ratio = Number(req.body.houseFillRatio);
      if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
        return bad(res, "houseFillRatio must be between 0 and 1");
      }
      update.houseFillRatio = ratio;
    }
    ["android", "ios"].forEach((platform) => {
      if (!req.body[platform]) return;
      ["native", "banner", "interstitial"].forEach((format) => {
        const value = req.body[platform][format];
        if (value === undefined) return;
        update[`${platform}.${format}`] = String(value).trim();
      });
    });

    const placement = await AdPlacement.findOneAndUpdate(
      { surface },
      { $set: update, $setOnInsert: { surface } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    invalidateConfigCache();
    return ok(res, placement, "Placement saved");
  } catch (error) {
    return oops(res, error);
  }
};

// PATCH /admin/ads/kill
exports.setKillSwitch = async (req, res) => {
  try {
    const { surface, killed } = req.body || {};
    if (!SURFACES.includes(surface)) return bad(res, `surface must be one of ${SURFACES.join(", ")}`);
    const applied = await counters.setSurfaceKilled(surface, Boolean(killed));
    if (!applied) return bad(res, "Could not reach the counter store — kill switch not applied");
    return ok(res, { surface, killed: Boolean(killed) }, "Kill switch updated");
  } catch (error) {
    return oops(res, error);
  }
};

// GET /admin/ads/campaigns
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await AdCampaign.find({}).sort({ createdAt: -1 }).lean();
    const creatives = await AdCreative.find({
      campaignId: { $in: campaigns.map((c) => c._id) },
    }).lean();

    const byCampaign = new Map();
    creatives.forEach((creative) => {
      const key = String(creative.campaignId);
      if (!byCampaign.has(key)) byCampaign.set(key, []);
      byCampaign.get(key).push(creative);
    });

    return ok(
      res,
      campaigns.map((campaign) => ({
        ...campaign,
        creatives: byCampaign.get(String(campaign._id)) || [],
      })),
    );
  } catch (error) {
    return oops(res, error);
  }
};

// POST /admin/ads/campaign
exports.createCampaign = async (req, res) => {
  try {
    if (!req.body?.name) return bad(res, "name is required");
    const campaign = await AdCampaign.create(req.body);
    invalidateConfigCache();
    return ok(res, campaign, "Campaign created");
  } catch (error) {
    return oops(res, error);
  }
};

// PATCH /admin/ads/campaign
exports.updateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.body || {};
    if (!campaignId) return bad(res, "campaignId is required");
    const { _id, ...patch } = req.body;
    delete patch.campaignId;

    const campaign = await AdCampaign.findByIdAndUpdate(campaignId, { $set: patch }, { new: true }).lean();
    if (!campaign) return bad(res, "Campaign not found");
    invalidateConfigCache();
    return ok(res, campaign, "Campaign updated");
  } catch (error) {
    return oops(res, error);
  }
};

// DELETE /admin/ads/campaign?campaignId=...
exports.deleteCampaign = async (req, res) => {
  try {
    const campaignId = req.query.campaignId || req.body?.campaignId;
    if (!campaignId) return bad(res, "campaignId is required");
    const campaign = await AdCampaign.findByIdAndDelete(campaignId);
    if (!campaign) return bad(res, "Campaign not found");
    // Creatives outlive their campaign otherwise and would never be reachable or cleaned up.
    await AdCreative.deleteMany({ campaignId });
    invalidateConfigCache();
    return ok(res, { campaignId }, "Campaign deleted");
  } catch (error) {
    return oops(res, error);
  }
};

// POST /admin/ads/creative
exports.createCreative = async (req, res) => {
  try {
    const { campaignId, headline, clickUrl } = req.body || {};
    if (!campaignId) return bad(res, "campaignId is required");
    if (!headline) return bad(res, "headline is required");
    if (!clickUrl) return bad(res, "clickUrl is required");

    const campaign = await AdCampaign.findById(campaignId).lean();
    if (!campaign) return bad(res, "Campaign not found");

    const creative = await AdCreative.create(req.body);
    invalidateConfigCache();
    return ok(res, creative, "Creative created — pending review");
  } catch (error) {
    return oops(res, error);
  }
};

// PATCH /admin/ads/creative
exports.updateCreative = async (req, res) => {
  try {
    const { creativeId } = req.body || {};
    if (!creativeId) return bad(res, "creativeId is required");
    const { _id, ...patch } = req.body;
    delete patch.creativeId;
    delete patch.campaignId;

    const creative = await AdCreative.findByIdAndUpdate(creativeId, { $set: patch }, { new: true }).lean();
    if (!creative) return bad(res, "Creative not found");
    invalidateConfigCache();
    return ok(res, creative, "Creative updated");
  } catch (error) {
    return oops(res, error);
  }
};

// DELETE /admin/ads/creative?creativeId=...
exports.deleteCreative = async (req, res) => {
  try {
    const creativeId = req.query.creativeId || req.body?.creativeId;
    if (!creativeId) return bad(res, "creativeId is required");
    const creative = await AdCreative.findByIdAndDelete(creativeId);
    if (!creative) return bad(res, "Creative not found");
    invalidateConfigCache();
    return ok(res, { creativeId }, "Creative deleted");
  } catch (error) {
    return oops(res, error);
  }
};

// GET /admin/ads/stats?hours=24
exports.getStats = async (req, res) => {
  try {
    const hours = Math.min(Math.max(parseInt(req.query.hours, 10) || 24, 1), 24 * 30);
    const stats = await readSurfaceStats({ sinceMs: Date.now() - hours * 60 * 60 * 1000 });
    return ok(res, { hours, surfaces: stats, redisReady: counters.isRedisReady() });
  } catch (error) {
    return oops(res, error);
  }
};
