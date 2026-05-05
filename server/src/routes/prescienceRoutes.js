import { Router } from "express";
import { PrescienceController } from "../controllers/prescienceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new PrescienceController();

router.get("/analyze", protect, asyncHandler(controller.analyze.bind(controller)));

export default router;
