import { Router } from "express";
import { TeamController } from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const controller = new TeamController();

router.post("/create", protect, asyncHandler(controller.create.bind(controller)));
router.post("/join", protect, asyncHandler(controller.join.bind(controller)));

export default router;
