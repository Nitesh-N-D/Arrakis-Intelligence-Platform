import mongoose from "mongoose";

const rateLimitBucketSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, min: 0 },
    resetAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true }
  },
  { versionKey: false, timestamps: false }
);

rateLimitBucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitBucket = mongoose.model("RateLimitBucket", rateLimitBucketSchema);
