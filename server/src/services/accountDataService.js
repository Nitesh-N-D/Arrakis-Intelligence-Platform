import mongoose from "mongoose";
import { DistractionLog } from "../models/DistractionLog.js";
import { FocusSession } from "../models/FocusSession.js";
import { RoadmapPlan } from "../models/RoadmapPlan.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { comparePassword } from "../utils/password.js";

const CONFIRMATION_TEXT = "DELETE MY ACCOUNT";
const RECENT_AUTH_WINDOW_MS = 5 * 60 * 1000;

export class AccountDataService {
  constructor({ refreshTokenRepository = new RefreshTokenRepository(), clock = Date.now } = {}) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.clock = clock;
  }

  async exportAccount(userId) {
    const user = await User.findById(userId).populate("team", "name").lean();
    if (!user) throw new ApiError(404, "User not found");

    const [focusSessions, distractionLogs, roadmap] = await Promise.all([
      FocusSession.find({ user: userId }).sort({ startedAt: 1 }).lean(),
      DistractionLog.find({ user: userId }).sort({ loggedAt: 1 }).lean(),
      RoadmapPlan.findOne({ user: userId }).lean()
    ]);

    const { _id, __v, passwordHash, googleId, ...profile } = user;
    return {
      schemaVersion: 1,
      exportedAt: new Date(this.clock()).toISOString(),
      profile: {
        ...profile,
        id: String(_id),
        provider: user.provider,
        team: user.team ? { id: String(user.team._id), name: user.team.name } : null
      },
      focusSessions,
      distractionLogs,
      roadmap
    };
  }

  async deleteAccount(userId, { confirmationEmail, confirmationText, password, authTime } = {}) {
    const user = await User.findById(userId).select("email provider passwordHash team");
    if (!user) throw new ApiError(404, "User not found");
    if (String(confirmationEmail || "").trim().toLowerCase() !== user.email) {
      throw new ApiError(400, "Enter the account email to confirm deletion");
    }
    if (user.provider === "local") {
      if (!password || !user.passwordHash || !(await comparePassword(String(password), user.passwordHash))) {
        throw new ApiError(401, "Password confirmation failed");
      }
    } else if (confirmationText !== CONFIRMATION_TEXT) {
      throw new ApiError(400, `Type ${CONFIRMATION_TEXT} to confirm account deletion`);
    }

    const authenticatedAt = authTime instanceof Date ? authTime.getTime() : Number.NaN;
    if (!Number.isFinite(authenticatedAt) || this.clock() - authenticatedAt > RECENT_AUTH_WINDOW_MS || authenticatedAt > this.clock() + 60_000) {
      throw new ApiError(401, "Sign in again before deleting your account");
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const currentUser = await User.findById(userId).session(session);
        if (!currentUser) throw new ApiError(404, "User not found");
        const teamId = currentUser.team;
        const ownershipOrMembership = [
          { members: currentUser._id },
          { createdBy: currentUser._id },
          ...(teamId ? [{ _id: teamId }] : [])
        ];
        const affectedTeams = await Team.find({ $or: ownershipOrMembership }).session(session);
        await Team.updateMany({ members: currentUser._id }, { $pull: { members: currentUser._id } }, { session });
        await User.updateOne({ _id: currentUser._id }, { $set: { team: null } }, { session });

        for (const team of affectedTeams) {
          const remainingMembers = await User.find({ team: team._id, _id: { $ne: currentUser._id } })
            .sort({ createdAt: 1, _id: 1 }).session(session).select("_id");
          if (remainingMembers.length === 0) {
            await Team.deleteOne({ _id: team._id }, { session });
            continue;
          }

          const nextOwner = String(team.createdBy) === String(currentUser._id)
            ? remainingMembers[0]._id
            : team.createdBy;
          const [totals] = await User.aggregate([
            { $match: { team: team._id } },
            { $group: { _id: "$team", totalSpice: { $sum: "$totalSpice" }, totalStreak: { $sum: "$focusStreak" } } }
          ]).session(session);
          await Team.updateOne({ _id: team._id }, {
            $set: {
              members: remainingMembers.map((member) => member._id),
              createdBy: nextOwner,
              totalSpice: totals?.totalSpice || 0,
              totalStreak: totals?.totalStreak || 0
            }
          }, { session });
        }

        await FocusSession.deleteMany({ user: currentUser._id }, { session });
        await DistractionLog.deleteMany({ user: currentUser._id }, { session });
        await RoadmapPlan.deleteMany({ user: currentUser._id }, { session });
        await this.refreshTokenRepository.deleteByUserId(currentUser._id, { session });
        await User.deleteOne({ _id: currentUser._id }, { session });
      });
    } finally {
      await session.endSession();
    }
  }
}
