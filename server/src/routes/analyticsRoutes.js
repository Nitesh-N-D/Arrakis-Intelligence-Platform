import { Router } from "express";
import { AnalyticsController } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new AnalyticsController();

router.get("/behavior", protect, asyncHandler(controller.behavior.bind(controller)));
router.get("/weekly-review", protect, asyncHandler(controller.weeklyReview.bind(controller)));
router.get("/dashboard", protect, asyncHandler(controller.dashboard.bind(controller)));

export default router;
