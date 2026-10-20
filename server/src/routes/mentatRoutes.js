import { Router } from "express";
import { MentatController } from "../controllers/mentatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rateLimitMiddleware } from "../middleware/rateLimitMiddleware.js";

const router = Router();
const controller = new MentatController();

router.post("/analyze", protect, rateLimitMiddleware({ namespace: "mentat", windowMs: 15 * 60 * 1000, max: 10, byUser: true, message: "Mentat is being refreshed too often. Wait a few minutes and try again." }), asyncHandler(controller.analyze.bind(controller)));

export default router;
