import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MissionService, MISSION_LIMITS, parseDay, summarizeMissions } from "../src/services/missionService.js";
import { GoalService, goalProgress } from "../src/services/goalService.js";
import { computeBehavior, explainInsights, localDayKey, parseTimezoneOffset } from "../src/services/insightsEngine.js";
import { BehaviorService } from "../src/services/behaviorService.js";
import { buildPreferences, ProfileService } from "../src/services/profileService.js";
import { createFallbackInsight, compactContext } from "../src/services/mentatService.js";

const NOW = new Date("2026-11-09T12:00:00Z");
const id = () => new mongoose.Types.ObjectId();
const user = { id: String(id()) };

const missionRepo = (seed = []) => {
  const rows = [...seed];
  const calls = [];
  return {
    rows, calls,
    async listByDay(_userId, day) { return rows.filter((row) => row.day === day); },
    async listOpenBefore(_userId, day) { return rows.filter((row) => row.day < day && row.status === "todo"); },
    async countByDay(_userId, day, filter = {}) {
      return rows.filter((row) => row.day === day && (!filter.priority || (row.priority && row.status !== "dropped" && String(row._id) !== String(filter._id?.$ne)))).length;
    },
    async create(doc) { const row = { _id: id(), status: "todo", ...doc }; rows.push(row); return row; },
    async findOwned(userId, missionId) { return rows.find((row) => String(row._id) === String(missionId) && row.user === userId) || null; },
    async updateOwned(_userId, missionId, update) { const row = rows.find((entry) => String(entry._id) === String(missionId)); Object.assign(row, update.$set); return row; },
    async deleteOwned() { return { deletedCount: 0 }; },
    async carryForward(userId, ids, toDay) { calls.push({ userId, ids, toDay }); },
    async addFocus(...args) { calls.push({ addFocus: args }); return {}; }
  };
};

test("parseDay rejects malformed and far-away days and defaults to today", () => {
  assert.equal(parseDay(undefined, NOW), "2026-11-09");
  assert.equal(parseDay("2026-11-10", NOW), "2026-11-10");
  assert.throws(() => parseDay("2026-02-30", NOW), { statusCode: 400 });
  assert.throws(() => parseDay("11/09/2026", NOW), { statusCode: 400 });
  assert.throws(() => parseDay("2030-01-01", NOW), { statusCode: 400 });
});

test("missions are capped at three priorities per day and summaries ignore dropped work", async () => {
  const repo = missionRepo();
  const service = new MissionService({ missionRepository: repo, goalRepository: {}, clock: () => NOW });
  for (const title of ["A", "B", "C"]) await service.create(user, { title, priority: true });
  await assert.rejects(service.create(user, { title: "D", priority: true }), { statusCode: 409 });
  await assert.rejects(service.create(user, { title: "Write <b>notes</b>" }), { statusCode: 400 });
  const plain = await service.create(user, { title: "  Write notes  " });
  assert.equal(plain.priority, false);
  assert.equal(plain.title, "Write notes");
  const summary = summarizeMissions([...repo.rows, { status: "dropped", priority: true }]);
  assert.equal(summary.total, 4);
  assert.equal(summary.priorities, 3);
});

test("mission validation rejects bad planned minutes and foreign mission IDs", async () => {
  const repo = missionRepo([{ _id: id(), user: "someone-else", day: "2026-11-09", status: "todo", title: "theirs" }]);
  const service = new MissionService({ missionRepository: repo, goalRepository: {}, clock: () => NOW });
  await assert.rejects(service.create(user, { title: "x", plannedFocusMinutes: MISSION_LIMITS.maxPlannedMinutes + 1 }), { statusCode: 400 });
  await assert.rejects(service.update(user, String(repo.rows[0]._id), { status: "done" }), { statusCode: 404 });
  await assert.rejects(service.findOwnedMission(user, "not-an-id"), { statusCode: 400 });
});

