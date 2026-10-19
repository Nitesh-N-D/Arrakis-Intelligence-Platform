import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { FocusService } from "../src/services/focusService.js";

const userId = new mongoose.Types.ObjectId().toString();
const sessionId = new mongoose.Types.ObjectId().toString();

const createFixture = ({ due = true } = {}) => {
  const state = {
    active: {
      _id: new mongoose.Types.ObjectId(sessionId), user: userId, duration: 25, status: "running", active: true,
      startedAt: new Date(Date.now() - (due ? 25 * 60_000 + 1000 : 60_000)), spiceEarned: 0
    },
    totalSpice: 70,
    completedCalls: 0,
    rewardWrites: 0,
    lastTransaction: null
  };
  let queue = Promise.resolve();
  const runTransaction = (work) => {
    const transaction = { transaction: true };
    const run = queue.then(async () => {
      const before = structuredClone(state);
      try {
        const result = await work(transaction);
        state.lastTransaction = transaction;
        return result;
      } catch (error) {
        Object.assign(state, before);
        throw error;
      }
    });
    queue = run.catch(() => {});
    return run;
  };
  const focusSessionRepository = {
    async findActiveByUser(id, transaction) {
      assert.equal(id, userId);
      assert.equal(transaction?.transaction, true);
      return state.active;
    },
    async findCompletedByUserAndId(id, requestedSession, transaction) {
      assert.equal(id, userId);
      assert.equal(requestedSession, sessionId);
      assert.equal(transaction?.transaction, true);
      return state.active?.status === "completed" && String(state.active._id) === sessionId ? state.active : null;
    },
    async completeIfDue(id, requestedSession, now, minimumStartedAt, spiceEarned, transaction) {
      assert.equal(id, userId);
      assert.equal(requestedSession, sessionId);
      assert.equal(transaction?.transaction, true);
      state.completedCalls += 1;
      if (!state.active || state.active.status !== "running" || state.active.startedAt > minimumStartedAt) return null;
      state.active = { ...state.active, status: "completed", active: false, completedAt: now, spiceEarned };
      return state.active;
    }
  };
  const userRepository = {
    async findById(id, options) {
      assert.equal(id, userId);
      assert.equal(options.session?.transaction, true);
      return { id, totalSpice: state.totalSpice, currentRank: "Outworlder", team: null };
    },
    async addSpice(id, amount, update, options) {
      assert.equal(id, userId);
      assert.equal(options.session?.transaction, true);
      state.rewardWrites += 1;
      state.totalSpice += amount;
      return { id, totalSpice: state.totalSpice, currentRank: "Outworlder", team: null, ...update };
    },
    async updateById(id, update, options) {
      assert.equal(id, userId);
      assert.equal(options.session?.transaction, true);
      return { id, ...update };
    }
  };
  const leaderboardService = { async syncTeamTotals() { return null; } };
  const service = new FocusService({ focusSessionRepository, userRepository, leaderboardService, runTransaction });
  const user = { id: userId, totalSpice: 70, currentRank: "Outworlder", focusStreak: 1, lastActiveDate: new Date() };
  return { service, user, state };
};

test("concurrent completion requests commit one reward through one transaction", async () => {
  const { service, user, state } = createFixture();
  const outcomes = await Promise.allSettled([
    service.completeSession(user, sessionId),
    service.completeSession(user, sessionId)
  ]);
  assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 2);
  assert.equal(outcomes.filter((outcome) => outcome.value.alreadyCompleted).length, 1);
  assert.equal(state.rewardWrites, 1);
  assert.equal(state.totalSpice, 80);
  assert.equal(state.active.status, "completed");
});

test("retrying a committed harvest confirms the stored result without awarding again", async () => {
  const { service, user, state } = createFixture();
  const original = await service.completeSession(user, sessionId);
  const retry = await service.completeSession(user, sessionId);
  assert.equal(original.alreadyCompleted, undefined);
  assert.equal(retry.alreadyCompleted, true);
  assert.equal(retry.session.spiceEarned, 10);
  assert.equal(retry.updatedUser.totalSpice, 80);
  assert.equal(state.rewardWrites, 1);
});

test("an early completion does not write a reward", async () => {
  const { service, user, state } = createFixture({ due: false });
  await assert.rejects(service.completeSession(user, sessionId), { statusCode: 409 });
  assert.equal(state.rewardWrites, 0);
  assert.equal(state.totalSpice, 70);
  assert.equal(state.active.status, "running");
});

test("concurrent session creation reports the unique active-session conflict", async () => {
  const service = new FocusService({
    focusSessionRepository: {
      async findActiveByUser() { return null; },
      async create() { throw Object.assign(new Error("duplicate active session"), { code: 11000 }); }
    }
  });
  await assert.rejects(service.createSession({ id: userId }, { duration: 25 }), { statusCode: 409 });
});
