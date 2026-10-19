import mongoose from "mongoose";
import { env } from "./env.js";
import { RefreshToken } from "../models/RefreshToken.js";

const ensureRefreshTokenIndexes = async () => {
  try {
    await RefreshToken.createIndexes();
  } catch (error) {
    console.warn("Refresh token index creation warning", error?.name || "Error");
  }
};

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  await ensureRefreshTokenIndexes();
  console.log("MongoDB connected");
};
