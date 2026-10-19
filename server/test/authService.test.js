import test from "node:test";
import assert from "node:assert/strict";
import { AuthService } from "../src/services/authService.js";
import { comparePassword } from "../src/utils/password.js";

const createService = () => {
  const state = { lookups: [], created: null };
  const userRepository = {
    async findByEmail(email) { state.lookups.push(email); return null; },
    async create(data) { state.created = { ...data, id: "507f1f77bcf86cd799439011" }; return state.created; }
  };
  const tokenService = { async issueTokens() { return { accessToken: "mock-access", refreshToken: "mock-refresh" }; } };
  return { service: new AuthService({ userRepository, tokenService }), state };
};

test("registration normalizes email and hashes the password", async () => {
  const { service, state } = createService();
  const result = await service.register({
    name: "Operative",
    email: "  User@EXAMPLE.com ",
    password: "a strong password",
    targetRole: "AI Systems Engineer",
    skills: Array.from({ length: 130 }, (_, index) => ({ name: `Skill ${index} ${"x".repeat(100)}`, level: 9 }))
  });
  assert.deepEqual(state.lookups, ["user@example.com"]);
  assert.equal(state.created.email, "user@example.com");
  assert.notEqual(state.created.passwordHash, "a strong password");
  assert.equal(await comparePassword("a strong password", state.created.passwordHash), true);
  assert.equal(state.created.skills.length, 100);
  assert.equal(state.created.skills[0].name.length, 80);
  assert.equal(state.created.skills[0].level, 5);
  assert.equal(result.accessToken, "mock-access");
});

test("registration rejects malformed email, unsupported roles, and bcrypt-truncated passwords", async () => {
  const malformed = createService().service;
  await assert.rejects(malformed.register({ name: "Valid Name", email: "bad@", password: "12345678" }), { statusCode: 400 });
  await assert.rejects(malformed.register({ name: "Valid Name", email: "valid@example.com", password: "12345678", targetRole: "Unlisted role" }), { statusCode: 400 });
  await assert.rejects(malformed.register({ name: "Valid Name", email: "valid@example.com", password: "x".repeat(73) }), { statusCode: 400 });
});
