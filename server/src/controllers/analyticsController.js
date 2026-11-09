import { AnalyticsService } from "../services/analyticsService.js";
import { LeaderboardService } from "../services/leaderboardService.js";
import { BehaviorService } from "../services/behaviorService.js";

const behaviorService = new BehaviorService();

const analyticsService = new AnalyticsService();
const leaderboardService = new LeaderboardService();

export class AnalyticsController {
  async dashboard(req, res) {
    const dashboard = await analyticsService.getDashboard(req.user);
    res.json({
      success: true,
      data: {
        ...dashboard,
        leaderboard: await leaderboardService.getSummary()
      }
    });
  }

  async behavior(req, res) {
    res.json({ success: true, data: await behaviorService.behavior(req.user, req.query) });
  }

  async weeklyReview(req, res) {
    res.json({ success: true, data: await behaviorService.weeklyReview(req.user, req.query) });
  }
}
