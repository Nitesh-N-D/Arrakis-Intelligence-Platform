import { env } from "../config/env.js";

export class StormEngine {
  evaluate({ totalMinutes, thresholdMinutes = env.stormThresholdMinutes }) {
    const ratio = totalMinutes / thresholdMinutes;
    return {
      stormModeActive: totalMinutes >= thresholdMinutes,
      escalationLevel: ratio >= 1.5 ? "critical" : ratio >= 1 ? "high" : ratio >= 0.7 ? "elevated" : "calm",
      totalMinutes,
      thresholdMinutes,
      pressureIndex: Math.min(Math.round(ratio * 100), 200)
    };
  }
}
