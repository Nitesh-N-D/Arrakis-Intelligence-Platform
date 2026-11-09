import { Router } from "express";
import { RoadmapController } from "../controllers/roadmapController.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimitMiddleware } from "../middleware/rateLimitMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new RoadmapController();
const roadmapWriteLimit = rateLimitMiddleware({
  namespace: "roadmap-write",
  windowMs: 15 * 60 * 1000,
  max: 300,
  byUser: true,
  message: "Too many roadmap updates in a short time. Wait a moment and try again."
});

router.get("/current", protect, asyncHandler(controller.current.bind(controller)));
router.patch("/phases/:phaseId", protect, roadmapWriteLimit, asyncHandler(controller.updatePhase.bind(controller)));
router.post("/phases/:phaseId/evidence", protect, roadmapWriteLimit, asyncHandler(controller.addEvidence.bind(controller)));
router.delete("/phases/:phaseId/evidence/:evidenceId", protect, roadmapWriteLimit, asyncHandler(controller.removeEvidence.bind(controller)));
router.post("/phases/:phaseId/complete", protect, roadmapWriteLimit, asyncHandler(controller.completePhase.bind(controller)));

export default router;
