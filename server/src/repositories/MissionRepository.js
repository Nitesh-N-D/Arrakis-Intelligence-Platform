import mongoose from "mongoose";
import { Mission } from "../models/Mission.js";

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

export class MissionRepository {
  create(data) {
    return Mission.create(data);
  }

  listByDay(userId, day) {
    return Mission.find({ user: toObjectId(userId), day }).sort({ priority: -1, order: 1, createdAt: 1 }).lean();
  }

  countByDay(userId, day, filter = {}) {
    return Mission.countDocuments({ user: toObjectId(userId), day, ...filter });
  }

  findOwned(userId, missionId) {
    return Mission.findOne({ _id: missionId, user: toObjectId(userId) });
  }

  updateOwned(userId, missionId, update) {
    return Mission.findOneAndUpdate({ _id: missionId, user: toObjectId(userId) }, update, { new: true, runValidators: true }).lean();
  }

  deleteOwned(userId, missionId) {
    return Mission.deleteOne({ _id: missionId, user: toObjectId(userId) });
  }

  listOpenBefore(userId, day) {
    return Mission.find({ user: toObjectId(userId), status: "todo", day: { $lt: day } }).sort({ day: 1, order: 1 }).lean();
  }

  carryForward(userId, ids, toDay) {
    return Mission.updateMany(
      { _id: { $in: ids }, user: toObjectId(userId), status: "todo" },
      [{ $set: { carriedFrom: { $ifNull: ["$carriedFrom", "$day"] }, day: toDay, carryCount: { $add: ["$carryCount", 1] }, priority: false } }]
    );
  }

  addFocus(userId, missionId, minutes) {
    return Mission.findOneAndUpdate(
      { _id: missionId, user: toObjectId(userId) },
      { $inc: { completedFocusMinutes: minutes, focusSessions: 1 } },
      { new: true }
    ).lean();
  }

  listRange(userId, fromDay, toDay) {
    return Mission.find({ user: toObjectId(userId), day: { $gte: fromDay, $lte: toDay } }).lean();
  }

  unlinkGoal(userId, goalId) {
    return Mission.updateMany({ user: toObjectId(userId), goal: goalId }, { $set: { goal: null } });
  }
}
