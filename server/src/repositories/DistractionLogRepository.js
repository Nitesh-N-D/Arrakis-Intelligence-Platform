import mongoose from "mongoose";
import { DistractionLog } from "../models/DistractionLog.js";

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

export class DistractionLogRepository {
  create(data) {
    return DistractionLog.create(data);
  }

  countByUser(userId) {
    return DistractionLog.countDocuments({ user: toObjectId(userId) });
  }

  aggregateDaily(userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    return DistractionLog.aggregate([
      { $match: { user: toObjectId(userId), loggedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$loggedAt" } },
          totalMinutes: { $sum: "$duration" },
          events: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  aggregateToday(userId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return DistractionLog.aggregate([
      { $match: { user: toObjectId(userId), loggedAt: { $gte: startOfDay } } },
      {
        $group: {
          _id: "$user",
          totalMinutes: { $sum: "$duration" },
          events: { $sum: 1 },
          apps: { $push: "$appName" }
        }
      }
    ]);
  }
}
