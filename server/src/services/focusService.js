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

export class FocusService {
  async createSession(user, payload) {
    const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date();
    const startedAt = payload.startedAt
      ? new Date(payload.startedAt)
      : new Date(completedAt.getTime() - payload.duration * 60 * 1000);
    const streak = operativeStateService.computeNextStreak(user, completedAt);
    const spiceEarned = spiceEngine.calculateHarvest(payload.duration);

    const session = await focusSessionRepository.create({
      user: user.id,
      duration: payload.duration,
      type: payload.type,
      status: payload.status || "completed",
      spiceEarned,
      productivityScore: payload.productivityScore ?? 100,
      startedAt,
      completedAt,
      notes: payload.notes || ""
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
