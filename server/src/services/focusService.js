import { ApiError } from "../utils/ApiError.js";
import { FocusSessionRepository } from "../repositories/FocusSessionRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { OperativeStateService } from "./operativeStateService.js";
import { LeaderboardService } from "./leaderboardService.js";
import { RankEngine } from "./rankEngine.js";
import { SpiceEngine } from "./spiceEngine.js";

const focusSessionRepository = new FocusSessionRepository();
const userRepository = new UserRepository();
const operativeStateService = new OperativeStateService();
const leaderboardService = new LeaderboardService();
const rankEngine = new RankEngine();
const spiceEngine = new SpiceEngine();

const validDurations = [25, 50];
const validTypes = ["pomodoro-25", "deep-50", "custom"];

export class FocusService {
  async createSession(user, payload) {
    const duration = Number(payload?.duration);
    const type = String(payload?.type || "").trim() || (duration === 50 ? "deep-50" : "pomodoro-25");
    const productivityScore = Number(payload?.productivityScore ?? 100);

    if (!validDurations.includes(duration)) {
      throw new ApiError(400, "Focus duration must be either 25 or 50 minutes");
    }

    if (!validTypes.includes(type)) {
      throw new ApiError(400, "Focus session type is invalid");
    }

    const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date();
    if (Number.isNaN(completedAt.getTime())) {
      throw new ApiError(400, "Completed timestamp is invalid");
    }

    const startedAt = payload.startedAt
      ? new Date(payload.startedAt)
      : new Date(completedAt.getTime() - duration * 60 * 1000);
    if (Number.isNaN(startedAt.getTime())) {
      throw new ApiError(400, "Started timestamp is invalid");
    }

    const streak = operativeStateService.computeNextStreak(user, completedAt);
    const spiceEarned = spiceEngine.calculateHarvest(duration);

    const session = await focusSessionRepository.create({
      user: user.id,
      duration,
      type,
      status: payload.status || "completed",
      spiceEarned,
      productivityScore: Math.max(0, Math.min(100, productivityScore)),
      startedAt,
      completedAt,
      notes: String(payload.notes || "").trim()
    });

    const totalSpice = user.totalSpice + spiceEarned;
    const currentRank = rankEngine.determineRank(totalSpice);

    const updatedUser = await userRepository.updateById(user.id, {
      totalSpice,
      currentRank,
      focusStreak: streak,
      lastActiveDate: completedAt
    });

    const updatedTeam = await leaderboardService.syncTeamTotals(updatedUser.team);

    return { session, updatedUser, updatedTeam };
  }
}
