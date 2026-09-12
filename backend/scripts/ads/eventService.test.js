/* Smoke test for adEventService: validation, counters, and the invalid-traffic soft block. */
const path = require("path");
const BACKEND = path.resolve(__dirname, "../..");
delete process.env.REDIS_URL;

const inserted = [];
function stub(relPath, value) {
  const full = require.resolve(path.join(BACKEND, relPath));
  require.cache[full] = { id: full, filename: full, loaded: true, exports: value };
}
stub("models/adEvent.model.js", {
  insertMany: async (docs) => { inserted.push(...docs); return docs; },
  aggregate: async () => [
    { _id: { surface: "feed", event: "requested" }, count: 100 },
    { _id: { surface: "feed", event: "filled" }, count: 90 },
    { _id: { surface: "feed", event: "rendered" }, count: 85 },
    { _id: { surface: "feed", event: "viewable" }, count: 60 },
  ],
});

const svc = require(path.join(BACKEND, "services/ads/adEventService"));
const counters = require(path.join(BACKEND, "services/ads/adCounterStore"));

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}` + (ok ? "" : `  expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`));
}

const ev = (event, extra = {}) => ({ event, slotId: "pln_a:0", planId: "pln_a", surface: "feed", ts: Date.now(), ...extra });
const USER = "507f1f77bcf86cd799439011";

(async () => {
  // Validation
  let r = await svc.ingestBatch({ userId: USER, events: [] });
  check("empty batch rejected", r.status, 400);

  r = await svc.ingestBatch({ userId: USER, events: new Array(51).fill(ev("rendered")) });
  check("oversize batch rejected", r.status, 400);

  r = await svc.ingestBatch({ userId: USER, events: [ev("not_a_real_event")] });
  check("unknown event name rejected", r.status, 400);

  r = await svc.ingestBatch({ userId: USER, events: [ev("rendered"), ev("bogus")] });
  check("mixed batch accepts valid only", r.body.data.accepted, 1);
  check("mixed batch reports rejected", r.body.data.rejected, 1);

  // Bad ObjectIds must not throw.
  r = await svc.ingestBatch({ userId: "not-an-objectid", events: [ev("rendered", { campaignId: "nope" })] });
  check("invalid ids tolerated", r.status, 200);

  // Quality checks judge the previous settled 5-minute bucket, so the clock has to advance
  // between filling a bucket and expecting a verdict.
  const realNow = Date.now;
  let clockOffsetMs = 0;
  Date.now = () => realNow() + clockOffsetMs;
  const advanceOneBucket = () => { clockOffsetMs += 5 * 60 * 1000 + 1000; };

  // Live bucket must never produce a verdict, however lopsided it looks.
  const scroller = "507f1f77bcf86cd799439055";
  for (let i = 0; i < 40; i += 1) await svc.ingestBatch({ userId: scroller, events: [ev("requested")] });
  check("live bucket never blocks", await counters.isUserBlocked(scroller), false);

  // Healthy traffic: 30 requests, 28 rendered in one bucket -> no block once settled.
  const healthy = "507f1f77bcf86cd799439022";
  for (let i = 0; i < 30; i += 1) await svc.ingestBatch({ userId: healthy, events: [ev("requested")] });
  for (let i = 0; i < 28; i += 1) await svc.ingestBatch({ userId: healthy, events: [ev("rendered")] });
  advanceOneBucket();
  await svc.ingestBatch({ userId: healthy, events: [ev("rendered")] });
  check("healthy user not blocked", await counters.isUserBlocked(healthy), false);

  // Bad traffic: 40 requests, 5 rendered -> ratio 0.125, must block once settled.
  const bot = "507f1f77bcf86cd799439033";
  for (let i = 0; i < 40; i += 1) await svc.ingestBatch({ userId: bot, events: [ev("requested")] });
  for (let i = 0; i < 5; i += 1) await svc.ingestBatch({ userId: bot, events: [ev("rendered")] });
  advanceOneBucket();
  await svc.ingestBatch({ userId: bot, events: [ev("rendered")] });
  check("low impression ratio blocks", await counters.isUserBlocked(bot), true);

  // Implausible CTR must block even with a good impression ratio.
  const clicker = "507f1f77bcf86cd799439044";
  for (let i = 0; i < 30; i += 1) await svc.ingestBatch({ userId: clicker, events: [ev("requested")] });
  for (let i = 0; i < 30; i += 1) await svc.ingestBatch({ userId: clicker, events: [ev("rendered")] });
  for (let i = 0; i < 20; i += 1) await svc.ingestBatch({ userId: clicker, events: [ev("clicked")] });
  advanceOneBucket();
  await svc.ingestBatch({ userId: clicker, events: [ev("rendered")] });
  check("implausible CTR blocks", await counters.isUserBlocked(clicker), true);

  // A few in-flight requests must not trip the ratio check.
  const slack = "507f1f77bcf86cd799439066";
  for (let i = 0; i < 25; i += 1) await svc.ingestBatch({ userId: slack, events: [ev("requested")] });
  for (let i = 0; i < 17; i += 1) await svc.ingestBatch({ userId: slack, events: [ev("rendered")] });
  advanceOneBucket();
  await svc.ingestBatch({ userId: slack, events: [ev("rendered")] });
  check("in-flight slack tolerated", await counters.isUserBlocked(slack), false);

  Date.now = realNow;

  // Rollup maths
  const stats = await svc.readSurfaceStats({ sinceMs: 0 });
  check("fill rate", stats[0].fillRate, 0.9);
  check("impression ratio", stats[0].impressionRatio, 0.85);
  check("viewability rate", stats[0].viewabilityRate, Number((60 / 85).toFixed(3)));

  console.log(failures ? `\n${failures} FAILURE(S)` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
})();
