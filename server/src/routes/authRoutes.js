import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new AuthController();

router.post("/register", asyncHandler(controller.register.bind(controller)));
router.post("/login", asyncHandler(controller.login.bind(controller)));
router.post("/refresh", asyncHandler(controller.refresh.bind(controller)));
router.post("/logout", asyncHandler(controller.logout.bind(controller)));
router.get("/me", protect, asyncHandler(controller.me.bind(controller)));
router.get("/google/url", asyncHandler(controller.googleUrl.bind(controller)));
router.post("/google/callback", asyncHandler(controller.googleCallback.bind(controller)));

export default router;
