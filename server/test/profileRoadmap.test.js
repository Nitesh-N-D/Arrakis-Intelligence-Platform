import test from "node:test";
import assert from "node:assert/strict";
import { ProfileService } from "../src/services/profileService.js";
import { RoadmapService } from "../src/services/roadmapService.js";

const userRecord = (id, overrides = {}) => ({
  id,
  name: "Arrakis User",
  email: `${id}@example.com`,
  provider: "local",
  targetRole: "AI Systems Engineer",
  skills: [],
  totalSpice: 0,
  currentRank: "Outworlder",
  focusStreak: 0,
  preferences: {
    focusDurationPreference: 50,
    stormWarningMinutes: 60,
    blockedSites: [],
    strictBlockMode: false,
    extensionOverrideMinutes: 5,
    theme: "dark",
    desktopNotificationsEnabled: true,
    stormAlarmEnabled: true,
    weeklyDigestEnabled: true
  },
  onboarding: { completed: false },
  ...overrides
});

test("profile mutations target only the requested account and normalize bounded fields", async () => {
  const calls = [];
  const repository = {
    async updateById(id, update) {
      calls.push({ id, update });
      return userRecord(id, update);
    }
  };
  const service = new ProfileService({ userRepository: repository });
  const result = await service.updateProfile("user-a", {
    name: "  A User  ",
    bio: "  Building useful systems  ",
    targetRole: "AI Systems Engineer",
    avatarUrl: "https://example.com/avatar.png",
    skills: [
      { name: "React", level: 8 },
      { name: "Node.js", level: -2 },
      { name: "", level: 3 }
    ]
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, "user-a");
  assert.equal(calls[0].update.name, "A User");
  assert.equal(calls[0].update.bio, "Building useful systems");
  assert.deepEqual(calls[0].update.skills, [
    { name: "React", level: 5 },
    { name: "Node.js", level: 1 }
  ]);
  assert.equal(result.id, "user-a");
});

test("profile validation rejects unsupported target roles and non-http avatar URLs", async () => {
  const service = new ProfileService({ userRepository: { updateById: async () => assert.fail("must not persist invalid profile") } });
  await assert.rejects(
    service.updateProfile("user-a", { name: "User", targetRole: "Unknown Role" }),
    { statusCode: 400 }
  );
  await assert.rejects(
    service.updateProfile("user-a", { name: "User", targetRole: "AI Systems Engineer", avatarUrl: "javascript:alert(1)" }),
    { statusCode: 400 }
  );
});

test("settings preserve unrelated preferences, clamp values, and scope writes by user ID", async () => {
  const calls = [];
  const repository = {
    async findById(id) { return userRecord(id); },
    async updateById(id, update) {
      calls.push({ id, update });
      return userRecord(id, update);
    }
  };
  const service = new ProfileService({ userRepository: repository });
  await service.updateSettings("user-b", {
    focusDurationPreference: 99,
    stormWarningMinutes: 500,
    blockedSites: "YouTube.com\nreddit.com\nyoutube.com",
    strictBlockMode: true,
    extensionOverrideMinutes: 0,
    theme: "light"
  });

  assert.equal(calls[0].id, "user-b");
  assert.deepEqual(calls[0].update.preferences, {
    focusDurationPreference: 50,
    stormWarningMinutes: 240,
    blockedSites: ["youtube.com", "reddit.com"],
    strictBlockMode: true,
    extensionOverrideMinutes: 1,
    theme: "dark",
    desktopNotificationsEnabled: true,
    stormAlarmEnabled: true,
    weeklyDigestEnabled: true
  });
});

test("malformed numeric settings fall back to stored preferences instead of persisting NaN", async () => {
  let update;
  const current = userRecord("user-d", {
    preferences: { ...userRecord("user-d").preferences, stormWarningMinutes: 45, extensionOverrideMinutes: 12 }
  });
  const service = new ProfileService({
    userRepository: {
      async findById() { return current; },
      async updateById(_id, value) { update = value; return userRecord("user-d", value); }
    }
  });

  await service.updateSettings("user-d", {
    stormWarningMinutes: "not-a-number",
    extensionOverrideMinutes: "also-invalid"
  });
  assert.equal(update.preferences.stormWarningMinutes, 45);
  assert.equal(update.preferences.extensionOverrideMinutes, 12);
  assert.ok(Number.isFinite(update.preferences.stormWarningMinutes));
  assert.ok(Number.isFinite(update.preferences.extensionOverrideMinutes));
});

test("roadmap completes only its active phase, advances once, and persists skill progress", async () => {
  const phases = [
    { id: "phase-1", skill: "Node.js", status: "active", startedAt: new Date(), completedAt: null },
    { id: "phase-2", skill: "React", status: "locked", startedAt: null, completedAt: null }
  ];
  const roadmap = { phases, currentPhaseIndex: 0, targetRole: "AI Systems Engineer" };
  const saved = [];
  const roadmapRepository = {
    async findByUser(userId) { assert.equal(userId, "user-c"); return roadmap; },
    async save(value) { saved.push(value.currentPhaseIndex); return value; }
  };
  const replaced = [];
  const service = new RoadmapService({
    roadmapRepository,
    userRepository: { async replaceSkillLevel(...args) { replaced.push(args); } }
  });
  const user = { id: "user-c", targetRole: "AI Systems Engineer", skills: [] };

  await assert.rejects(service.completePhase(user, "phase-2"), { statusCode: 409 });
  const result = await service.completePhase(user, "phase-1");
  assert.equal(result.currentPhaseIndex, 1);
  assert.equal(result.phases[0].status, "done");
  assert.ok(result.phases[0].completedAt instanceof Date);
  assert.equal(result.phases[1].status, "active");
  assert.equal(saved.length, 1);
  assert.deepEqual(replaced, [["user-c", "Node.js", 4]]);
});
