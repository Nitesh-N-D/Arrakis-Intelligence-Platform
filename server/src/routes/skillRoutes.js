import { Router } from "express";
import { SkillController } from "../controllers/skillController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new SkillController();

router.get("/matrix", protect, asyncHandler(controller.matrix.bind(controller)));
router.post("/analyze", protect, asyncHandler(controller.analyze.bind(controller)));

export default router;
