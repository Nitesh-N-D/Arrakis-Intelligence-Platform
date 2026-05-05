import { Router } from "express";
import analyticsRoutes from "./analyticsRoutes.js";
import authRoutes from "./authRoutes.js";
import focusRoutes from "./focusRoutes.js";
import prescienceRoutes from "./prescienceRoutes.js";
import skillRoutes from "./skillRoutes.js";
import stormRoutes from "./stormRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/skills", skillRoutes);
router.use("/focus", focusRoutes);
router.use("/spice", focusRoutes);
router.use("/storm", stormRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/prescience", prescienceRoutes);

export default router;
