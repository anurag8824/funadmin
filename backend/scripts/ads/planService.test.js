/* Smoke test for adPlanService slot math, with the Mongo models stubbed out. */
const path = require("path");
const BACKEND = path.resolve(__dirname, "../..");

function stub(relPath, value) {
  const full = require.resolve(path.join(BACKEND, relPath));
  require.cache[full] = { id: full, filename: full, loaded: true, exports: value };
}

const chain = (rows) => ({
  lean: async () => rows,
  sort: () => chain(rows),
});

let placements = [];
let campaigns = [];
let creatives = [];

stub("models/adPlacement.model.js", { find: () => chain(placements) });
stub("models/adCampaign.model.js", { find: () => chain(campaigns) });
stub("models/adCreative.model.js", { find: () => chain(creatives) });
stub("models/setting.model.js", {
  findOne: () => ({
    lean: async () => ({ isGoogle: true, isFeedAdEnabled: true, adDisplayIndex: 10,
      android: { google: { native: "ca-app-pub-7177795034518472/5138218513" } } }),
  }),
});

const planService = require(path.join(BACKEND, "services/ads/adPlanService"));

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}` + (ok ? "" : `\n      expected ${JSON.stringify(expected)}\n      actual   ${JSON.stringify(actual)}`));
}

(async () => {
  // 1. Legacy fallback reproduces the old client behaviour: density 10, network fill.
  let plan = await planService.buildPlan({ userId: "u1", surface: "feed", contentCount: 20 });
  check("legacy density 10 -> slots at 9 and 19",
    plan.slots.map((s) => s.afterContentIndex), [9, 19]);
  check("legacy fill is network", plan.slots[0].fill.type, "network");

  // 2. Pagination continues the cadence instead of restarting it.
  planService.invalidateConfigCache();
  placements = [{ surface: "feed", enabled: true, density: 8, houseFillRatio: 0,
    android: { native: "ca-app-pub-x/1" }, ios: { native: "" } }];

  plan = await planService.buildPlan({ userId: "u2", surface: "feed", contentCount: 20, startContentIndex: 0 });
  check("page 1 density 8 -> slots at 7 and 15",
    plan.slots.map((s) => s.afterContentIndex), [7, 15]);

  plan = await planService.buildPlan({ userId: "u2", surface: "feed", contentCount: 20, startContentIndex: 20 });
  check("page 2 continues cadence -> 23, 31, 39",
    plan.slots.map((s) => s.afterContentIndex), [23, 31, 39]);

  // 3. Density floor clamps an admin typo.
  planService.invalidateConfigCache();
  placements = [{ surface: "feed", enabled: true, density: 1, houseFillRatio: 0,
    android: { native: "ca-app-pub-x/1" }, ios: { native: "" } }];
  plan = await planService.buildPlan({ userId: "u3", surface: "feed", contentCount: 20 });
  const gaps = plan.slots.slice(1).map((s, i) => s.afterContentIndex - plan.slots[i].afterContentIndex);
  check("density clamped to MIN_DENSITY", gaps.every((g) => g >= planService.MIN_DENSITY), true);

  // 4. Disabled surface returns an empty plan rather than an error.
  planService.invalidateConfigCache();
  placements = [{ surface: "feed", enabled: false, density: 8, houseFillRatio: 0,
    android: { native: "x" }, ios: { native: "" } }];
  plan = await planService.buildPlan({ userId: "u4", surface: "feed", contentCount: 20 });
  check("disabled surface -> no slots", plan.slots.length, 0);
  check("disabled surface -> reason", plan.reason, "surface_disabled");

  // 5. House campaign fills when ratio is 1.
  planService.invalidateConfigCache();
  placements = [{ surface: "feed", enabled: true, density: 8, houseFillRatio: 1,
    android: { native: "ca-app-pub-x/1" }, ios: { native: "" } }];
  campaigns = [{ _id: "c1", status: "active", priority: 5, capPerUserPerDay: 3, impressionGoal: 0,
    pacing: "asap", targeting: { surfaces: ["feed"], platforms: ["android"], countries: [] } }];
  creatives = [{ _id: "cr1", campaignId: "c1", format: "native", headline: "Get 50 coins",
    callToAction: "Claim", clickUrl: "funtapp://coins", reviewStatus: "approved", mediaAspectRatio: 1.91 }];
  plan = await planService.buildPlan({ userId: "u5", surface: "feed", contentCount: 20 });
  check("house fill ratio 1 -> house slots", plan.slots[0].fill.type, "house");
  check("house slot carries creative", plan.slots[0].fill.headline, "Get 50 coins");

  // 6. Targeting excludes a campaign on the wrong platform, falling back to network.
  planService.invalidateConfigCache();
  plan = await planService.buildPlan({ userId: "u6", surface: "feed", contentCount: 20, platform: "ios" });
  check("ios excluded by targeting, no ios unit -> no slots", plan.slots.length, 0);

  // 7. Network unit missing -> slot skipped rather than emitted empty.
  planService.invalidateConfigCache();
  placements = [{ surface: "feed", enabled: true, density: 8, houseFillRatio: 0,
    android: { native: "" }, ios: { native: "" } }];
  campaigns = []; creatives = [];
  plan = await planService.buildPlan({ userId: "u7", surface: "feed", contentCount: 20 });
  check("missing unit id -> no slots", plan.slots.length, 0);

  console.log(failures ? `\n${failures} FAILURE(S)` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
})();
