import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    totalSpice: { type: Number, default: 0 },
    totalStreak: { type: Number, default: 0 }
  },
  { timestamps: true }
);

teamSchema.index({ totalSpice: -1, totalStreak: -1 });

export const Team = mongoose.model("Team", teamSchema);
