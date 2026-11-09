import test from "node:test";
import assert from "node:assert/strict";
import { browserIsEdge, createPing, describeStatus, parseHello, runHandshake } from "../src/utils/extensionHandshake.js";

const origin = "http://localhost:5173";
const hello = (status, extra = {}) => ({
  origin,
  data: { source: "arrakis-extension", type: "EXTENSION_HELLO", nonce: "n1", status, ...extra }
});
const validStatus = {
  protocol: 1, version: "1.1.0", browser: "edge", connected: true, accountMatches: true,
  permissions: ["storage", "tabs"], hostAccess: "all-http-https-sites", blockedSiteCount: 2,
  strictMode: false, pendingEvents: 0, lastSync: { state: "success", updatedAt: "2026-11-09T00:00:00.000Z" }
};

test("ping carries a nonce and only the user id", () => {
  assert.deepEqual(Object.keys(createPing("n1", "u1")).sort(), ["nonce", "source", "type", "userId"]);
  assert.equal(createPing("n1", { evil: true }).userId, "");
});

test("hello replies are rejected unless origin, source, type and nonce all match", () => {
  assert.equal(parseHello({ ...hello(validStatus), origin: "https://evil.example" }, { nonce: "n1", origin }), null);
  assert.equal(parseHello(hello(validStatus, { nonce: "other" }), { nonce: "n1", origin }), null);
  assert.equal(parseHello(hello(validStatus, { source: "arrakis-platform" }), { nonce: "n1", origin }), null);
  assert.equal(parseHello(hello(validStatus), { nonce: "n1", origin }).state, "detected");
});

test("hello payload is sanitised", () => {
  const parsed = parseHello(hello({ ...validStatus, version: "<script>", browser: "chrome", pendingEvents: -4, lastSync: { state: "pwned", updatedAt: "nope" } }), { nonce: "n1", origin });
  assert.equal(parsed.version, "unknown");
  assert.equal(parsed.browser, "other-chromium");
  assert.equal(parsed.pendingEvents, 0);
  assert.deepEqual(parsed.lastSync, { state: "idle", updatedAt: null });
  assert.equal(parseHello(hello({ ...validStatus, protocol: 2 }), { nonce: "n1", origin }).state, "incompatible");
});

test("status descriptions distinguish not detected, signed out, wrong account and connected", () => {
  assert.equal(describeStatus({ state: "not-detected" }).title, "Extension not detected");
  assert.equal(describeStatus({ state: "detected", connected: false }).tone, "warning");
  assert.match(describeStatus({ state: "detected", connected: true, accountMatches: false }).title, /different account/);
  assert.equal(describeStatus({ state: "detected", connected: true, accountMatches: true }).tone, "success");
});

test("Edge detection uses brands or the Edg/ token", () => {
  assert.equal(browserIsEdge({ userAgentData: { brands: [{ brand: "Microsoft Edge" }] } }), true);
  assert.equal(browserIsEdge({ userAgent: "Mozilla/5.0 Chrome/140 Edg/140.0" }), true);
  assert.equal(browserIsEdge({ userAgent: "Mozilla/5.0 Chrome/140" }), false);
});

function fakeWindow(currentOrigin, responder) {
  const listeners = new Set();
  const win = {
    location: { origin: currentOrigin },
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    postMessage(message) {
      const reply = responder?.(message);
      if (reply) setTimeout(() => listeners.forEach((listener) => listener({ source: win, origin: currentOrigin, data: reply })), 5);
    },
    listenerCount: () => listeners.size
  };
  return win;
}

test("handshake resolves detected only when the extension answers", async () => {
  const answering = fakeWindow(origin, (ping) => ({ source: "arrakis-extension", type: "EXTENSION_HELLO", nonce: ping.nonce, status: validStatus }));
  assert.equal((await runHandshake({ win: answering, timeoutMs: 200 })).state, "detected");
  assert.equal(answering.listenerCount(), 0);

  const silent = fakeWindow(origin, () => null);
  assert.equal((await runHandshake({ win: silent, timeoutMs: 20 })).state, "not-detected");

  const untrusted = fakeWindow("https://preview.example", () => null);
  assert.equal((await runHandshake({ win: untrusted, timeoutMs: 20 })).state, "unsupported-origin");
});
