import test from "node:test";
import assert from "node:assert/strict";
import { AuthController } from "../src/controllers/authController.js";
import { env } from "../src/config/env.js";

const makeResponse = () => ({
  cookies: [],
  clearedCookies: [],
  status(code) { this.statusCode = code; return this; },
  cookie(name, value, options) { this.cookies.push({ name, value, options }); return this; },
  clearCookie(name, options) { this.clearedCookies.push({ name, options }); return this; },
  json(body) { this.body = body; return this; },
  redirect(url) { this.redirectUrl = url; return this; }
});

const publicUser = {
  id: "operative-1",
  name: "Test Operative",
  email: "operative@example.test",
  role: "user",
  passwordHash: "must-never-be-serialized",
  refreshTokens: ["must-never-be-serialized"],
  avatarUrl: "",
  bio: "",
  totalSpice: 0,
  currentRank: "Outworlder",
  targetRole: "AI Systems Engineer",
  focusStreak: 0,
  stormModeActive: false,
  skills: [],
  organizationId: null,
  teamRole: "member",
  onboarding: { completed: false },
  preferences: {},
  team: null
};

test("registration sends request metadata, sets an HTTP-only refresh cookie, and omits secrets", async () => {
  const calls = [];
  const controller = new AuthController({
    authService: { async register(...args) { calls.push(args); return { user: publicUser, accessToken: "access", refreshToken: "refresh" }; } }
  });
  const res = makeResponse();
  await controller.register({
    body: { name: publicUser.name },
    headers: { "user-agent": "test-agent" },
    ip: "203.0.113.10"
  }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(calls[0], [{ name: publicUser.name }, { userAgent: "test-agent", ipAddress: "203.0.113.10" }]);
  assert.equal(res.cookies[0].name, env.refreshCookieName);
  assert.equal(res.cookies[0].value, "refresh");
  assert.equal(res.cookies[0].options.httpOnly, true);
  assert.equal(res.cookies[0].options.path, "/");
  assert.equal(res.body.data.accessToken, "access");
  assert.equal("passwordHash" in res.body.data.user, false);
  assert.equal("refreshTokens" in res.body.data.user, false);
});

test("refresh rotates only the cookie token and logout revokes and clears it", async () => {
  const calls = [];
  const controller = new AuthController({
    authService: {
      async refresh(...args) { calls.push(["refresh", ...args]); return { accessToken: "new-access", refreshToken: "new-refresh" }; },
      async logout(token) { calls.push(["logout", token]); }
    }
  });
  const refreshResponse = makeResponse();
  await controller.refresh({ cookies: { [env.refreshCookieName]: "old-refresh" }, headers: {}, ip: "198.51.100.2" }, refreshResponse);
  assert.deepEqual(calls[0], ["refresh", "old-refresh", { userAgent: undefined, ipAddress: "198.51.100.2" }]);
  assert.deepEqual(refreshResponse.body, { success: true, data: { accessToken: "new-access" } });
  assert.equal(refreshResponse.cookies[0].value, "new-refresh");

  const logoutResponse = makeResponse();
  await controller.logout({ cookies: { [env.refreshCookieName]: "new-refresh" } }, logoutResponse);
  assert.deepEqual(calls[1], ["logout", "new-refresh"]);
  assert.equal(logoutResponse.clearedCookies[0].name, env.refreshCookieName);
  assert.equal(logoutResponse.clearedCookies[0].options.httpOnly, true);
});

test("me reads and synchronizes only the authenticated operative", async () => {
  const calls = [];
  const controller = new AuthController({
    userRepository: { async findById(id) { calls.push(["find", id]); return publicUser; } },
    operativeStateService: { async syncUserState(user) { calls.push(["sync", user.id]); return user; } }
  });
  const res = makeResponse();
  await controller.me({ user: { id: "operative-1" } }, res);
  assert.deepEqual(calls, [["find", "operative-1"], ["sync", "operative-1"]]);
  assert.equal(res.body.data.id, "operative-1");
  assert.equal("passwordHash" in res.body.data, false);
});

test("Google OAuth endpoints report disabled configuration and refuse the flow", async () => {
  const controller = new AuthController({ isGoogleOAuthConfigured: () => false });
  const res = makeResponse();
  await controller.googleUrl({}, res);
  assert.deepEqual(res.body, { success: true, data: { enabled: false, url: null } });
  let error;
  await controller.ensureGoogleConfigured({}, {}, (value) => { error = value; });
  assert.equal(error.statusCode, 503);
});

test("Google callback creates a success redirect and refresh cookie from server-issued tokens", async () => {
  const calls = [];
  const controller = new AuthController({
    tokenService: { async issueTokens(...args) { calls.push(args); return { accessToken: "access", refreshToken: "refresh" }; } }
  });
  const res = makeResponse();
  await controller.googleCallback({ user: publicUser, headers: {}, ip: "203.0.113.11" }, res);
  assert.equal(calls[0][0], publicUser);
  assert.equal(res.cookies[0].value, "refresh");
  const redirect = new URL(res.redirectUrl);
  assert.equal(redirect.searchParams.get("provider"), "google");
  assert.equal(redirect.searchParams.get("auth"), "success");
});
