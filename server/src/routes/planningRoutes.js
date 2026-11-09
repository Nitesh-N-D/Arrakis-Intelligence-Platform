import { Router } from "express";
import { GoalController, MissionController } from "../controllers/planningController.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimitMiddleware } from "../middleware/rateLimitMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const planningWriteLimit = rateLimitMiddleware({
  namespace: "planning-write",
  max: 120,
  byUser: true,
  message: "Planning changes are happening too quickly. Try again shortly."
});

const missions = new MissionController();
export const missionRouter = Router();
missionRouter.get("/", protect, asyncHandler(missions.board.bind(missions)));
missionRouter.post("/", protect, planningWriteLimit, asyncHandler(missions.create.bind(missions)));
missionRouter.post("/carry-forward", protect, planningWriteLimit, asyncHandler(missions.carryForward.bind(missions)));
missionRouter.patch("/:missionId", protect, planningWriteLimit, asyncHandler(missions.update.bind(missions)));
missionRouter.delete("/:missionId", protect, planningWriteLimit, asyncHandler(missions.remove.bind(missions)));

const goals = new GoalController();
export const goalRouter = Router();
goalRouter.get("/", protect, asyncHandler(goals.list.bind(goals)));
goalRouter.post("/", protect, planningWriteLimit, asyncHandler(goals.create.bind(goals)));
goalRouter.patch("/:goalId", protect, planningWriteLimit, asyncHandler(goals.update.bind(goals)));
goalRouter.patch("/:goalId/milestones/:milestoneId", protect, planningWriteLimit, asyncHandler(goals.toggleMilestone.bind(goals)));
goalRouter.delete("/:goalId", protect, planningWriteLimit, asyncHandler(goals.remove.bind(goals)));
