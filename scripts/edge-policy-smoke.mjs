// Usage: npm i --no-save playwright-core@1.56.1 && node scripts/edge-policy-smoke.mjs extension
// Requires Microsoft Edge at the default Windows path and free ports 5055/5056. Not run in CI (CI has no Edge).
// Real-Edge smoke: extension policy pull/push/conflict against a local mock API, plus focus-only blocking.
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { chromium } from "playwright-core";

const EXT = path.resolve(process.argv[2]);
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (sub) => `${b64({ alg: "HS256" })}.${b64({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;

let policy = { accountId: "user-1", version: 3, updatedAt: null, blockedSites: ["blocked.test"], strictMode: false, overrideMinutes: 5, blockingPolicy: "focus-only", trackingPaused: false, focusActive: false, blockingActive: false };
let forceConflict = false;
const log = [];
const api = http.createServer((req, res) => {
  const headers = { "content-type": "application/json", "access-control-allow-origin": req.headers.origin || "*", "access-control-allow-headers": "authorization,content-type", "access-control-allow-methods": "GET,PUT" };
  if (req.method === "OPTIONS") { res.writeHead(204, headers); return res.end(); }
  let body = "";
  req.on("data", (c) => { body += c; });
  req.on("end", () => {
    log.push(`${req.method} ${req.url}`);
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

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "arrakis-edge-policy-"));
const context = await chromium.launchPersistentContext(profile, { executablePath: EDGE, headless: false, args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--host-resolver-rules=MAP blocked.test 127.0.0.1"] });
const results = {};
try {
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 15000 });
  const extId = new URL(worker.url()).host;
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  const save = (blockedSites) => popup.evaluate(([t, sites]) => chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", payload: { backendUrl: "http://localhost:5055/api/v1", jwtToken: t, blockedSites: sites, strictMode: false, overrideMinutes: 5 } }), [token("user-1"), blockedSites]);

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

  forceConflict = true;
  const second = await save(["local-only.test"]);
  results.conflictSync = second.sync;
  results.afterConflict = await worker.evaluate(() => chrome.storage.local.get(["blockedSites", "policyVersion"]));

  forceConflict = false;
  policy = { ...policy, accountId: "someone-else", version: 99, blockedSites: ["leak.test"] };
  const third = await save(["mine.test"]);
  results.foreignAccountSync = third.sync;
  results.afterForeign = await worker.evaluate(() => chrome.storage.local.get(["blockedSites", "policyVersion"]));
  results.requests = log;
} finally {
  await context.close();
  api.close(); site.close();
}
console.log(JSON.stringify(results, null, 2));
const ok = results.firstSync === "synced"
  && results.afterPush.policyVersion === 4 && results.afterPush.blockedSites.join() === "blocked.test,extra.test" && results.afterPush.policyAccount === "user-1"
  && results.focusOnlyIdleUrl === "not-blocked" && results.focusOnlyActiveUrl === "blocked"
  && results.conflictSync === "conflict" && results.afterConflict.blockedSites.join() === "server-wins.test"
  && results.foreignAccountSync !== "synced" && !results.afterForeign.blockedSites.includes("leak.test");
console.log(ok ? "EDGE POLICY SMOKE: PASS" : "EDGE POLICY SMOKE: FAIL");
process.exit(ok ? 0 : 1);
