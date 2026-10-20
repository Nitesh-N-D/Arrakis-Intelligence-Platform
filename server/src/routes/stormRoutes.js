import { Router } from "express";
import { StormController } from "../controllers/stormController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rateLimitMiddleware } from "../middleware/rateLimitMiddleware.js";

const router = Router();
const controller = new StormController();
const stormSyncLimit = rateLimitMiddleware({ namespace: "storm-sync", max: 120, byUser: true, message: "Storm activity is syncing too frequently. Wait before retrying." });

router.post("/log", protect, stormSyncLimit, asyncHandler(controller.log.bind(controller)));

export default router;
