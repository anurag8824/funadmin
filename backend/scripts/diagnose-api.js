#!/usr/bin/env node
/**
 * Run on the server: node scripts/diagnose-api.js
 * Tests local API responsiveness without starting a second HTTP server.
 */
require("dotenv").config({ path: ".env" });
const http = require("http");

const PORT = process.env.PORT || 8000;
const SECRET = process.env.secretKey || process.env.SECRET_KEY;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: PORT,
        path,
        method: options.method || "GET",
        headers: options.headers || {},
        timeout: options.timeoutMs || 15000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode, body, ms: options.elapsed });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy(new Error(`timeout ${path}`));
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function timed(path, options) {
  const start = Date.now();
  const res = await request(path, options);
  res.ms = Date.now() - start;
  return res;
}

async function main() {
  console.log(`Diagnosing API on 127.0.0.1:${PORT}\n`);
  console.log("Waiting 5s for PM2 process to finish booting...\n");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  try {
    const ping = await timed("/ping");
    console.log(`GET /ping -> ${ping.status} (${ping.ms}ms) ${ping.body.slice(0, 80)}`);
  } catch (err) {
    console.error("GET /ping FAILED:", err.message);
  }

  try {
    const health = await timed("/health");
    console.log(`GET /health -> ${health.status} (${health.ms}ms)`);
  } catch (err) {
    console.error("GET /health FAILED:", err.message);
  }

  if (!SECRET) {
    console.warn("\nsecretKey not in env — skipping authenticated endpoints.");
    process.exit(0);
  }

  try {
    const ads = await timed("/client/setting/fetchAdSetting", {
      headers: { key: SECRET },
    });
    console.log(`GET /client/setting/fetchAdSetting -> ${ads.status} (${ads.ms}ms)`);
  } catch (err) {
    console.error("GET fetchAdSetting FAILED:", err.message);
  }

  try {
    const loginBody = JSON.stringify({
      loginType: 2,
      identity: "diagnostic-test",
      email: "diagnostic@test.local",
      name: "Diagnostic",
      fcmToken: "diagnostic-fcm-token",
      key: SECRET,
    });
    const login = await timed("/client/user/loginOrSignUp", {
      method: "POST",
      headers: {
        key: SECRET,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(loginBody),
      },
      body: loginBody,
    });
    console.log(`POST /client/user/loginOrSignUp -> ${login.status} (${login.ms}ms)`);
  } catch (err) {
    console.error("POST loginOrSignUp FAILED:", err.message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
