import { Router } from "express";
import { LeaderboardController } from "../controllers/leaderboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new LeaderboardController();

router.get("/users", protect, asyncHandler(controller.users.bind(controller)));
router.get("/teams", protect, asyncHandler(controller.teams.bind(controller)));

export default router;
