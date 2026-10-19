import mongoose from "mongoose";
import { FocusSession } from "../models/FocusSession.js";

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

export class FocusSessionRepository {
  create(data) {
    return FocusSession.create(data);
  }

  findActiveByUser(userId, session = null) {
    const query = FocusSession.findOne({ user: toObjectId(userId), active: true, status: { $in: ["running", "paused"] } }).sort({ createdAt: -1 });
    return session ? query.session(session) : query;
  }

  findCompletedByUserAndId(userId, sessionId, session = null) {
    const query = FocusSession.findOne({
      _id: sessionId,
      user: toObjectId(userId),
      status: "completed",
      active: false
    });
    return session ? query.session(session) : query;
  }

  transition(userId, sessionId, from, update) {
    return FocusSession.findOneAndUpdate(
      { _id: sessionId, user: toObjectId(userId), active: true, status: from },
      { $set: update },
      { new: true, runValidators: true }
    );
  }

  completeIfDue(userId, sessionId, now, minimumStartedAt, spiceEarned, session = null) {
    const query = FocusSession.findOneAndUpdate(
      { _id: sessionId, user: toObjectId(userId), active: true, status: "running", startedAt: { $lte: minimumStartedAt } },
      { $set: { status: "completed", active: false, completedAt: now, spiceEarned } },
      { new: true, runValidators: true, session }
    );
    return query;
  }

  countByUser(userId) {
    return FocusSession.countDocuments({ user: toObjectId(userId), status: "completed" });
  }

  aggregateDaily(userId, days = 7) {
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days + 1);
    startDate.setUTCHours(0, 0, 0, 0);

    return FocusSession.aggregate([
      { $match: { user: toObjectId(userId), completedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt", timezone: "UTC" } },
          totalMinutes: { $sum: "$duration" },
          totalSpice: { $sum: "$spiceEarned" },
          averageProductivity: { $avg: "$productivityScore" },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }
}
