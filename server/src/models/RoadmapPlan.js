import mongoose from "mongoose";

const roadmapPhaseSchema = new mongoose.Schema(
  {
    phaseNumber: { type: Number, required: true },
    skill: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    priorityScore: { type: Number, required: true, min: 0 },
    durationWeeks: { type: Number, required: true, min: 1 },
    tasks: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["locked", "active", "done", "skipped"],
      default: "locked"
    },
    skillLevelAtGeneration: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
  },
  { _id: true }
);

const roadmapPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    targetRole: { type: String, required: true },
    currentPhaseIndex: { type: Number, default: 0 },
    phases: { type: [roadmapPhaseSchema], default: [] },
    generatedFromSkillSnapshot: {
      type: [
        new mongoose.Schema(
          {
            name: { type: String, required: true },
            level: { type: Number, required: true }
          },
          { _id: false }
        )
      ],
      default: []
    }
  },
  { timestamps: true }
);

export const RoadmapPlan = mongoose.model("RoadmapPlan", roadmapPlanSchema);
