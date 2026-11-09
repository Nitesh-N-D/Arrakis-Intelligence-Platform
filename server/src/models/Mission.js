import mongoose from "mongoose";

// One item on a user's Daily Mission Control board. `day` is the user's local calendar day (YYYY-MM-DD)
// supplied by the client and validated on the server, so "today" follows the user rather than UTC.
const missionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
    // At most three priorities per day ("three important objectives").
    priority: { type: Boolean, default: false },
    status: { type: String, enum: ["todo", "done", "dropped"], default: "todo" },
    dueDate: { type: Date, default: null },
    plannedFocusMinutes: { type: Number, default: 0, min: 0, max: 480 },
    completedFocusMinutes: { type: Number, default: 0, min: 0 },
    focusSessions: { type: Number, default: 0, min: 0 },
    goal: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", default: null },
    carriedFrom: { type: String, default: null },
    carryCount: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date, default: null },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

missionSchema.index({ user: 1, day: 1, order: 1 });
missionSchema.index({ user: 1, status: 1, day: 1 });

export const Mission = mongoose.model("Mission", missionSchema);
