import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { FocusService } from "../src/services/focusService.js";
import { FocusSession } from "../src/models/FocusSession.js";
import { User } from "../src/models/User.js";
import { connectTestReplicaSet, disconnectTestReplicaSet } from "./mongoReplicaSet.js";

let connected = false;
let userId;
let focusSessionId;

before(async () => {
  await connectTestReplicaSet();
  connected = true;
  await Promise.all([FocusSession.init(), User.init()]);
});

after(async () => {
  if (!connected) return;
  if (focusSessionId) await FocusSession.deleteOne({ _id: focusSessionId });
  if (userId) await User.deleteOne({ _id: userId });
  await disconnectTestReplicaSet();
});

test("MongoDB transaction idempotently completes concurrent requests with one Spice reward", async () => {
  const user = await User.create({ name: "Test Operative", email: `focus-${randomUUID()}@example.test` });
  userId = user._id;
  const focusSession = await FocusSession.create({
    user: user._id,
    duration: 25,
    type: "pomodoro-25",
    status: "running",
    active: true,
    spiceEarned: 0,
    productivityScore: 100,
    startedAt: new Date(Date.now() - 26 * 60_000)
  });
  focusSessionId = focusSession._id;
  const service = new FocusService({ leaderboardService: { syncTeamTotals: async () => null } });

  const outcomes = await Promise.allSettled([
    service.completeSession(user, String(focusSession._id)),
    service.completeSession(user, String(focusSession._id))
  ]);
  const fulfilled = outcomes.filter((outcome) => outcome.status === "fulfilled");
  assert.equal(fulfilled.length, 2);
  assert.equal(fulfilled.filter((outcome) => outcome.value.alreadyCompleted).length, 1);

  const [storedUser, storedFocus, completedCount] = await Promise.all([
    User.findById(user._id),
    FocusSession.findById(focusSession._id),
    FocusSession.countDocuments({ user: user._id, status: "completed" })
  ]);
  assert.equal(storedUser.totalSpice, 10);
  assert.equal(storedFocus.spiceEarned, 10);
  assert.equal(storedFocus.active, false);
  assert.equal(completedCount, 1);
  assert.ok(mongoose.connection.readyState === 1);
});
