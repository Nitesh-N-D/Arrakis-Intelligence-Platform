import { ApiError } from "../utils/ApiError.js";
import { FocusSessionRepository } from "../repositories/FocusSessionRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { OperativeStateService } from "./operativeStateService.js";
import { LeaderboardService } from "./leaderboardService.js";
import { RankEngine } from "./rankEngine.js";
import { SpiceEngine } from "./spiceEngine.js";
import mongoose from "mongoose";
import { FOCUS_LIMITS, isValidFocusDuration } from "./focusLimits.js";

const transactionRunner = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } finally {
    await session.endSession();
  }
};

const typeForDuration = (duration) => (duration === 25 ? "pomodoro-25" : duration === 50 ? "deep-50" : "custom");


export class FocusService {
  constructor({
    focusSessionRepository = new FocusSessionRepository(),
    userRepository = new UserRepository(),
    operativeStateService = new OperativeStateService(),
    leaderboardService = new LeaderboardService(),
    rankEngine = new RankEngine(),
    spiceEngine = new SpiceEngine(),
    runTransaction = transactionRunner,
    missionService = null
  } = {}) {
    Object.assign(this, { focusSessionRepository, userRepository, operativeStateService, leaderboardService, rankEngine, spiceEngine, runTransaction, missionService });
  }

  async getMissionService() {
    if (!this.missionService) {
      const { MissionService } = await import("./missionService.js");
      this.missionService = new MissionService();
    }
    return this.missionService;
  }

  validateSession(payload) {
    const duration = Number(payload?.duration);

    if (!isValidFocusDuration(duration)) {
      throw new ApiError(
        400,
        `Focus duration must be a whole number of minutes between ${FOCUS_LIMITS.minMinutes} and ${FOCUS_LIMITS.maxMinutes}`
      );
    }

    // The session type is derived on the server; a client-supplied type is never trusted.
    return { duration, type: typeForDuration(duration) };
  }

  async createSession(user, payload) {
    const { duration, type } = this.validateSession(payload);
    const active = await this.focusSessionRepository.findActiveByUser(user.id);
    if (active) throw new ApiError(409, "Finish, resume, or reset your active focus session first.");
    const mission = payload?.missionId ? await (await this.getMissionService()).findOwnedMission(user, payload.missionId) : null;
    try {
      const session = await this.focusSessionRepository.create({
        user: user.id,
        duration,
        type,
        status: "running",
        active: true,
        spiceEarned: 0,
        productivityScore: 100,
        startedAt: new Date(),
        completedAt: null,
        remainingMs: null,
        notes: String(payload.notes || "").trim().slice(0, 500),
        mission: mission?._id || null
      });
      return { session };
    } catch (error) {
      if (error?.code === 11000) throw new ApiError(409, "You already have an active focus session.");
      throw error;
    }
  }

  async getActiveSession(user) {
    return this.focusSessionRepository.findActiveByUser(user.id);
  }

  async pauseSession(user, sessionId) {
    if (!mongoose.isValidObjectId(sessionId)) throw new ApiError(400, "Focus session ID is invalid.");
    const session = await this.focusSessionRepository.findActiveByUser(user.id);
    if (!session || String(session._id) !== String(sessionId) || session.status !== "running") {
      throw new ApiError(409, "This focus session cannot be paused.");
    }
    const now = new Date();
    const remainingMs = Math.max(0, session.duration * 60_000 - (now - session.startedAt));
    const updated = await this.focusSessionRepository.transition(user.id, sessionId, "running", { status: "paused", remainingMs }, { pauseCount: 1 });
    if (!updated) throw new ApiError(409, "Focus session state changed. Refresh and try again.");
    return updated;
  }

  async resumeSession(user, sessionId) {
    if (!mongoose.isValidObjectId(sessionId)) throw new ApiError(400, "Focus session ID is invalid.");
    const session = await this.focusSessionRepository.findActiveByUser(user.id);
    if (!session || String(session._id) !== String(sessionId) || session.status !== "paused") {
      throw new ApiError(409, "This focus session cannot be resumed.");
    }
    const now = new Date();
    const elapsedMs = session.duration * 60_000 - Math.max(0, Math.min(session.duration * 60_000, session.remainingMs || 0));
    const startedAt = new Date(now.getTime() - elapsedMs);
    const updated = await this.focusSessionRepository.transition(user.id, sessionId, "paused", { status: "running", startedAt, remainingMs: null });
    if (!updated) throw new ApiError(409, "Focus session state changed. Refresh and try again.");
    return updated;
  }

  async abandonSession(user, sessionId) {
    if (!mongoose.isValidObjectId(sessionId)) throw new ApiError(400, "Focus session ID is invalid.");
    const active = await this.focusSessionRepository.findActiveByUser(user.id);
    if (!active || String(active._id) !== String(sessionId)) return { abandoned: true };
    const updated = await this.focusSessionRepository.transition(user.id, sessionId, active.status, { status: "abandoned", active: false, completedAt: null, spiceEarned: 0 });
    if (!updated) throw new ApiError(409, "Focus session state changed. Refresh and try again.");
    return { abandoned: true };
  }

  async completeSession(user, sessionId) {
    if (!mongoose.isValidObjectId(sessionId)) throw new ApiError(400, "Focus session ID is invalid.");
    const result = await this.runTransaction(async (dbSession) => {
      const now = new Date();
      const active = await this.focusSessionRepository.findActiveByUser(user.id, dbSession);
      if (!active || String(active._id) !== String(sessionId) || active.status !== "running") {
        const previouslyCompleted = await this.focusSessionRepository.findCompletedByUserAndId(user.id, sessionId, dbSession);
        if (previouslyCompleted) {
          const currentUser = await this.userRepository.findById(user.id, { session: dbSession });
          if (!currentUser) throw new ApiError(404, "User not found");
          return { session: previouslyCompleted, updatedUser: currentUser, updatedTeam: currentUser.team, alreadyCompleted: true };
        }
        throw new ApiError(409, "This focus session is not active or has already been completed.");
      }
      const minimumStartedAt = new Date(now.getTime() - active.duration * 60_000);
      const spiceEarned = this.spiceEngine.calculateHarvest(active.duration);
      const completed = await this.focusSessionRepository.completeIfDue(user.id, sessionId, now, minimumStartedAt, spiceEarned, dbSession);
      if (!completed) throw new ApiError(409, "The focus session has not reached its server-verified completion time.");
      return this.awardCompletedSession(user, completed, dbSession);
    });
    result.updatedTeam = await this.leaderboardService.syncTeamTotals(result.updatedUser.team);
    if (!result.alreadyCompleted && result.session?.mission) {
      // Focus allocation: credit the linked mission. Best effort; the harvest itself is already committed.
      try {
        await (await this.getMissionService()).recordFocus(user.id, result.session.mission, result.session.duration);
      } catch {
        // A deleted mission must never turn a successful harvest into an error.
      }
    }
    return result;
  }

  async awardCompletedSession(user, session, dbSession) {
    const streak = this.operativeStateService.computeNextStreak(user, session.completedAt);
    const updatedUser = await this.userRepository.addSpice(user.id, session.spiceEarned, {
      focusStreak: streak,
      lastActiveDate: session.completedAt
    }, { session: dbSession });
    if (!updatedUser) throw new ApiError(404, "User not found");
    const currentRank = this.rankEngine.determineRank(updatedUser.totalSpice);
    if (updatedUser.currentRank !== currentRank) {
      await this.userRepository.updateById(user.id, { currentRank }, { session: dbSession });
      updatedUser.currentRank = currentRank;
    }
    return { session, updatedUser, updatedTeam: null };
  }

}
