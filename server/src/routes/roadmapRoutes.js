import { Router } from "express";
import { RoadmapController } from "../controllers/roadmapController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new RoadmapController();

router.get("/current", protect, asyncHandler(controller.current.bind(controller)));
router.post("/phases/:phaseId/complete", protect, asyncHandler(controller.completePhase.bind(controller)));

export default router;
