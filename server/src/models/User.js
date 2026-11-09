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
    focusPresets: { type: [Number], default: () => [25, 50] },
    breakMinutes: { type: Number, default: 5, min: 1, max: 60 },
    longBreakMinutes: { type: Number, default: 15, min: 1, max: 120 },
    stormWarningMinutes: { type: Number, default: 60 },
    blockedSites: { type: [String], default: [] },
    strictBlockMode: { type: Boolean, default: false },
    extensionOverrideMinutes: { type: Number, default: 5 },
    // "always": block listed sites at all times; "focus-only": only during a running focus session; "off": never block.
    blockingPolicy: { type: String, enum: ["always", "focus-only", "off"], default: "always" },
    // Consent switch for the extension's hostname + duration tracking. Paused means nothing is sent.
    trackingPaused: { type: Boolean, default: false },
    // What teammates can see about this user: aggregate focus totals, or nothing beyond membership.
    teamSharing: { type: String, enum: ["summary", "none"], default: "summary" },
    // 0 keeps records until the user deletes them; otherwise focus/distraction records older than N days are purged.
    dataRetentionDays: { type: Number, enum: [0, 30, 90, 180, 365], default: 0 },
    dailyBriefingEnabled: { type: Boolean, default: true },
    // Incremented whenever an extension-relevant setting changes; used for sync conflict detection.
    policyVersion: { type: Number, default: 0, min: 0 },
    policyUpdatedAt: { type: Date, default: null },
    theme: { type: String, enum: ["dark", "system"], default: "dark" },
    desktopNotificationsEnabled: { type: Boolean, default: true },
    stormAlarmEnabled: { type: Boolean, default: true },
    weeklyDigestEnabled: { type: Boolean, default: true }
  },
  { _id: false }
);

const onboardingSchema = new mongoose.Schema(
  {
    completed: { type: Boolean, default: false },
    currentStep: { type: Number, default: 1 },
    dismissedAt: { type: Date, default: null }
  },
  { _id: false }
);

const careerSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    priority: { type: String, enum: ["core", "important", "supporting"], default: "important" }
  },
  { _id: false }
);

const experienceEnum = ["beginner", "intermediate", "advanced", "expert", null];

// Structured career selection. Absent on accounts created before the career
// catalogue; those users are resolved from `targetRole` and are never blocked.
const careerSchema = new mongoose.Schema(
  {
    roleId: { type: String, default: null, trim: true, maxlength: 80 },
    title: { type: String, default: "", trim: true, maxlength: 80 },
    category: { type: String, default: "other", trim: true, maxlength: 40 },
    description: { type: String, default: "", trim: true, maxlength: 280 },
    isCustom: { type: Boolean, default: false },
    customSkills: { type: [careerSkillSchema], default: [] },
    experienceLevel: { type: String, enum: experienceEnum, default: null },
    targetLevel: { type: String, enum: experienceEnum, default: null },
    timelineMonths: { type: Number, enum: [3, 6, 12, 24, null], default: null },
    // Set only when a brand-new account is created through Google sign-in.
    selectionPending: { type: Boolean, default: false },
    selectedAt: { type: Date, default: null },
    catalogueVersion: { type: String, default: null }
  },
  { _id: false }
);

const careerHistorySchema = new mongoose.Schema(
  {
    roleId: { type: String, default: null },
    title: { type: String, required: true, maxlength: 80 },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 280 },
    skills: { type: [userSkillSchema], default: [] },
    targetRole: { type: String, default: "AI Systems Engineer" },
    career: { type: careerSchema, default: undefined },
    careerHistory: { type: [careerHistorySchema], default: [] },
    totalSpice: { type: Number, default: 0 },
    currentRank: { type: String, default: "Outworlder" },
    focusStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    stormModeActive: { type: Boolean, default: false },
    organizationId: { type: String, default: null, trim: true },
    teamRole: { type: String, enum: ["owner", "member"], default: "member" },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    preferences: { type: preferenceSchema, default: () => ({}) },
    onboarding: { type: onboardingSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
