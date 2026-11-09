import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHandshakeStatus,
  detectBrowser,
  getHostFromUrl,
  getJwtSubject,
  getNextPendingSyncAt,
  getSafeExtensionErrorMessage,
  isOverrideActive,
  matchesBlockedSite,
  normalizePattern,
  shouldClearActivityForAccount
} from "../../extension/domainRules.js";

test("extension block matching normalizes host patterns and includes subdomains only", () => {
  assert.equal(normalizePattern(" HTTPS://WWW.YouTube.com/watch?v=1 "), "youtube.com");
  assert.equal(getHostFromUrl("https://m.youtube.com/watch"), "m.youtube.com");
  assert.equal(matchesBlockedSite("https://youtube.com/watch", ["www.youtube.com"]), true);
  assert.equal(matchesBlockedSite("https://m.youtube.com/watch", ["youtube.com"]), true);
  assert.equal(matchesBlockedSite("https://notyoutube.com/", ["youtube.com"]), false);
  assert.equal(matchesBlockedSite("https://youtube.com.attacker.test/", ["youtube.com"]), false);
});

test("extension rejects malformed host patterns and unsupported URLs", () => {
  for (const value of ["", "localhost", "bad..example.com", "-bad.example.com", "user@example.com", "https://[::1]"]) {
    assert.equal(normalizePattern(value), "", `${value} should be rejected`);
  }
  assert.equal(getHostFromUrl("javascript:alert(1)"), "");
  assert.equal(matchesBlockedSite("file:///tmp/page", ["example.com"]), false);
});

test("temporary block overrides are active only before their expiration", () => {
  assert.equal(isOverrideActive(2_000, 1_999), true);
  assert.equal(isOverrideActive(2_000, 2_000), false);
  assert.equal(isOverrideActive(0, 1_000), false);
  assert.equal(isOverrideActive("not-a-time", 1_000), false);
});

test("pending sync scheduling respects retry time and expires records after the TTL", () => {
  const now = Date.parse("2026-01-01T00:00:00Z");
  const buffer = { "example.com": { pendingSync: { createdAt: new Date(now).toISOString(), nextAttemptAt: now + 5000 } } };
  assert.equal(getNextPendingSyncAt(buffer, now), now + 5000);
  assert.equal(getNextPendingSyncAt(buffer, now + 24 * 60 * 60 * 1000), null);
  assert.equal(getNextPendingSyncAt({ broken: { pendingSync: { createdAt: "bad", nextAttemptAt: now } } }, now), null);
});

