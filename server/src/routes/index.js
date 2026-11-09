import { Router } from "express";
import analyticsRoutes from "./analyticsRoutes.js";
import authRoutes from "./authRoutes.js";
import careerRoutes from "./careerRoutes.js";
import focusRoutes from "./focusRoutes.js";
import leaderboardRoutes from "./leaderboardRoutes.js";
import { goalRouter, missionRouter } from "./planningRoutes.js";
import mentatRoutes from "./mentatRoutes.js";
import prescienceRoutes from "./prescienceRoutes.js";
import profileRoutes from "./profileRoutes.js";
import roadmapRoutes from "./roadmapRoutes.js";
import skillRoutes from "./skillRoutes.js";
import stormRoutes from "./stormRoutes.js";
import teamRoutes from "./teamRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/career", careerRoutes);
router.use("/focus", focusRoutes);
router.use("/spice", focusRoutes);
router.use("/storm", stormRoutes);
router.use("/skills", skillRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/prescience", prescienceRoutes);
router.use("/mentat", mentatRoutes);
router.use("/missions", missionRouter);
router.use("/goals", goalRouter);
router.use("/profile", profileRoutes);
router.use("/roadmap", roadmapRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/team", teamRoutes);

export default router;
