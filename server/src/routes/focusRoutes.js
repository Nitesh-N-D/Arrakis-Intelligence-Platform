import { Router } from "express";
import { FocusController } from "../controllers/focusController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rateLimitMiddleware } from "../middleware/rateLimitMiddleware.js";

const router = Router();
const controller = new FocusController();
const focusWriteLimit = rateLimitMiddleware({ namespace: "focus-write", max: 40, byUser: true, message: "Focus session actions are happening too quickly. Try again shortly." });

router.get("/sessions/active", protect, asyncHandler(controller.active.bind(controller)));
router.post("/sessions", protect, focusWriteLimit, asyncHandler(controller.create.bind(controller)));
router.patch("/sessions/:sessionId/pause", protect, focusWriteLimit, asyncHandler(controller.pause.bind(controller)));
router.patch("/sessions/:sessionId/resume", protect, focusWriteLimit, asyncHandler(controller.resume.bind(controller)));
router.delete("/sessions/:sessionId", protect, focusWriteLimit, asyncHandler(controller.reset.bind(controller)));
router.post("/sessions/:sessionId/complete", protect, focusWriteLimit, asyncHandler(controller.harvest.bind(controller)));
router.post("/harvest", protect, focusWriteLimit, asyncHandler(controller.legacyHarvest.bind(controller)));

export default router;
