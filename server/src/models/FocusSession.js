import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    duration: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ["pomodoro-25", "deep-50", "custom"], required: true },
    status: { type: String, enum: ["running", "paused", "completed", "abandoned"], default: "completed" },
    active: { type: Boolean, default: false },
    remainingMs: { type: Number, default: null, min: 0 },
    spiceEarned: { type: Number, required: true, min: 0 },
    productivityScore: { type: Number, required: true, min: 0, max: 100, default: 100 },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
    // Optional Daily Mission this session is allocated to; credited only after server-verified completion.
    mission: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", default: null },
    // Number of times the session was paused; used for interruption-recovery insights.
    pauseCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

focusSessionSchema.index({ user: 1, completedAt: -1 });
focusSessionSchema.index({ user: 1, status: 1 });
focusSessionSchema.index({ user: 1, active: 1 }, { unique: true, partialFilterExpression: { active: true } });

export const FocusSession = mongoose.model("FocusSession", focusSessionSchema);
