import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

export class TeamRepository {
  create(data) {
    return Team.create(data);
  }

  findById(id) {
    return Team.findById(id).populate("members", "name email totalSpice focusStreak currentRank");
  }

  findByName(name) {
    return Team.findOne({ name: new RegExp(`^${name}$`, "i") }).populate(
      "members",
      "name email totalSpice focusStreak currentRank"
    );
  }

  updateById(id, update) {
    return Team.findByIdAndUpdate(id, update, { new: true }).populate(
      "members",
      "name email totalSpice focusStreak currentRank"
    );
  }

  async addMember(teamId, userId) {
    await Team.findByIdAndUpdate(teamId, {
      $addToSet: { members: toObjectId(userId) }
    });

    return this.findById(teamId);
  }

  async removeMember(teamId, userId) {
    if (!teamId) {
      return null;
    }

    await Team.findByIdAndUpdate(teamId, {
      $pull: { members: toObjectId(userId) }
    });

    return this.findById(teamId);
  }

  listTopTeams(limit = 10) {
    return Team.find({})
      .populate("members", "name")
      .sort({ totalSpice: -1, totalStreak: -1, createdAt: 1 })
      .limit(limit);
  }

  async recalculateTotals(teamId) {
    const [totals] = await User.aggregate([
      { $match: { team: toObjectId(teamId) } },
      {
        $group: {
          _id: "$team",
          totalSpice: { $sum: "$totalSpice" },
          totalStreak: { $sum: "$focusStreak" }
        }
      }
    ]);

    return Team.findByIdAndUpdate(
      teamId,
      {
        totalSpice: totals?.totalSpice || 0,
        totalStreak: totals?.totalStreak || 0
      },
      { new: true }
    ).populate("members", "name email totalSpice focusStreak currentRank");
  }
}
