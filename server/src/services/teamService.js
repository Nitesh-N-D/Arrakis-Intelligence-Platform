import { TeamRepository } from "../repositories/TeamRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

const teamRepository = new TeamRepository();
const userRepository = new UserRepository();

export class TeamService {
  async createTeam(user, payload) {
    const name = String(payload?.name || "").trim();
    if (name.length < 2 || name.length > 60) {
      throw new ApiError(400, "Team name must be between 2 and 60 characters");
    }

    let teamId;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const currentUser = await userRepository.findById(user.id, { session });
        if (!currentUser) throw new ApiError(404, "User not found");
        if (currentUser.team) throw new ApiError(409, "Operative is already assigned to a team");

        const existingTeam = await teamRepository.findByName(name, { session });
        if (existingTeam) throw new ApiError(409, "A team with this name already exists");

        const team = await teamRepository.create({
          name,
          members: [currentUser.id],
          createdBy: currentUser.id,
          totalSpice: currentUser.totalSpice,
          totalStreak: currentUser.focusStreak
        }, { session });
        await userRepository.updateById(currentUser.id, { team: team.id }, { session });
        await teamRepository.recalculateTotals(team.id, { session });
        teamId = team.id;
      });
    } catch (error) {
      if (error?.code === 11000) throw new ApiError(409, "A team with this name already exists");
      throw error;
    } finally {
      await session.endSession();
    }

    const [syncedTeam, updatedUser] = await Promise.all([
      teamRepository.findById(teamId),
      userRepository.findById(user.id)
    ]);

    return {
      team: syncedTeam,
      user: updatedUser
    };
  }

  async joinTeam(user, payload) {
    if (payload?.teamId && !mongoose.isValidObjectId(payload.teamId)) {
      throw new ApiError(400, "Team ID is invalid");
    }
    let teamId;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const currentUser = await userRepository.findById(user.id, { session });
        if (!currentUser) throw new ApiError(404, "User not found");
        const team = payload.teamId
          ? await teamRepository.findById(payload.teamId, { session })
          : await teamRepository.findByName(payload.name || "", { session });
        if (!team) throw new ApiError(404, "Team not found");

        const currentTeamId = currentUser.team?.id || currentUser.team?.toString?.();
        if (currentTeamId === team.id) {
          teamId = team.id;
          return;
        }

        if (currentTeamId) await teamRepository.removeMember(currentTeamId, currentUser.id, { session });
        await userRepository.updateById(currentUser.id, { team: team.id }, { session });
        await teamRepository.addMember(team.id, currentUser.id, { session });
        if (currentTeamId) await teamRepository.recalculateTotals(currentTeamId, { session });
        await teamRepository.recalculateTotals(team.id, { session });
        teamId = team.id;
      });
    } finally {
      await session.endSession();
    }

    const [syncedTeam, updatedUser] = await Promise.all([
      teamRepository.findById(teamId),
      userRepository.findById(user.id)
    ]);

    return {
      team: syncedTeam,
      user: updatedUser
    };
  }
}
