import { Router } from "express";
import { MentatController } from "../controllers/mentatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new MentatController();

router.post("/analyze", protect, asyncHandler(controller.analyze.bind(controller)));

export default router;
