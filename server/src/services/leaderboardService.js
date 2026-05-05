import { TeamRepository } from "../repositories/TeamRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";

const teamRepository = new TeamRepository();
const userRepository = new UserRepository();

const formatUserEntry = (user, index) => ({
  rank: index + 1,
  id: user.id,
  name: user.name,
  email: user.email,
  totalSpice: user.totalSpice,
  focusStreak: user.focusStreak,
  currentRank: user.currentRank,
  targetRole: user.targetRole,
  team: user.team
    ? {
        id: user.team.id,
        name: user.team.name
      }
    : null
});

const formatTeamEntry = (team, index) => ({
  rank: index + 1,
  id: team.id,
  name: team.name,
  totalSpice: team.totalSpice,
  totalStreak: team.totalStreak,
  memberCount: team.members?.length || 0,
  members: (team.members || []).map((member) => ({
    id: member.id,
    name: member.name
  }))
});

export class LeaderboardService {
  async getTopUsers(limit = 10) {
    const users = await userRepository.listTopUsers(limit);
    return users.map(formatUserEntry);
  }

  async getTopTeams(limit = 10) {
    const teams = await teamRepository.listTopTeams(limit);
    return teams.map(formatTeamEntry);
  }

  async getSummary(limit = 5) {
    const [topUsers, topTeams] = await Promise.all([
      this.getTopUsers(limit),
      this.getTopTeams(limit)
    ]);

    return { topUsers, topTeams };
  }

  async syncTeamTotals(teamId) {
    if (!teamId) {
      return null;
    }

    const normalizedId = teamId.id || teamId;
    return teamRepository.recalculateTotals(normalizedId);
  }

  async emitUpdate(io, limit = 5) {
    if (!io) {
      return null;
    }

    const summary = await this.getSummary(limit);
    io.emit("leaderboard:update", summary);
    return summary;
  }
}
