import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { DistractionLog } from "../src/models/DistractionLog.js";
import { FocusSession } from "../src/models/FocusSession.js";
import { RoadmapPlan } from "../src/models/RoadmapPlan.js";
import { RefreshToken } from "../src/models/RefreshToken.js";
import { Team } from "../src/models/Team.js";
import { User } from "../src/models/User.js";
import { AccountDataService } from "../src/services/accountDataService.js";
import { hashPassword } from "../src/utils/password.js";
import { connectTestReplicaSet, disconnectTestReplicaSet } from "./mongoReplicaSet.js";

let connected = false;
let ownerId;
let remainingUserId;
let teamId;

before(async () => {
  await connectTestReplicaSet();
  connected = true;
  await Promise.all([User.init(), Team.init(), FocusSession.init(), DistractionLog.init(), RoadmapPlan.init(), RefreshToken.init()]);
});

after(async () => {
  if (!connected) return;
  if (ownerId) {
    await Promise.all([
      FocusSession.deleteMany({ user: ownerId }),
      DistractionLog.deleteMany({ user: ownerId }),
      RoadmapPlan.deleteMany({ user: ownerId }),
      RefreshToken.deleteMany({ user: ownerId }),
      User.deleteOne({ _id: ownerId })
    ]);
  }
  if (teamId) await Team.deleteOne({ _id: teamId });
  if (remainingUserId) await User.deleteOne({ _id: remainingUserId });
  await disconnectTestReplicaSet();
});

test("export excludes credentials and account deletion transactionally clears private records and hands off team ownership", async () => {
  const suffix = randomUUID();
  const [owner, remaining] = await User.create([
    { name: "Export Owner", email: `export-owner-${suffix}@example.test`, passwordHash: await hashPassword("correct horse battery staple"), totalSpice: 50, focusStreak: 5 },
    { name: "Remaining Member", email: `export-member-${suffix}@example.test`, totalSpice: 13, focusStreak: 2 }
  ]);
  ownerId = owner._id;
  remainingUserId = remaining._id;
  const team = await Team.create({ name: `Export team ${suffix}`, members: [owner._id, remaining._id], createdBy: owner._id, totalSpice: 63, totalStreak: 7 });
  teamId = team._id;
  owner.team = team._id;
  remaining.team = team._id;
  await Promise.all([owner.save(), remaining.save()]);
  await FocusSession.create({ user: owner._id, duration: 25, type: "pomodoro-25", status: "completed", spiceEarned: 10, startedAt: new Date(Date.now() - 30 * 60_000), completedAt: new Date() });
  await DistractionLog.create({ user: owner._id, appName: "example.test", duration: 2, metadata: { site: "example.test" } });
  await RoadmapPlan.create({ user: owner._id, targetRole: "AI Systems Engineer", phases: [] });
  await RefreshToken.create({ user: owner._id, tokenHash: `fixture-${suffix}`, expiresAt: new Date(Date.now() + 60_000) });

  const service = new AccountDataService();
  const exported = await service.exportAccount(owner.id);
  assert.equal(exported.profile.email, owner.email);
  assert.equal(exported.focusSessions.length, 1);
  assert.equal(exported.distractionLogs.length, 1);
  assert.ok(exported.roadmap);
  assert.equal(Object.hasOwn(exported.profile, "passwordHash"), false);
  assert.equal(Object.hasOwn(exported.profile, "googleId"), false);

  const authTime = new Date(Date.now() - 60_000);
  await assert.rejects(service.deleteAccount(owner.id, {
    confirmationEmail: owner.email,
    confirmationText: "DELETE MY ACCOUNT",
    password: "wrong password",
    authTime
  }), { statusCode: 401 });
  assert.ok(await User.exists({ _id: owner._id }));

  await service.deleteAccount(owner.id, {
    confirmationEmail: owner.email,
    confirmationText: "DELETE MY ACCOUNT",
    password: "correct horse battery staple",
    authTime
  });

  const [deletedUser, focusCount, distractionCount, roadmapCount, refreshCount, storedTeam, storedMember] = await Promise.all([
    User.findById(owner._id),
    FocusSession.countDocuments({ user: owner._id }),
    DistractionLog.countDocuments({ user: owner._id }),
    RoadmapPlan.countDocuments({ user: owner._id }),
    RefreshToken.countDocuments({ user: owner._id }),
    Team.findById(team._id),
    User.findById(remaining._id)
  ]);
  assert.equal(deletedUser, null);
  assert.equal(focusCount + distractionCount + roadmapCount + refreshCount, 0);
  assert.deepEqual(storedTeam.members.map(String), [remaining.id]);
  assert.equal(String(storedTeam.createdBy), remaining.id);
  assert.equal(storedTeam.totalSpice, remaining.totalSpice);
  assert.equal(storedTeam.totalStreak, remaining.focusStreak);
  assert.equal(String(storedMember.team), team.id);
});

test("account deletion requires recent authentication and matching email", async () => {
  const user = await User.create({ name: "Protected Fixture", email: `protected-${randomUUID()}@example.test` });
  ownerId = user._id;
  const service = new AccountDataService();
  await assert.rejects(service.deleteAccount(user.id, {
    confirmationEmail: user.email,
    confirmationText: "DELETE MY ACCOUNT",
    authTime: new Date(Date.now() - 10 * 60_000)
  }), { statusCode: 401 });
  await assert.rejects(service.deleteAccount(user.id, {
    confirmationEmail: "wrong@example.test",
    confirmationText: "DELETE MY ACCOUNT",
    authTime: new Date()
  }), { statusCode: 400 });
  assert.ok(await User.exists({ _id: user._id }));
});

test("Google-linked accounts require the explicit phrase and matching email before deletion", async () => {
  const user = await User.create({
    name: "Google Fixture",
    email: `google-delete-${randomUUID()}@example.test`,
    provider: "google",
    googleId: `google-${randomUUID()}`
  });
  ownerId = user._id;
  const service = new AccountDataService();
  await assert.rejects(service.deleteAccount(user.id, {
    confirmationEmail: user.email,
    authTime: new Date()
  }), { statusCode: 400 });
  assert.ok(await User.exists({ _id: user._id }));
  await service.deleteAccount(user.id, {
    confirmationEmail: user.email,
    confirmationText: "DELETE MY ACCOUNT",
    authTime: new Date()
  });
  assert.equal(await User.findById(user._id), null);
});
