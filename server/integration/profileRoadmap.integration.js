import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { ProfileService } from "../src/services/profileService.js";
import { RoadmapService } from "../src/services/roadmapService.js";
import { RoadmapPlan } from "../src/models/RoadmapPlan.js";
import { Team } from "../src/models/Team.js";
import { User } from "../src/models/User.js";
import { connectTestReplicaSet, disconnectTestReplicaSet } from "./mongoReplicaSet.js";

let connected = false;
let userId;

before(async () => {
  await connectTestReplicaSet();
  connected = true;
  await Promise.all([RoadmapPlan.init(), Team.init(), User.init()]);
});

after(async () => {
  if (!connected) return;
  if (userId) {
    await RoadmapPlan.deleteOne({ user: userId });
    await User.deleteOne({ _id: userId });
  }
  await disconnectTestReplicaSet();
});

test("profile and roadmap changes persist to only the integration fixture account", async () => {
  const user = await User.create({
    name: "Before Update",
    email: `profile-${randomUUID()}@example.test`
  });
  userId = user._id;
  const profileService = new ProfileService();
  const profile = await profileService.updateProfile(user.id, {
    name: "After Update",
    bio: "Integration fixture",
    targetRole: "AI Systems Engineer",
    avatarUrl: "https://example.test/avatar.png",
    skills: [{ name: "Node.js", level: 3 }]
  });
  assert.equal(profile.id, user.id);
  assert.equal(profile.name, "After Update");
  assert.deepEqual(profile.skills.map(({ name, level }) => ({ name, level })), [{ name: "Node.js", level: 3 }]);
  const settings = await profileService.updateSettings(user.id, {
    strictBlockMode: true,
    stormWarningMinutes: 75,
    blockedSites: ["youtube.com"]
  });
  assert.equal(settings.preferences.strictBlockMode, true);
  assert.equal(settings.preferences.stormWarningMinutes, 75);

  const roadmapService = new RoadmapService();
  const roadmap = await roadmapService.ensureRoadmap({
    ...user.toObject(),
    id: user.id,
    name: profile.name,
    skills: profile.skills,
    targetRole: profile.targetRole
  });
  assert.ok(roadmap._id);
  assert.ok(roadmap.phases.length > 0);
  const activePhase = roadmap.phases.find((phase) => phase.status === "active");
  assert.ok(activePhase);

  const updatedRoadmap = await roadmapService.completePhase(
    { id: user.id, skills: profile.skills, targetRole: profile.targetRole },
    String(activePhase._id)
  );
  const [storedUser, storedRoadmap] = await Promise.all([
    User.findById(userId),
    RoadmapPlan.findOne({ user: userId })
  ]);
  assert.equal(updatedRoadmap.phases[0].status, "done");
  assert.equal(storedRoadmap.phases.find((phase) => String(phase._id) === String(activePhase._id)).status, "done");
  assert.ok(storedUser.skills.some((skill) => skill.name === activePhase.skill && skill.level >= 4));
  assert.equal(storedUser.preferences.strictBlockMode, true);
  assert.equal(storedUser.preferences.stormWarningMinutes, 75);
  assert.deepEqual(storedUser.preferences.blockedSites, ["youtube.com"]);
});
