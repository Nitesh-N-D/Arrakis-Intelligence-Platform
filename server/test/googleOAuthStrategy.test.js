import test from "node:test";
import assert from "node:assert/strict";
import { createGoogleVerifyCallback } from "../src/config/passport.js";

const runStrategy = (strategy, profile) => new Promise((resolve) => {
  strategy("provider-access-token", "provider-refresh-token", profile, (error, user) => resolve({ error, user }));
});

test("Google strategy rejects profiles without an explicitly verified email", async () => {
  let repositoryCalls = 0;
  const strategy = createGoogleVerifyCallback({
    async findByGoogleId() { repositoryCalls += 1; },
    async findByEmail() { repositoryCalls += 1; },
    async create() { repositoryCalls += 1; }
  });

  for (const emails of [undefined, [], [{ value: "person@example.test", verified: false }]]) {
    const { error, user } = await runStrategy(strategy, { id: "google-1", emails });
    assert.match(error.message, /verified email/);
    assert.equal(user, undefined);
  }
  assert.equal(repositoryCalls, 0);
});

test("Google strategy links a verified email to the existing account", async () => {
  const calls = [];
  const existing = { id: "user-1", name: "Existing Name", provider: "local", googleId: null };
  const linked = { ...existing, provider: "google", googleId: "google-2" };
  const strategy = createGoogleVerifyCallback({
    async findByGoogleId(id) { calls.push(["google", id]); return null; },
    async findByEmail(email) { calls.push(["email", email]); return existing; },
    async updateById(...args) { calls.push(["update", ...args]); return linked; }
  });

  const { error, user } = await runStrategy(strategy, {
    id: "google-2",
    displayName: "Provider Name",
    emails: [
      { value: "unverified@example.test", verified: false },
      { value: "  PERSON@Example.Test ", verified: true }
    ]
  });
  assert.equal(error, null);
  assert.equal(user, linked);
  assert.deepEqual(calls, [
    ["google", "google-2"],
    ["email", "person@example.test"],
    ["update", "user-1", { googleId: "google-2", provider: "google", name: "Existing Name" }]
  ]);
});

test("Google strategy creates a new account from a verified email", async () => {
  const calls = [];
  const created = { id: "user-2", email: "new@example.test", provider: "google" };
  const strategy = createGoogleVerifyCallback({
    async findByGoogleId() { return null; },
    async findByEmail() { return null; },
    async create(data) { calls.push(data); return created; }
  });
  const { error, user } = await runStrategy(strategy, {
    id: "google-3",
    displayName: "New User",
    emails: [{ value: "NEW@example.test", verified: true }]
  });

  assert.equal(error, null);
  assert.equal(user, created);
  assert.deepEqual(calls, [{
    name: "New User",
    email: "new@example.test",
    provider: "google",
    googleId: "google-3"
  }]);
});