test("carry-forward only moves what the user selected and respects the daily cap", async () => {
  const keep = { _id: id(), user: user.id, day: "2026-11-08", status: "todo", title: "keep" };
  const move = { _id: id(), user: user.id, day: "2026-11-07", status: "todo", title: "move" };
  const repo = missionRepo([keep, move]);
  const service = new MissionService({ missionRepository: repo, goalRepository: {}, clock: () => NOW });
  const board = await service.getBoard(user, { day: "2026-11-09" });
  assert.equal(board.carryForward.count, 2);
  assert.equal(repo.calls.length, 0, "viewing the board never moves missions");
  const result = await service.carryForward(user, { toDay: "2026-11-09", missionIds: [String(move._id)] });
  assert.equal(result.moved, 1);
  assert.deepEqual(repo.calls[0].ids.map(String), [String(move._id)]);
});

test("goal progress comes from ticked milestones and milestone toggles are owner-scoped", async () => {
  assert.equal(goalProgress({ status: "active", milestones: [{ done: true }, { done: false }] }), 50);
  assert.equal(goalProgress({ status: "completed", milestones: [] }), 100);
  const milestoneId = id();
  const goal = { _id: id(), title: "Ship portfolio", category: "career", status: "active", milestones: [{ _id: milestoneId, title: "Draft", done: false }] };
  const service = new GoalService({
    goalRepository: {
      async findOwned(userId, goalId) { return userId === user.id && String(goalId) === String(goal._id) ? goal : null; },
      async save(doc) { return doc; }
    },
    missionRepository: {},
    clock: () => NOW
  });
  const updated = await service.toggleMilestone(user, String(goal._id), String(milestoneId), true);
  assert.equal(updated.progress, 100);
  assert.equal(updated.milestones[0].done, true);
  await assert.rejects(service.toggleMilestone({ id: "intruder" }, String(goal._id), String(milestoneId), true), { statusCode: 404 });
  await assert.rejects(service.create(user, { title: "x" }), (error) => error.statusCode === 400 || error.statusCode === undefined);
});

test("behavior metrics respect the client timezone and report evidence-backed insights", () => {
  assert.equal(parseTimezoneOffset("330"), 330);
  assert.equal(parseTimezoneOffset("9999"), 0);
  // 03:30 UTC is 09:00 in UTC+5:30.
  const sessions = Array.from({ length: 6 }, (_, index) => ({
    status: "completed",
    duration: 25,
    pauseCount: index === 0 ? 1 : 0,
    startedAt: new Date(Date.UTC(2026, 10, 9 - index, 3, 30)),
    completedAt: new Date(Date.UTC(2026, 10, 9 - index, 3, 55))
  }));
  sessions.push({ status: "abandoned", duration: 25, startedAt: new Date("2026-11-08T10:00:00Z") });
  const distractions = [{ appName: "youtube.com", duration: 45, loggedAt: new Date("2026-11-08T14:00:00Z"), metadata: { site: "youtube.com" } }];
  const behavior = computeBehavior({ sessions, distractions, now: NOW, tzOffsetMinutes: 330 });
  assert.equal(behavior.bestHours[0].hour, 9);
  assert.equal(behavior.sessionSuccess.rate, 86);
  assert.equal(behavior.interruptions.recovered, 1);
  assert.equal(behavior.dataSufficiency, "enough");
  assert.equal(behavior.topDistractions[0].name, "youtube.com");
  assert.equal(localDayKey(new Date("2026-11-09T20:00:00Z"), 330), "2026-11-10");

  const insights = explainInsights(behavior, { blockedSites: [] });
  const best = insights.find((insight) => insight.id === "best-hour");
  assert.ok(best?.evidence?.length, "insights carry their evidence");
  const distraction = insights.find((insight) => insight.id === "top-distraction");
  assert.equal(distraction?.action?.type, "block-site");
  const blocked = explainInsights(behavior, { blockedSites: ["youtube.com"] }).find((insight) => insight.id === "top-distraction");
  assert.ok(!blocked || !blocked.action, "no block suggestion for an already blocked site");
  for (const insight of insights) assert.doesNotMatch(`${insight.title} ${insight.detail}`, /lazy|fail(ed|ure) as|diagnos/i);
});

