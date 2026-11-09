// Usage: npm --prefix client install --no-save --package-lock=false playwright-core@1.56.1 && node scripts/edge-extension-smoke.mjs extension
// Requires Microsoft Edge installed at the default Windows path. Not run in CI (CI has no Edge).
// Real-Edge smoke test: loads the unpacked extension and verifies the handshake from a trusted and an untrusted origin.
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
const TEST_EXT = fs.mkdtempSync(path.join(os.tmpdir(), "arrakis-edge-extension-test-build-"));
fs.cpSync(EXT, TEST_EXT, { recursive: true });
for (const file of ["background.js", "content.js"]) {
  const filePath = path.join(TEST_EXT, file);
  fs.writeFileSync(filePath, fs.readFileSync(filePath, "utf8").replaceAll("https://arrakis-intelligence-platform.vercel.app", "http://localhost:5173"));
}
const page = "<!doctype html><title>t</title><p>arrakis handshake test</p>";
const serve = (port) => new Promise((resolve) => {
  const server = http.createServer((_req, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end(page); });
  server.listen(port, "localhost", () => resolve(server));
});
const ping = (p, userId) => p.evaluate((uid) => new Promise((resolve) => {
  const nonce = "n" + Math.random().toString(36).slice(2);
  const timer = setTimeout(() => resolve({ state: "not-detected" }), 2500);
  window.addEventListener("message", (event) => {
    if (event.source === window && event.data?.type === "EXTENSION_HELLO" && event.data.nonce === nonce) { clearTimeout(timer); resolve(event.data.status); }
  });
  window.postMessage({ source: "arrakis-platform", type: "EXTENSION_PING", nonce, userId: uid }, window.location.origin);
}), userId);

const servers = [await serve(5173), await serve(4173)];
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "arrakis-edge-"));
const context = await chromium.launchPersistentContext(profile, {
  executablePath: EDGE, headless: false,
  args: [`--disable-extensions-except=${TEST_EXT}`, `--load-extension=${TEST_EXT}`]
});
const results = {};
try {
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 15000 });
  results.workerUrl = worker.url().replace(/^chrome-extension:\/\/[a-z]+/, "chrome-extension://<id>");
  results.browserVersion = context.browser()?.version() ?? "persistent-context";
  results.userAgent = await worker.evaluate(() => navigator.userAgent);
  const trusted = await context.newPage();
  await trusted.goto("http://localhost:5173/");
  await trusted.waitForTimeout(800);
  results.trusted = await ping(trusted, "user-1");
  const untrusted = await context.newPage();
  await untrusted.goto("http://localhost:4173/");
  await untrusted.waitForTimeout(800);
  results.untrusted = await ping(untrusted, "user-1");
} finally {
  await context.close();
  servers.forEach((server) => server.close());
  fs.rmSync(TEST_EXT, { recursive: true, force: true });
}
console.log(JSON.stringify(results, null, 2));
const ok = results.trusted?.protocol === 1 && results.trusted.browser === "edge" && results.untrusted?.state === "not-detected"
  && !JSON.stringify(results.trusted).includes("user-1");
console.log(ok ? "EDGE HANDSHAKE SMOKE: PASS" : "EDGE HANDSHAKE SMOKE: FAIL");
process.exit(ok ? 0 : 1);
