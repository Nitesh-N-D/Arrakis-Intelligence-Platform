import { Router } from "express";
import { CareerController } from "../controllers/careerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimitMiddleware } from "../middleware/rateLimitMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new CareerController();
const careerWriteLimit = rateLimitMiddleware({
  namespace: "career-write",
  windowMs: 15 * 60 * 1000,
  max: 60,
  byUser: true,
  message: "Too many career changes in a short time. Wait a few minutes and try again."
});

// The catalogue is public data (used on the registration page before sign-in).
router.get("/catalogue", asyncHandler(controller.catalogue.bind(controller)));
router.get("/", protect, asyncHandler(controller.current.bind(controller)));
router.post("/preview", protect, careerWriteLimit, asyncHandler(controller.preview.bind(controller)));
router.put("/", protect, careerWriteLimit, asyncHandler(controller.update.bind(controller)));
router.post("/suggest-skills", protect, careerWriteLimit, asyncHandler(controller.suggestSkills.bind(controller)));

export default router;
