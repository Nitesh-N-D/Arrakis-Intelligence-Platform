import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { DistractionLog } from "../models/DistractionLog.js";
import { FocusSession } from "../models/FocusSession.js";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/password.js";

const seed = async () => {
  await connectDatabase();

  await Promise.all([User.deleteMany({}), FocusSession.deleteMany({}), DistractionLog.deleteMany({})]);

  const passwordHash = await hashPassword("Arrakis@123");
  const user = await User.create({
    name: "Paul Atreides",
    email: "paul@arrakis.ai",
    passwordHash,
    role: "admin",
    targetRole: "AI Systems Engineer",
    totalSpice: 640,
    currentRank: "Mentat Adept",
    focusStreak: 6,
    skills: [
      { name: "Node.js", level: 4 },
      { name: "React", level: 4 },
      { name: "MongoDB", level: 3 },
      { name: "System Design", level: 3 },
      { name: "Docker", level: 2 },
      { name: "Security", level: 2 }
    ]
  });

  const today = new Date();
  const focusDocs = Array.from({ length: 7 }).map((_, index) => {
    const completedAt = new Date(today);
    completedAt.setDate(today.getDate() - (6 - index));
    completedAt.setHours(10, 0, 0, 0);
    return {
      user: user._id,
      duration: index % 2 === 0 ? 50 : 25,
      type: index % 2 === 0 ? "deep-50" : "pomodoro-25",
      productivityScore: 70 + index * 3,
      spiceEarned: 40 + index * 6,
      startedAt: new Date(completedAt.getTime() - 50 * 60000),
      completedAt,
      status: "completed"
    };
  });

  const distractionDocs = Array.from({ length: 7 }).map((_, index) => {
    const loggedAt = new Date(today);
    loggedAt.setDate(today.getDate() - (6 - index));
    loggedAt.setHours(15, 0, 0, 0);
    return {
      user: user._id,
      appName: index % 2 === 0 ? "YouTube" : "Instagram",
      duration: 20 + index * 8,
      severity: index > 4 ? "high" : "medium",
      loggedAt,
      metadata: { device: "desktop", category: "social" }
    };
  });

  await FocusSession.insertMany(focusDocs);
  await DistractionLog.insertMany(distractionDocs);

  console.log("Seed complete");
  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
