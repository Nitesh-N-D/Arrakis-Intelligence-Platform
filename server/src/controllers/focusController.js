import { AnalyticsService } from "../services/analyticsService.js";
import { FocusService } from "../services/focusService.js";
import { LeaderboardService } from "../services/leaderboardService.js";
import { getIo } from "../socket/index.js";

const focusService = new FocusService();
const analyticsService = new AnalyticsService();
const leaderboardService = new LeaderboardService();

export class FocusController {
  async create(req, res) {
    const result = await focusService.createSession(req.user, req.body);
    const io = getIo();

    if (io) {
      io.to(`user:${req.user.id}`).emit("spice:update", {
        totalSpice: result.updatedUser.totalSpice,
        currentRank: result.updatedUser.currentRank,
        session: result.session
      });
      io.to(`user:${req.user.id}`).emit("streak:update", {
        focusStreak: result.updatedUser.focusStreak
      });
      io.to(`user:${req.user.id}`).emit(
        "analytics:update",
        await analyticsService.getDashboard(result.updatedUser)
      );
      await leaderboardService.emitUpdate(io);
    }

    res.status(201).json({
      success: true,
      data: {
        session: result.session,
        operative: {
          totalSpice: result.updatedUser.totalSpice,
          currentRank: result.updatedUser.currentRank,
          focusStreak: result.updatedUser.focusStreak,
          team: result.updatedTeam
        },
        leaderboard: await leaderboardService.getSummary()
      }
    });
  }

  async harvest(req, res) {
    return this.create(req, res);
  }
}
