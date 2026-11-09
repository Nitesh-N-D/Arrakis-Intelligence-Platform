// Usage: npm --prefix client install --no-save --package-lock=false playwright-core@1.56.1 && node scripts/edge-policy-smoke.mjs extension
// Requires Microsoft Edge at the default Windows path and free ports 5055/5056. Not run in CI (CI has no Edge).
// Real-Edge smoke: policy isolation, blocking modes, tracking pause and offline retry against local mocks.
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright-core")); }
catch { ({ chromium } = require("../client/node_modules/playwright-core")); }

const EXT = path.resolve(process.argv[2]);
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const TEST_EXT = fs.mkdtempSync(path.join(os.tmpdir(), "arrakis-edge-policy-test-build-"));
fs.cpSync(EXT, TEST_EXT, { recursive: true });
for (const file of ["background.js", "content.js"]) {
  const filePath = path.join(TEST_EXT, file);
  fs.writeFileSync(filePath, fs.readFileSync(filePath, "utf8")
    .replaceAll("https://arrakis-intelligence-platform.vercel.app", "http://localhost:5173")
    .replaceAll("https://arrakis-intelligence-platform.onrender.com/api/v1", "http://localhost:5055/api/v1"));
}
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (sub) => `${b64({ alg: "HS256" })}.${b64({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;

let policy = { accountId: "user-1", version: 3, updatedAt: null, blockedSites: ["blocked.test"], strictMode: false, overrideMinutes: 5, blockingPolicy: "focus-only", trackingPaused: false, focusActive: false, blockingActive: false };
let forceConflict = false;
let stormAttempts = 0;
const log = [];
const api = http.createServer((req, res) => {
	const headers = { "content-type": "application/json", "access-control-allow-origin": req.headers.origin || "*", "access-control-allow-headers": "authorization,content-type", "access-control-allow-methods": "GET,PUT,POST" };
  if (req.method === "OPTIONS") { res.writeHead(204, headers); return res.end(); }
  let body = "";
  req.on("data", (c) => { body += c; });
  req.on("end", () => {
    log.push(`${req.method} ${req.url}`);
    if (req.url === "/api/v1/storm/log" && req.method === "POST") {
      stormAttempts += 1;
      res.writeHead(stormAttempts === 1 ? 503 : 200, headers);
      return res.end(JSON.stringify({ success: true, data: {} }));
    }
    if (req.url !== "/api/v1/profile/extension-policy") { res.writeHead(404, headers); return res.end("{}"); }
    if (req.method === "PUT") {
      const input = JSON.parse(body || "{}");
      log.push(`baseVersion=${input.baseVersion}`);
      if (forceConflict || input.baseVersion !== policy.version) {
        policy = { ...policy, version: policy.version + 1, blockedSites: ["server-wins.test"] };
        res.writeHead(409, headers); return res.end(JSON.stringify({ success: false, message: "conflict" }));
      }
      policy = { ...policy, version: policy.version + 1, blockedSites: input.blockedSites, strictMode: input.strictMode };
    }
    res.writeHead(200, headers);
    res.end(JSON.stringify({ success: true, data: policy }));
  });
});
await new Promise((r) => api.listen(5055, "localhost", r));
const site = http.createServer((_q, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end("<title>site</title>ok"); });
await new Promise((r) => site.listen(5056, "127.0.0.1", r));
const client = http.createServer((_q, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end("<!doctype html><title>Arrakis test client</title>"); });
await new Promise((r) => client.listen(5173, "localhost", r));

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "arrakis-edge-policy-"));
const context = await chromium.launchPersistentContext(profile, { executablePath: EDGE, headless: false, args: [`--disable-extensions-except=${TEST_EXT}`, `--load-extension=${TEST_EXT}`, "--host-resolver-rules=MAP blocked.test 127.0.0.1"] });
const results = {};
try {
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 15000 });
  const extId = new URL(worker.url()).host;
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  const app = await context.newPage();
  await app.goto("http://localhost:5173/");
  await app.evaluate((accessToken) => window.postMessage({ source: "arrakis-platform", type: "ACCESS_TOKEN_UPDATE", accessToken }, window.location.origin), token("user-1"));
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if ((await worker.evaluate(() => chrome.storage.local.get("accountSubject"))).accountSubject === "user-1") break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  const save = (sites) => popup.evaluate((blockedSites) => chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", payload: { blockedSites, strictMode: false, overrideMinutes: 5 } }), sites);

  const first = await save(["blocked.test", "extra.test"]);
  results.firstSync = first.sync;
  results.afterPush = await worker.evaluate(() => chrome.storage.local.get(["blockedSites", "policyVersion", "policyAccount", "blockingPolicy"]));

  const tab = await context.newPage();
  await tab.goto("http://blocked.test:5056/");
  await tab.waitForTimeout(1500);
  results.focusOnlyIdleUrl = tab.url().startsWith("chrome-extension://") ? "blocked" : "not-blocked";

  await worker.evaluate(() => chrome.storage.local.set({ focusActive: true }));
  await tab.goto("http://blocked.test:5056/?again");
  await tab.waitForTimeout(1500);
  results.focusOnlyActiveUrl = tab.url().startsWith("chrome-extension://") ? "blocked" : "not-blocked";

  await worker.evaluate(() => chrome.storage.local.set({ blockingPolicy: "always", focusActive: false }));
  await tab.goto("http://blocked.test:5056/?always");
  await tab.waitForTimeout(1500);
  results.alwaysModeUrl = tab.url().startsWith("chrome-extension://") ? "blocked" : "not-blocked";

  await worker.evaluate(() => chrome.storage.local.set({ blockingPolicy: "off", focusActive: true }));
  await tab.goto("http://blocked.test:5056/?never");
  await tab.waitForTimeout(1500);
  results.neverModeUrl = tab.url().startsWith("chrome-extension://") ? "blocked" : "not-blocked";

  for (let sample = 0; sample < 6; sample += 1) {
    await popup.evaluate(() => chrome.runtime.sendMessage({ type: "TRACK_SITE_ACTIVITY", payload: { host: "retry.test", durationSeconds: 10 } }));
  }
  const queued = await worker.evaluate(() => chrome.storage.local.get("activityBuffer"));
  results.offlineBuffered = Boolean(queued.activityBuffer?.["retry.test"]?.pendingSync);
  results.failedDeliveryAttempts = queued.activityBuffer?.["retry.test"]?.pendingSync?.attempts ?? null;
  results.retryAlarmScheduled = Boolean(await worker.evaluate(() => chrome.alarms.get("arrakis-pending-storm-sync")));
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await popup.evaluate(() => chrome.runtime.sendMessage({ type: "TRACK_SITE_ACTIVITY", payload: { host: "retry.test", durationSeconds: 10 } }));
  results.stormAttempts = stormAttempts;
  results.retryRecovered = stormAttempts === 2 && !(await worker.evaluate(() => chrome.storage.local.get("activityBuffer"))).activityBuffer?.["retry.test"]?.pendingSync;

  await worker.evaluate(() => chrome.storage.local.set({ trackingPaused: true }));
  results.pausedResponse = await popup.evaluate(() => chrome.runtime.sendMessage({ type: "TRACK_SITE_ACTIVITY", payload: { host: "paused.test", durationSeconds: 10 } }));
  results.pausedHostBuffered = Boolean((await worker.evaluate(() => chrome.storage.local.get("activityBuffer"))).activityBuffer?.["paused.test"]);

  forceConflict = true;
  const second = await save(["local-only.test"]);
  results.conflictSync = second.sync;
  results.afterConflict = await worker.evaluate(() => chrome.storage.local.get(["blockedSites", "policyVersion"]));

  forceConflict = false;
  policy = { ...policy, accountId: "someone-else", version: 99, blockedSites: ["leak.test"] };
  const third = await save(["mine.test"]);
  results.foreignAccountSync = third.sync;
  results.afterForeign = await worker.evaluate(() => chrome.storage.local.get(["blockedSites", "policyVersion"]));
  await app.evaluate((accessToken) => window.postMessage({ source: "arrakis-platform", type: "ACCESS_TOKEN_UPDATE", accessToken }, window.location.origin), token("user-2"));
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const current = await worker.evaluate(() => chrome.storage.local.get(["accountSubject", "policyAccount", "blockedSites"]));
    if (current.accountSubject === "user-2") break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  results.switchedAccountPolicy = await worker.evaluate(() => chrome.storage.local.get(["accountSubject", "policyAccount", "blockedSites"]));
  results.requests = log;
} finally {
  await context.close();
  api.close(); site.close(); client.close();
  fs.rmSync(TEST_EXT, { recursive: true, force: true });
}
console.log(JSON.stringify(results, null, 2));
const ok = results.firstSync === "synced"
  && results.afterPush.policyVersion === 4 && results.afterPush.blockedSites.join() === "blocked.test,extra.test" && results.afterPush.policyAccount === "user-1"
  && results.focusOnlyIdleUrl === "not-blocked" && results.focusOnlyActiveUrl === "blocked"
  && results.alwaysModeUrl === "blocked" && results.neverModeUrl === "not-blocked"
  && results.offlineBuffered && results.failedDeliveryAttempts === 1 && results.retryAlarmScheduled && results.retryRecovered
  && results.pausedResponse?.paused === true && !results.pausedHostBuffered
  && results.conflictSync === "conflict" && results.afterConflict.blockedSites.join() === "server-wins.test"
  && results.foreignAccountSync !== "synced" && !results.afterForeign.blockedSites.includes("leak.test")
  && results.switchedAccountPolicy.accountSubject === "user-2" && results.switchedAccountPolicy.policyAccount !== "user-1";
console.log(ok ? "EDGE POLICY SMOKE: PASS" : "EDGE POLICY SMOKE: FAIL");
process.exit(ok ? 0 : 1);
