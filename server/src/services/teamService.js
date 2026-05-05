import { TeamRepository } from "../repositories/TeamRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { LeaderboardService } from "./leaderboardService.js";

const teamRepository = new TeamRepository();
const userRepository = new UserRepository();
const leaderboardService = new LeaderboardService();

export class TeamService {
  async createTeam(user, payload) {
    const name = payload.name?.trim();
    if (!name) {
      throw new ApiError(400, "Team name is required");
    }

    if (user.team) {
      throw new ApiError(409, "Operative is already assigned to a team");
    }

    const existingTeam = await teamRepository.findByName(name);
    if (existingTeam) {
      throw new ApiError(409, "A team with this name already exists");
    }

    const team = await teamRepository.create({
      name,
      members: [user.id],
      createdBy: user.id,
      totalSpice: user.totalSpice,
      totalStreak: user.focusStreak
    });

    const updatedUser = await userRepository.updateById(user.id, { team: team.id });
    const syncedTeam = await leaderboardService.syncTeamTotals(team.id);

    return {
      team: syncedTeam,
      user: updatedUser
    };
  }

  async joinTeam(user, payload) {
    const team = payload.teamId
      ? await teamRepository.findById(payload.teamId)
      : await teamRepository.findByName(payload.name || "");

    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    if (user.team?.id === team.id || user.team?.toString?.() === team.id) {
      return { team, user };
    }

    if (user.team) {
      const previousTeamId = user.team.id || user.team;
      await teamRepository.removeMember(previousTeamId, user.id);
      await leaderboardService.syncTeamTotals(previousTeamId);
    }

    await teamRepository.addMember(team.id, user.id);
    const updatedUser = await userRepository.updateById(user.id, { team: team.id });
    const syncedTeam = await leaderboardService.syncTeamTotals(team.id);

    return {
      team: syncedTeam,
      user: updatedUser
    };
  }
}
