import { TeamService } from "../services/teamService.js";
import { LeaderboardService } from "../services/leaderboardService.js";
import { getIo } from "../socket/index.js";

const teamService = new TeamService();
const leaderboardService = new LeaderboardService();

const serializeOperative = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  totalSpice: user.totalSpice,
  focusStreak: user.focusStreak,
  currentRank: user.currentRank,
  team: user.team
    ? {
        id: user.team.id || user.team,
        name: user.team.name || null
      }
    : null
});

export class TeamController {
  async create(req, res) {
    const result = await teamService.createTeam(req.user, req.body);
    const io = getIo();

    if (io) {
      await leaderboardService.emitUpdate(io);
    }

    res.status(201).json({
      success: true,
      data: {
        team: result.team,
        operative: serializeOperative(result.user)
      }
    });
  }

  async join(req, res) {
    const result = await teamService.joinTeam(req.user, req.body);
    const io = getIo();

    if (io) {
      await leaderboardService.emitUpdate(io);
    }

    res.json({
      success: true,
      data: {
        team: result.team,
        operative: serializeOperative(result.user)
      }
    });
  }
}
