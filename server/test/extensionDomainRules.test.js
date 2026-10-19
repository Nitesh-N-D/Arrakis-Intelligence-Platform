import test from "node:test";
import assert from "node:assert/strict";
import {
  getHostFromUrl,
  getJwtSubject,
  getNextPendingSyncAt,
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
