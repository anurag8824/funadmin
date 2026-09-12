/**
 * Load test for POST /client/ads/plan.
 *
 * The plan endpoint sits beside the feed fetch, so what matters is p99 under concurrency, not
 * throughput in isolation. The plan's target is 1 000 rps sustained with p99 under 40 ms.
 *
 *   node scripts/adPlanLoadTest.js --rps=340 --seconds=30 --users=5000
 *
 * Env: BASE_URL (default http://localhost:5000), secretKey (from .env).
 */

require("dotenv").config();

const BASE_URL = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const SECRET_KEY = process.env.secretKey || "";

function arg(name, fallback) {
  const match = process.argv.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split("=")[1] : fallback;
}

const TARGET_RPS = parseInt(arg("rps", "340"), 10);
const DURATION_SECONDS = parseInt(arg("seconds", "30"), 10);
const USER_POOL = parseInt(arg("users", "5000"), 10);
const SURFACE = arg("surface", "feed");

// A synthetic 24-hex id per virtual user. Frequency caps are per user, so reusing one id would
// hit the daily cap immediately and measure the rejection path instead of the plan path.
function syntheticUserId(index) {
  return index.toString(16).padStart(24, "0");
}

const latencies = [];
let sent = 0;
let ok = 0;
let failed = 0;
let emptyPlans = 0;
const statusCounts = {};

async function fireOne(userIndex, pageIndex) {
  const started = process.hrtime.bigint();
  try {
    const response = await fetch(`${BASE_URL}/client/ads/plan?userId=${syntheticUserId(userIndex)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", key: SECRET_KEY },
      body: JSON.stringify({
        surface: SURFACE,
        contentCount: 20,
        startContentIndex: pageIndex * 20,
        device: { platform: "android", appVersion: "1.1.8" },
      }),
    });
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    latencies.push(elapsedMs);
    statusCounts[response.status] = (statusCounts[response.status] || 0) + 1;

    if (response.ok) {
      ok += 1;
      const json = await response.json().catch(() => null);
      if (!json?.data?.slots?.length) emptyPlans += 1;
    } else {
      failed += 1;
    }
  } catch (err) {
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    latencies.push(elapsedMs);
    failed += 1;
    statusCounts[err.code || "network_error"] = (statusCounts[err.code || "network_error"] || 0) + 1;
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

async function main() {
  if (!SECRET_KEY) {
    console.error("secretKey is not set — every request would be rejected. Check .env.");
    process.exit(1);
  }

  console.log(
    `Load test: ${TARGET_RPS} rps for ${DURATION_SECONDS}s against ${BASE_URL} ` +
      `(surface=${SURFACE}, ${USER_POOL} virtual users)`,
  );

  const inFlight = new Set();
  const startedAtMs = Date.now();

  for (let tick = 0; tick < DURATION_SECONDS; tick += 1) {
    const tickStart = Date.now();
    for (let i = 0; i < TARGET_RPS; i += 1) {
      const userIndex = (sent % USER_POOL) + 1;
      const pageIndex = Math.floor(sent / USER_POOL) % 5;
      sent += 1;
      const promise = fireOne(userIndex, pageIndex).finally(() => inFlight.delete(promise));
      inFlight.add(promise);
    }
    // Pace to one batch per wall-clock second rather than as fast as the loop can spin.
    const elapsed = Date.now() - tickStart;
    if (elapsed < 1000) await new Promise((r) => setTimeout(r, 1000 - elapsed));
    process.stdout.write(
      `\r  t=${tick + 1}s sent=${sent} ok=${ok} failed=${failed} inflight=${inFlight.size}   `,
    );
  }

  await Promise.allSettled([...inFlight]);
  const wallSeconds = (Date.now() - startedAtMs) / 1000;

  const sorted = [...latencies].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, v) => sum + v, 0) / (sorted.length || 1);

  console.log("\n\n─── results ───────────────────────────────");
  console.log(`sent              ${sent}`);
  console.log(`ok                ${ok}`);
  console.log(`failed            ${failed}`);
  console.log(`empty plans       ${emptyPlans}  (capped, disabled, or no unit configured)`);
  console.log(`achieved rps      ${(sent / wallSeconds).toFixed(1)}`);
  console.log(`mean              ${mean.toFixed(1)} ms`);
  console.log(`p50               ${percentile(sorted, 50).toFixed(1)} ms`);
  console.log(`p95               ${percentile(sorted, 95).toFixed(1)} ms`);
  console.log(`p99               ${percentile(sorted, 99).toFixed(1)} ms`);
  console.log(`max               ${(sorted[sorted.length - 1] || 0).toFixed(1)} ms`);
  console.log(`status codes      ${JSON.stringify(statusCounts)}`);

  const p99 = percentile(sorted, 99);
  const budgetMs = 40;
  console.log("───────────────────────────────────────────");
  if (failed > sent * 0.001) {
    console.log(`FAIL  error rate ${((failed / sent) * 100).toFixed(2)}% exceeds 0.1%`);
    process.exit(1);
  }
  if (p99 > budgetMs) {
    console.log(`FAIL  p99 ${p99.toFixed(1)} ms exceeds the ${budgetMs} ms budget`);
    process.exit(1);
  }
  console.log(`PASS  p99 ${p99.toFixed(1)} ms within the ${budgetMs} ms budget`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
