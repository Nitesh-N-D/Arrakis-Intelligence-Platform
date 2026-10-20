import { Router } from "express";
import { ProfileController } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rateLimitMiddleware } from "../middleware/rateLimitMiddleware.js";

const router = Router();
const controller = new ProfileController();
const profileWriteLimit = rateLimitMiddleware({ namespace: "profile-write", max: 30, byUser: true, message: "Profile settings were updated too often. Try again later." });
const accountDataLimit = rateLimitMiddleware({ namespace: "account-data", windowMs: 60 * 60 * 1000, max: 3, byUser: true, message: "Account data actions are limited to three per hour. Try again later." });

router.get("/", protect, asyncHandler(controller.show.bind(controller)));
router.patch("/", protect, profileWriteLimit, asyncHandler(controller.update.bind(controller)));
router.patch("/settings", protect, profileWriteLimit, asyncHandler(controller.updateSettings.bind(controller)));
router.get("/export", protect, accountDataLimit, asyncHandler(controller.exportAccount.bind(controller)));
router.delete("/account", protect, accountDataLimit, asyncHandler(controller.deleteAccount.bind(controller)));

export default router;
