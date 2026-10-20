import { AnalyticsService } from "../services/analyticsService.js";
import { FocusService } from "../services/focusService.js";
import { LeaderboardService } from "../services/leaderboardService.js";
import { getIo } from "../socket/index.js";
import { ApiError } from "../utils/ApiError.js";

const focusService = new FocusService();
const analyticsService = new AnalyticsService();
const leaderboardService = new LeaderboardService();

export class FocusController {
  async create(req, res) {
    const result = await focusService.createSession(req.user, req.body);
    res.status(201).json({ success: true, data: { session: result.session } });
  }

  async active(req, res) {
    res.json({ success: true, data: { session: await focusService.getActiveSession(req.user) } });
  }

  async pause(req, res) {
    res.json({ success: true, data: { session: await focusService.pauseSession(req.user, req.params.sessionId) } });
  }

  async resume(req, res) {
    res.json({ success: true, data: { session: await focusService.resumeSession(req.user, req.params.sessionId) } });
  }

  async reset(req, res) {
    res.json({ success: true, data: await focusService.abandonSession(req.user, req.params.sessionId) });
  }

  async harvest(req, res) {
    const result = await focusService.completeSession(req.user, req.params.sessionId);
    const io = getIo();

    if (io && !result.alreadyCompleted) {
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

    res.status(result.alreadyCompleted ? 200 : 201).json({
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

  async legacyHarvest(_req, _res, next) {
    return next(new ApiError(410, "Start a server tracked focus session before claiming a harvest."));
  }
}
