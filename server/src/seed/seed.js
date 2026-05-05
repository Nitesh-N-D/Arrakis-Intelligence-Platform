import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { DistractionLog } from "../models/DistractionLog.js";
import { FocusSession } from "../models/FocusSession.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { RoadmapPlan } from "../models/RoadmapPlan.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/password.js";

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const seed = async () => {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({}),
    Team.deleteMany({}),
    FocusSession.deleteMany({}),
    DistractionLog.deleteMany({}),
    RefreshToken.deleteMany({}),
    RoadmapPlan.deleteMany({})
  ]);

  const passwordHash = await hashPassword("Arrakis@123");
  const paul = await User.create({
    name: "Paul Atreides",
    email: "paul@arrakis.ai",
    passwordHash,
    role: "admin",
    targetRole: "AI Systems Engineer",
    totalSpice: 110,
    currentRank: "Sandrunner",
    focusStreak: 4,
    lastActiveDate: startOfDay(new Date()),
    skills: [
      { name: "Node.js", level: 4 },
      { name: "React", level: 3 },
      { name: "MongoDB", level: 3 },
      { name: "System Design", level: 2 },
      { name: "Docker", level: 2 }
    ]
  });
  const chani = await User.create({
    name: "Chani Kynes",
    email: "chani@arrakis.ai",
    passwordHash,
    targetRole: "Frontend Intelligence Engineer",
    totalSpice: 165,
    currentRank: "Spice Adept",
    focusStreak: 6,
    lastActiveDate: startOfDay(new Date()),
    skills: [
      { name: "React", level: 5 },
      { name: "Framer Motion", level: 4 },
      { name: "Recharts", level: 4 }
    ]
  });
  const stilgar = await User.create({
    name: "Stilgar Idris",
    email: "stilgar@arrakis.ai",
    passwordHash,
    targetRole: "Systems Reliability Engineer",
    totalSpice: 210,
    currentRank: "Spice Master",
    focusStreak: 8,
    lastActiveDate: startOfDay(new Date()),
    skills: [
      { name: "Node.js", level: 4 },
      { name: "Docker", level: 4 },
      { name: "Monitoring", level: 5 }
    ]
  });

  const team = await Team.create({
    name: "Fremen Vanguard",
    members: [paul._id, chani._id],
    createdBy: paul._id,
    totalSpice: paul.totalSpice + chani.totalSpice,
    totalStreak: paul.focusStreak + chani.focusStreak
  });

  await Promise.all([
    User.findByIdAndUpdate(paul._id, { team: team._id }),
    User.findByIdAndUpdate(chani._id, { team: team._id })
  ]);

  const today = new Date();
  const focusDocs = Array.from({ length: 6 }).map((_, index) => {
    const completedAt = new Date(today);
    completedAt.setDate(today.getDate() - (5 - index));
    completedAt.setHours(9 + (index % 2), 0, 0, 0);
    const duration = index % 2 === 0 ? 50 : 25;

    return {
      user: paul._id,
      duration,
      type: duration === 50 ? "deep-50" : "pomodoro-25",
      status: "completed",
      spiceEarned: duration === 50 ? 25 : 10,
      productivityScore: 100,
      startedAt: new Date(completedAt.getTime() - duration * 60 * 1000),
      completedAt,
      notes: "Seeded harvest session"
    };
  });

  const distractionDocs = [35, 60, 85, 130, 170, 205].map((duration, index) => {
    const loggedAt = new Date(today);
    loggedAt.setDate(today.getDate() - (5 - index));
    loggedAt.setHours(15, 0, 0, 0);

    return {
      user: paul._id,
      appName: index % 2 === 0 ? "YouTube" : "Instagram",
      duration,
      severity: duration >= 120 ? "high" : "medium",
      loggedAt,
      metadata: {
        device: "desktop",
        category: "social",
        source: "extension",
        site: index % 2 === 0 ? "youtube.com" : "instagram.com",
        url: index % 2 === 0 ? "https://youtube.com/watch?v=arrakis" : "https://instagram.com/arrakis",
        pageTitle: index % 2 === 0 ? "Arrakis Deep Dive" : "Storm Scroll"
      }
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
