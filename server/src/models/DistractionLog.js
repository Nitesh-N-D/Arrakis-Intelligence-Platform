import mongoose from "mongoose";

const distractionLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appName: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1 },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    loggedAt: { type: Date, default: Date.now },
    metadata: {
      device: { type: String, default: "desktop" },
      category: { type: String, default: "general" },
    },
  },
  { timestamps: true },
);

export const DistractionLog = mongoose.model("DistractionLog", distractionLogSchema);
