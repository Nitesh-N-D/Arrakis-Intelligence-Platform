import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    done: { type: Boolean, default: false },
    doneAt: { type: Date, default: null },
    dueDate: { type: Date, default: null }
  },
  { _id: true }
);

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: ["career", "academic", "project", "personal"], default: "personal" },
    description: { type: String, default: "", trim: true, maxlength: 600 },
    deadline: { type: Date, default: null },
    status: { type: String, enum: ["active", "paused", "completed", "abandoned"], default: "active" },
    milestones: { type: [milestoneSchema], default: [] },
    skills: { type: [String], default: [] },
    // Opt-in: share title + progress with the user's team (never description or milestones).
    sharedWithTeam: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

goalSchema.index({ user: 1, status: 1, deadline: 1 });

export const Goal = mongoose.model("Goal", goalSchema);
