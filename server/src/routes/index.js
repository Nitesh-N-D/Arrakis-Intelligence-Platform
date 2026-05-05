import { Router } from "express";
import analyticsRoutes from "./analyticsRoutes.js";
import authRoutes from "./authRoutes.js";
import focusRoutes from "./focusRoutes.js";
import leaderboardRoutes from "./leaderboardRoutes.js";
import prescienceRoutes from "./prescienceRoutes.js";
import roadmapRoutes from "./roadmapRoutes.js";
import skillRoutes from "./skillRoutes.js";
import stormRoutes from "./stormRoutes.js";
import teamRoutes from "./teamRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/focus", focusRoutes);
router.use("/spice", focusRoutes);
router.use("/storm", stormRoutes);
router.use("/skills", skillRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/prescience", prescienceRoutes);
router.use("/roadmap", roadmapRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/team", teamRoutes);

export default router;
