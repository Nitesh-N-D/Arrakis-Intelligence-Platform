import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

export class TeamRepository {
  create(data, options = {}) {
    if (options.session) {
      return Team.create([data], options).then(([team]) => team);
    }
    return Team.create(data);
  }

  findById(id, options = {}) {
    const query = Team.findById(id).populate("members", "name totalSpice focusStreak currentRank");
    return options.session ? query.session(options.session) : query;
  }

  findByName(name, options = {}) {
    const escapedName = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = Team.findOne({ name: new RegExp(`^${escapedName}$`, "i") }).populate(
      "members", "name totalSpice focusStreak currentRank"
    );
    return options.session ? query.session(options.session) : query;
  }

  updateById(id, update) {
    return Team.findByIdAndUpdate(id, update, { new: true }).populate(
      "members", "name totalSpice focusStreak currentRank"
    );
  }

  async addMember(teamId, userId, options = {}) {
    await Team.findByIdAndUpdate(teamId, {
      $addToSet: { members: toObjectId(userId) }
    }, options.session ? { session: options.session } : {});

    return this.findById(teamId, options);
  }

  async removeMember(teamId, userId, options = {}) {
    if (!teamId) {
      return null;
    }

    await Team.findByIdAndUpdate(teamId, {
      $pull: { members: toObjectId(userId) }
    }, options.session ? { session: options.session } : {});

    return this.findById(teamId, options);
  }

  listTopTeams(limit = 10) {
    return Team.find({})
      .populate("members", "name")
      .sort({ totalSpice: -1, totalStreak: -1, createdAt: 1 })
      .limit(limit);
  }

  async recalculateTotals(teamId, options = {}) {
    let aggregation = User.aggregate([
      { $match: { team: toObjectId(teamId) } },
      {
        $group: {
          _id: "$team",
          totalSpice: { $sum: "$totalSpice" },
          totalStreak: { $sum: "$focusStreak" }
        }
      }
    ]);
    if (options.session) aggregation = aggregation.session(options.session);

    const [totals] = await aggregation;
    let query = Team.findByIdAndUpdate(
      teamId,
      {
        totalSpice: totals?.totalSpice || 0,
        totalStreak: totals?.totalStreak || 0
      },
      { new: true, ...(options.session ? { session: options.session } : {}) }
    ).populate("members", "name totalSpice focusStreak currentRank");
    if (options.session) query = query.session(options.session);
    return query;
  }
}
