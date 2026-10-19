import { Router } from "express";
import { ProfileController } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rateLimitMiddleware } from "../middleware/rateLimitMiddleware.js";

const router = Router();
const controller = new ProfileController();
const profileWriteLimit = rateLimitMiddleware({ namespace: "profile-write", max: 30, byUser: true, message: "Profile settings were updated too often. Try again later." });

router.get("/", protect, asyncHandler(controller.show.bind(controller)));
router.patch("/", protect, profileWriteLimit, asyncHandler(controller.update.bind(controller)));
router.patch("/settings", protect, profileWriteLimit, asyncHandler(controller.updateSettings.bind(controller)));

export default router;
