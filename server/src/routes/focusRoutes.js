import { Router } from "express";
import { FocusController } from "../controllers/focusController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new FocusController();

router.post("/sessions", protect, asyncHandler(controller.create.bind(controller)));
router.post("/harvest", protect, asyncHandler(controller.harvest.bind(controller)));

export default router;
