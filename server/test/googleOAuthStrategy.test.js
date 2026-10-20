import test from "node:test";
import assert from "node:assert/strict";
import { createGoogleVerifyCallback } from "../src/config/passport.js";
import { createGoogleOAuthStateStore, googleOAuthStateCookie } from "../src/config/googleOAuthStateStore.js";

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

test("Google OAuth state is random, short-lived, HttpOnly, and browser-bound", () => {
  const store = createGoogleOAuthStateStore();
  const response = {
    cookies: [],
    clearedCookies: [],
    cookie(...args) { this.cookies.push(args); },
    clearCookie(...args) { this.clearedCookies.push(args); }
  };
  const req = { res: response };
  let state;
  store.store(req, null, {}, (error, value) => {
    assert.equal(error, null);
    state = value;
  });

  const [cookieName, cookieValue, options] = response.cookies[0];
  assert.equal(cookieName, googleOAuthStateCookie);
  assert.equal(cookieValue, state);
  assert.equal(state.length, 43);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.maxAge, 10 * 60 * 1000);
  assert.equal(options.path, "/api/v1/auth/google");

  req.cookies = { [googleOAuthStateCookie]: state };
  let verification;
  store.verify(req, state, (...args) => { verification = args; });
  assert.deepEqual(verification, [null, true]);
  assert.equal(response.clearedCookies[0][0], googleOAuthStateCookie);
});

test("Google OAuth state rejects missing and mismatched browser cookies", () => {
  const store = createGoogleOAuthStateStore();
  const req = { res: { clearCookie() {} }, cookies: { [googleOAuthStateCookie]: "wrong" } };
  let verification;
  store.verify(req, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", (...args) => { verification = args; });
  assert.equal(verification[0], null);
  assert.equal(verification[1], false);

  delete req.cookies[googleOAuthStateCookie];
  store.verify(req, undefined, (...args) => { verification = args; });
  assert.equal(verification[1], false);
});
