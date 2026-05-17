import mongoose from "mongoose";
import { env } from "./env.js";
import { RefreshToken } from "../models/RefreshToken.js";

const syncRefreshTokenIndexes = async () => {
  try {
    const collection = mongoose.connection.collection(RefreshToken.collection.name);
    const indexes = await collection.indexes();

    for (const legacyName of ["token_1", "refreshToken_1"]) {
      if (indexes.some((index) => index.name === legacyName)) {
        await collection.dropIndex(legacyName);
      }
    }

    await RefreshToken.syncIndexes();
  } catch (error) {
    console.warn("Refresh token index sync warning", error.message);
  }
};

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  await syncRefreshTokenIndexes();
  console.log("MongoDB connected");
};
