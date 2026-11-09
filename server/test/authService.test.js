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

test("registration rejects malformed email, invalid roles, and bcrypt-truncated passwords", async () => {
  const malformed = createService().service;
  await assert.rejects(malformed.register({ name: "Valid Name", email: "bad@", password: "12345678" }), { statusCode: 400 });
  await assert.rejects(malformed.register({ name: "Valid Name", email: "valid@example.com", password: "12345678", targetRole: "<script>x</script>" }), { statusCode: 400 });
  await assert.rejects(malformed.register({ name: "Valid Name", email: "valid@example.com", password: "12345678", targetRole: "R".repeat(81) }), { statusCode: 400 });
  await assert.rejects(malformed.register({ name: "Valid Name", email: "valid@example.com", password: "12345678", career: { roleId: "not-a-role" } }), { statusCode: 400 });
  await assert.rejects(malformed.register({ name: "Valid Name", email: "valid@example.com", password: "x".repeat(73) }), { statusCode: 400 });
});

test("registration maps a concurrent unique-email insert collision to the existing-account response", async () => {
  const service = new AuthService({
    userRepository: {
      async findByEmail() { return null; },
      async create() { throw Object.assign(new Error("duplicate key"), { code: 11000, keyPattern: { email: 1 } }); }
    },
    tokenService: { async issueTokens() { throw new Error("tokens must not be issued"); } }
  });

  await assert.rejects(
    service.register({ name: "Valid Name", email: "race@example.com", password: "valid password", targetRole: "AI Systems Engineer" }),
    { statusCode: 409, message: "A user with this email already exists" }
  );
});

test("registration stores a server-resolved catalogue career and ignores client-supplied role details", async () => {
  const { service, state } = createService();
  await service.register({
    name: "Operative",
    email: "career@example.com",
    password: "a strong password",
    targetRole: "Something Else",
    career: { roleId: "frontend-developer", title: "Spoofed", isCustom: false, experienceLevel: "beginner", timelineMonths: 6 }
  });
  assert.equal(state.created.targetRole, "Frontend Developer");
  assert.equal(state.created.career.roleId, "frontend-developer");
  assert.equal(state.created.career.title, "Frontend Developer");
  assert.equal(state.created.career.experienceLevel, "beginner");
  assert.equal(state.created.career.timelineMonths, 6);
  assert.equal(state.created.career.selectionPending, false);
});

test("registration accepts a validated custom career", async () => {
  const { service, state } = createService();
  await service.register({
    name: "Operative",
    email: "custom@example.com",
    password: "a strong password",
    career: { roleId: "custom", customTitle: "  Robotics   Software Engineer ", customSkills: ["python", "ros", "Python"] }
  });
  assert.equal(state.created.targetRole, "Robotics Software Engineer");
  assert.equal(state.created.career.isCustom, true);
  assert.deepEqual(state.created.career.customSkills.map((skill) => skill.name), ["Python", "ros"]);
});
