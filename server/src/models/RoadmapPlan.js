import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    url: { type: String, required: true, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const evidenceSchema = new mongoose.Schema(
  {
    summary: { type: String, required: true, trim: true, maxlength: 1000 },
    url: { type: String, default: "", trim: true, maxlength: 500 },
    submittedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

// Fields added for career-based roadmaps all have defaults, so phases written
// by the previous version load unchanged and are back-filled by the service.
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
    completedAt: { type: Date, default: null },
    priority: { type: String, enum: ["core", "important", "supporting", null], default: null },
    expectedLevel: { type: Number, min: 1, max: 5, default: 4 },
    why: { type: String, default: "", maxlength: 300 },
    objectives: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    resources: { type: [resourceSchema], default: [] },
    exercises: { type: [String], default: [] },
    assessmentCriteria: { type: [String], default: [] },
    completedTasks: { type: [Number], default: [] },
    assessmentConfirmed: { type: [Number], default: [] },
    bookmarkedResources: { type: [String], default: [] },
    notes: { type: String, default: "", maxlength: 4000 },
    evidence: { type: [evidenceSchema], default: [] },
    fromRole: { type: String, default: null }
  },
  { _id: true }
);

const roadmapHistorySchema = new mongoose.Schema(
  {
    targetRole: { type: String, required: true },
    reason: { type: String, default: "role-change" },
    archivedAt: { type: Date, default: Date.now },
    phases: { type: [roadmapPhaseSchema], default: [] }
  },
  { _id: true }
);

const roadmapPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    targetRole: { type: String, required: true },
    careerRoleId: { type: String, default: null },
    currentPhaseIndex: { type: Number, default: 0 },
    phases: { type: [roadmapPhaseSchema], default: [] },
    history: { type: [roadmapHistorySchema], default: [] },
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
