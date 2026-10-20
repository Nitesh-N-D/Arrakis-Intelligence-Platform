import { createHash } from "node:crypto";
import { RateLimitBucket } from "../models/RateLimitBucket.js";

const fingerprint = (key) => createHash("sha256").update(String(key)).digest("hex");

export class RateLimitBucketRepository {
  async consume(key, { windowMs, now = Date.now() }) {
    const nowDate = new Date(now);
    const resetAt = new Date(now + windowMs);
    const isExpired = { $lte: [{ $ifNull: ["$expiresAt", new Date(0)] }, nowDate] };
    const update = [{
      $set: {
        count: { $cond: [isExpired, 1, { $add: [{ $ifNull: ["$count", 0] }, 1] }] },
        resetAt: { $cond: [isExpired, resetAt, "$resetAt"] },
        expiresAt: { $cond: [isExpired, resetAt, "$expiresAt"] }
      }
    }];

    let bucket;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        bucket = await RateLimitBucket.findOneAndUpdate(
          { _id: fingerprint(key) },
          update,
          { upsert: true, returnDocument: "after", timestamps: false }
        );
        break;
      } catch (error) {
        if (error?.code !== 11000 || attempt === 1) throw error;
      }
    }

    return { count: bucket.count, resetAt: bucket.resetAt.getTime() };
  }
}
