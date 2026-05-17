import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    duration: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ["pomodoro-25", "deep-50", "custom"], required: true },
    status: { type: String, enum: ["completed", "abandoned"], default: "completed" },
    spiceEarned: { type: Number, required: true, min: 0 },
    productivityScore: { type: Number, required: true, min: 0, max: 100, default: 100 },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

focusSessionSchema.index({ user: 1, completedAt: -1 });

export const FocusSession = mongoose.model("FocusSession", focusSessionSchema);
