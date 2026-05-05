import mongoose from "mongoose";

const userSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 1, max: 5 }
  },
  { _id: false }
);

const preferenceSchema = new mongoose.Schema(
  {
    focusDurationPreference: { type: Number, default: 50 },
    stormWarningMinutes: { type: Number, default: 60 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    skills: { type: [userSkillSchema], default: [] },
    targetRole: { type: String, default: "AI Systems Engineer" },
    totalSpice: { type: Number, default: 0 },
    currentRank: { type: String, default: "Outworlder" },
    focusStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    stormModeActive: { type: Boolean, default: false },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    preferences: { type: preferenceSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