test("an empty history yields a no-data insight instead of invented patterns", () => {
  const behavior = computeBehavior({ now: NOW });
  assert.equal(behavior.dataSufficiency, "none");
  const insights = explainInsights(behavior);
  assert.equal(insights[0].id, "no-data");
});

test("retention purges only when the user opted into a retention period", async () => {
  const deleted = [];
  const repo = (name) => ({ async deleteOlderThan(userId, cutoff) { deleted.push({ name, userId, cutoff }); return { deletedCount: 2 }; } });
  const service = new BehaviorService({ focusSessionRepository: repo("focus"), distractionLogRepository: repo("storm"), missionRepository: {}, goalRepository: {}, roadmapRepository: {}, clock: () => NOW });
  assert.deepEqual(await service.applyRetention({ id: "u", preferences: { dataRetentionDays: 0 } }), { applied: false });
  const result = await service.applyRetention({ id: "u", preferences: { dataRetentionDays: 30 } });
  assert.equal(result.removed, 4);
  assert.equal(deleted[0].cutoff.toISOString(), "2026-10-10T12:00:00.000Z");
});

test("preference validation bumps the extension policy version only when blocking settings change", () => {
  const current = { blockedSites: ["a.com"], strictBlockMode: false, extensionOverrideMinutes: 5, policyVersion: 3, focusDurationPreference: 25 };
  const unchanged = buildPreferences(current, { theme: "dark" });
  assert.equal(unchanged.policyVersion, 3);
  const changed = buildPreferences(current, { trackingPaused: true });
  assert.equal(changed.policyVersion, 4);
  assert.equal(changed.trackingPaused, true);
});

test("extension policy writes require the current version and reject stale edits", async () => {
  const record = { _id: "u1", preferences: { blockedSites: [], strictBlockMode: false, extensionOverrideMinutes: 5, policyVersion: 2 } };
  const service = new ProfileService({
    userRepository: {
      async findById() { return record; },
      async updateById(_id, update) { Object.assign(record, update); return record; }
    }
  });
  await assert.rejects(service.updateExtensionPolicy("u1", { blockedSites: ["x.com"] }), { statusCode: 400 });
  await assert.rejects(service.updateExtensionPolicy("u1", { baseVersion: 1, blockedSites: ["x.com"] }), { statusCode: 409 });
  const policy = await service.updateExtensionPolicy("u1", { baseVersion: 2, blockedSites: ["x.com"] });
  assert.equal(policy.version, 3);
  assert.deepEqual(policy.blockedSites, ["x.com"]);
});

test("Mentat heuristics use today's priorities locally but external context carries aggregates only", () => {
  const dashboard = { analytics: { focusTrend: [], distractionTrend: [], performanceSignals: {}, roadmap: { phases: [] }, skillAnalysis: { disciplineMap: [] } }, operative: { preferences: { focusDurationPreference: 50 } } };
  const prescience = { burnoutRisk: 10, riskBand: "STABLE", averages: {} };
  const missions = { total: 2, done: 0, priorities: [{ title: "Finish API docs", status: "todo" }] };
  const behavior = { bestHours: [{ hour: 9, label: "09:00", share: 40 }], topDistractions: [{ name: "reddit.com", minutes: 60 }], dataSufficiency: "enough", sessionSuccess: { rate: 80 }, consistency: { rate: 50 } };
  const insight = createFallbackInsight({ dashboard, prescience, question: "", behavior, missions });
  assert.match(insight.nextBestAction, /Finish API docs/);
  assert.equal(insight.focusSchedule.recommendedStartHour, "09:00");
  assert.ok(insight.reasoning.length > 0);
  const external = JSON.stringify(compactContext({ dashboard, prescience, question: "", behavior, missions }));
  assert.doesNotMatch(external, /Finish API docs|reddit/);
  assert.match(external, /"openPriorities":1/);
});
