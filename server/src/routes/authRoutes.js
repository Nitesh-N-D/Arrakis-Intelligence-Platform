import { Router } from "express";
import { passport } from "../config/passport.js";
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
router.get("/google", asyncHandler(controller.ensureGoogleConfigured.bind(controller)), passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  asyncHandler(controller.ensureGoogleConfigured.bind(controller)),
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/v1/auth/google/failure"
  }),
  asyncHandler(controller.googleCallback.bind(controller))
);
router.get("/google/failure", asyncHandler(controller.googleFailure.bind(controller)));

export default router;
