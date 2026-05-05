import { LeaderboardService } from "../services/leaderboardService.js";

const leaderboardService = new LeaderboardService();

export class LeaderboardController {
  async users(req, res) {
    const limit = Number(req.query.limit || 10);
    res.json({
      success: true,
      data: {
        users: await leaderboardService.getTopUsers(limit)
      }
    });
  }

  async teams(req, res) {
    const limit = Number(req.query.limit || 10);
    res.json({
      success: true,
      data: {
        teams: await leaderboardService.getTopTeams(limit)
      }
    });
  }
}
