import mongoose from "mongoose";
import { DistractionLog } from "../models/DistractionLog.js";

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

export class DistractionLogRepository {
  create(data) {
    return DistractionLog.create(data);
  }

  async createIdempotent(data) {
    if (!data.sourceEventId) return { log: await this.create(data), duplicate: false };
    try {
      return { log: await this.create(data), duplicate: false };
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const log = await DistractionLog.findOne({ user: data.user, sourceEventId: data.sourceEventId });
      if (!log) throw error;
      return { log, duplicate: true };
    }
  }

  countByUser(userId) {
    return DistractionLog.countDocuments({ user: toObjectId(userId) });
  }

  aggregateDaily(userId, days = 7) {
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days + 1);
    startDate.setUTCHours(0, 0, 0, 0);

    return DistractionLog.aggregate([
      { $match: { user: toObjectId(userId), loggedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$loggedAt", timezone: "UTC" } },
          totalMinutes: { $sum: "$duration" },
          events: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  aggregateToday(userId) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

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

  /** Hostname/app + minutes only; page URLs and titles are never read for analytics. */
  listSince(userId, since) {
    return DistractionLog.find({ user: toObjectId(userId), loggedAt: { $gte: since } })
      .select("appName duration loggedAt metadata.category metadata.site")
      .sort({ loggedAt: 1 })
      .lean();
  }

  deleteOlderThan(userId, cutoff) {
    return DistractionLog.deleteMany({ user: toObjectId(userId), loggedAt: { $lt: cutoff } });
  }
}
