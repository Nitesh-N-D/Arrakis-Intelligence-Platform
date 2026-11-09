import mongoose from "mongoose";
import { Goal } from "../models/Goal.js";

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

export class GoalRepository {
  create(data) {
    return Goal.create(data);
  }

  listByUser(userId) {
    return Goal.find({ user: toObjectId(userId) }).sort({ status: 1, deadline: 1, createdAt: -1 }).lean();
  }

  countByUser(userId) {
    return Goal.countDocuments({ user: toObjectId(userId) });
  }

  findOwned(userId, goalId) {
    return Goal.findOne({ _id: goalId, user: toObjectId(userId) });
  }

  async save(goal) {
    await goal.save();
    return goal;
  }

  deleteOwned(userId, goalId) {
    return Goal.deleteOne({ _id: goalId, user: toObjectId(userId) });
  }

  listShared(userIds) {
    return Goal.find({ user: { $in: userIds.map(toObjectId) }, sharedWithTeam: true, status: { $in: ["active", "completed"] } })
      .select("user title status milestones category deadline")
      .lean();
  }
}
