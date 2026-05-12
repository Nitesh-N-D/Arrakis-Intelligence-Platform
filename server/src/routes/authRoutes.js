import { Router } from "express";
import { passport } from "../config/passport.js";
import { AuthController } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimitMiddleware } from "../middleware/rateLimitMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new AuthController();
const authRateLimit = rateLimitMiddleware({
  namespace: "auth",
  max: 25,
  message: "Too many authentication attempts. Please wait and try again."
});
const refreshRateLimit = rateLimitMiddleware({
  namespace: "refresh",
  max: 60,
  message: "Too many token refresh attempts. Please wait and try again."
});

router.post("/register", authRateLimit, asyncHandler(controller.register.bind(controller)));
router.post("/login", authRateLimit, asyncHandler(controller.login.bind(controller)));
router.post("/refresh", refreshRateLimit, asyncHandler(controller.refresh.bind(controller)));
router.post("/logout", asyncHandler(controller.logout.bind(controller)));
router.get("/me", protect, asyncHandler(controller.me.bind(controller)));
router.get("/google/url", authRateLimit, asyncHandler(controller.googleUrl.bind(controller)));
router.get("/google", authRateLimit, asyncHandler(controller.ensureGoogleConfigured.bind(controller)), passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  authRateLimit,
  asyncHandler(controller.ensureGoogleConfigured.bind(controller)),
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/v1/auth/google/failure"
  }),
  asyncHandler(controller.googleCallback.bind(controller))
);
router.get("/google/failure", asyncHandler(controller.googleFailure.bind(controller)));

export default router;
