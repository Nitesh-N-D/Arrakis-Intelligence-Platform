import mongoose from "mongoose";
import { env } from "./env.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { RateLimitBucket } from "../models/RateLimitBucket.js";

const ensureRefreshTokenIndexes = async () => {
  try {
    await RefreshToken.createIndexes();
  } catch (error) {
    console.warn("Refresh token index creation warning", error?.name || "Error");
  }
};

const ensureRateLimitIndexes = async () => {
  try {
    await RateLimitBucket.createIndexes();
  } catch (error) {
    console.warn("Rate limit index creation warning", error?.name || "Error");
  }
};

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  await ensureRefreshTokenIndexes();
  await ensureRateLimitIndexes();
  console.log("MongoDB connected");
};
