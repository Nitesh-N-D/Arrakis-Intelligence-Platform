import { Router } from "express";
import { AnalyticsController } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new AnalyticsController();

router.get("/dashboard", protect, asyncHandler(controller.dashboard.bind(controller)));

export default router;
