import mongoose from "mongoose";
import { FocusSession } from "../models/FocusSession.js";

export class FocusSessionRepository {
  create(data) {
    return FocusSession.create(data);
  }

  aggregateDaily(userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    return FocusSession.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), completedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
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
