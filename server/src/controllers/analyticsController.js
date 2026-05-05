import { AnalyticsService } from "../services/analyticsService.js";
import { LeaderboardService } from "../services/leaderboardService.js";

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
}
