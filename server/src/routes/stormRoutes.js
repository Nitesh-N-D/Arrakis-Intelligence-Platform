import { Router } from "express";
import { StormController } from "../controllers/stormController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new StormController();

router.post("/log", protect, asyncHandler(controller.log.bind(controller)));

export default router;
