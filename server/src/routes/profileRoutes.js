import { Router } from "express";
import { ProfileController } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new ProfileController();

router.get("/", protect, asyncHandler(controller.show.bind(controller)));
router.patch("/", protect, asyncHandler(controller.update.bind(controller)));
router.patch("/settings", protect, asyncHandler(controller.updateSettings.bind(controller)));

export default router;
