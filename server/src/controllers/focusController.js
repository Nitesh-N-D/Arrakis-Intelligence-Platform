import { getIo } from "../socket/index.js";
import { AnalyticsService } from "../services/analyticsService.js";
import { FocusService } from "../services/focusService.js";

const focusService = new FocusService();
const analyticsService = new AnalyticsService();

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
      io.to(`user:${req.user.id}`).emit("rank:update", {
        currentRank: result.updatedUser.currentRank,
        totalSpice: result.updatedUser.totalSpice
      });
      io.to(`user:${req.user.id}`).emit(
        "analytics:update",
        await analyticsService.getDashboard(result.updatedUser)
      );
    }

    res.status(201).json({
      success: true,
      data: {
        session: result.session,
        operative: {
          totalSpice: result.updatedUser.totalSpice,
          currentRank: result.updatedUser.currentRank,
          focusStreak: result.updatedUser.focusStreak
        }
      }
    });
  }

  async harvest(req, res) {
    return this.create(req, res);
  }
}
