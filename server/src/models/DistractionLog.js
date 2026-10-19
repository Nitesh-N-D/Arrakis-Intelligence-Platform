import mongoose from "mongoose";

const distractionLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sourceEventId: { type: String, default: undefined, maxlength: 80 },
    appName: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1 },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    loggedAt: { type: Date, default: Date.now },
    metadata: {
      device: { type: String, default: "desktop" },
      category: { type: String, default: "general" },
      source: { type: String, default: "manual" },
      site: { type: String, default: "" },
      url: { type: String, default: "" },
      pageTitle: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

distractionLogSchema.index({ user: 1, loggedAt: -1 });
distractionLogSchema.index({ user: 1, sourceEventId: 1 }, { unique: true, partialFilterExpression: { sourceEventId: { $type: "string" } } });

export const DistractionLog = mongoose.model("DistractionLog", distractionLogSchema);