test("extension account handoff accepts only unexpired JWT subjects", () => {
  const now = 1_800_000_000_000;
  const encode = (claims) => `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
  assert.equal(getJwtSubject(encode({ sub: "operative-1", exp: now / 1000 + 60 }), now), "operative-1");
  assert.equal(getJwtSubject(encode({ sub: "operative-1", exp: now / 1000 - 1 }), now), "");
  assert.equal(getJwtSubject("not-a-token", now), "");
  assert.equal(shouldClearActivityForAccount("operative-1", "operative-2"), true);
  assert.equal(shouldClearActivityForAccount("operative-1", "operative-1"), false);
  assert.equal(shouldClearActivityForAccount("", "operative-1", true), true);
  assert.equal(shouldClearActivityForAccount("", "operative-1", false), false);
});

test("extension error messages never reflect raw error contents", () => {
  const error = Object.assign(new Error("https://api.example/?token=secret"), { name: "TypeError" });
  const message = getSafeExtensionErrorMessage(error);

  assert.equal(message, "The request failed. Check your connection and API URL.");
  assert.equal(message.includes("secret"), false);
  assert.match(getSafeExtensionErrorMessage(Object.assign(new Error("secret"), { name: "AbortError" })), /timed out/);
  assert.match(getSafeExtensionErrorMessage(new Error("secret")), /extension action failed/i);
});

const fakeToken = (claims) => `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;

test("browser detection reports Edge only for real Edge brands or Edg/ user agents", () => {
  assert.equal(detectBrowser({ brands: [{ brand: "Microsoft Edge" }, { brand: "Chromium" }] }), "edge");
  assert.equal(detectBrowser(undefined, "Mozilla/5.0 Chrome/140.0 Safari/537.36 Edg/140.0"), "edge");
  assert.equal(detectBrowser({ brands: [{ brand: "Google Chrome" }] }, "Mozilla/5.0 Chrome/140.0"), "other-chromium");
  assert.equal(detectBrowser(null, ""), "other-chromium");
});

test("handshake status never exposes tokens, subjects or hostnames", () => {
  const now = Date.UTC(2026, 10, 9);
  const jwtToken = fakeToken({ sub: "user-1", exp: now / 1000 + 600 });
  const status = buildHandshakeStatus({
    manifest: { version: "1.1.0", permissions: ["storage", "tabs", "alarms"], host_permissions: ["https://*/*"] },
    settings: {
      jwtToken,
      accountSubject: "user-1",
      blockedSites: ["youtube.com"],
      strictMode: true,
      activityBuffer: { "secret-host.example": { seconds: 30, pendingSync: { minutes: 1 } } },
      lastDeliveryStatus: { state: "success", message: "Synced 1 minute(s) for secret-host.example", updatedAt: "2026-11-09T00:00:00.000Z" }
    },
    browser: "edge",
    expectedSubject: "user-1",
    now
  });
  assert.equal(status.connected, true);
  assert.equal(status.accountMatches, true);
  assert.equal(status.pendingEvents, 1);
  assert.equal(status.blockedSiteCount, 1);
  assert.deepEqual(status.lastSync, { state: "success", updatedAt: "2026-11-09T00:00:00.000Z" });
  const serialized = JSON.stringify(status);
  for (const secret of [jwtToken, "user-1", "secret-host", "youtube"]) assert.equal(serialized.includes(secret), false, secret);

  const other = buildHandshakeStatus({ settings: { jwtToken }, expectedSubject: "user-2", now });
  assert.equal(other.accountMatches, false);
  const expired = buildHandshakeStatus({ settings: { jwtToken }, expectedSubject: "user-1", now: now + 3600 * 1000 });
  assert.equal(expired.connected, false);
});

test("isBlockingActive honours the account blocking policy", async () => {
  const { isBlockingActive } = await import("../../extension/domainRules.js");
  assert.equal(isBlockingActive({}), true);
  assert.equal(isBlockingActive({ blockingPolicy: "always" }), true);
  assert.equal(isBlockingActive({ blockingPolicy: "off" }), false);
  assert.equal(isBlockingActive({ blockingPolicy: "focus-only", focusActive: false }), false);
  assert.equal(isBlockingActive({ blockingPolicy: "focus-only", focusActive: true }), true);
  assert.equal(isBlockingActive({ blockingPolicy: "bogus" }), true);
});

test("normalizeExtensionPolicy adopts only the signed-in account's policy", async () => {
  const { normalizeExtensionPolicy } = await import("../../extension/domainRules.js");
  const policy = {
    accountId: "user-1",
    version: 4,
    blockedSites: ["https://www.YouTube.com/watch", "reddit.com", "not a host", "reddit.com"],
    strictMode: 1,
    overrideMinutes: 500,
    blockingPolicy: "focus-only",
    trackingPaused: true,
    focusActive: false
  };
  assert.equal(normalizeExtensionPolicy(policy, "user-2"), null);
  assert.equal(normalizeExtensionPolicy(policy, ""), null);
  assert.equal(normalizeExtensionPolicy({ ...policy, version: -1 }, "user-1"), null);
  assert.equal(normalizeExtensionPolicy(null, "user-1"), null);
  const next = normalizeExtensionPolicy(policy, "user-1", Date.UTC(2026, 10, 9));
  assert.deepEqual(next, {
    blockedSites: ["youtube.com", "reddit.com"],
    strictMode: true,
    overrideMinutes: 60,
    blockingPolicy: "focus-only",
    trackingPaused: true,
    focusActive: false,
    policyVersion: 4,
    policyAccount: "user-1",
    policySyncedAt: "2026-11-09T00:00:00.000Z"
  });
});

test("handshake status reports policy sync state without account identifiers", () => {
  const status = buildHandshakeStatus({ settings: { blockingPolicy: "off", trackingPaused: true, policyVersion: 3, policySyncedAt: "2026-11-09T00:00:00.000Z" } });
  assert.equal(status.blockingPolicy, "off");
  assert.equal(status.trackingPaused, true);
  assert.equal(status.policyVersion, 3);
  assert.equal(status.policySyncedAt, "2026-11-09T00:00:00.000Z");
  assert.equal(JSON.stringify(status).includes("policyAccount"), false);
});
