import { Router } from "express";
import { BillingController } from "../controllers/billingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new BillingController();

router.get("/plans", asyncHandler(controller.plans.bind(controller)));
router.get("/status", protect, asyncHandler(controller.status.bind(controller)));
router.post("/checkout-session", protect, asyncHandler(controller.checkout.bind(controller)));
router.post("/customer-portal", protect, asyncHandler(controller.portal.bind(controller)));

export default router;
