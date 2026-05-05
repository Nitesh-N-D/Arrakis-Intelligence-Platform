import { DistractionLogRepository } from "../repositories/DistractionLogRepository.js";
import { FocusSessionRepository } from "../repositories/FocusSessionRepository.js";
import { OperativeStateService } from "./operativeStateService.js";

const focusSessionRepository = new FocusSessionRepository();
const distractionLogRepository = new DistractionLogRepository();
const operativeStateService = new OperativeStateService();

export class PrescienceService {
  async analyze(user) {
    const syncedUser = await operativeStateService.syncUserState(user);
    const [focusTrend, distractionTrend] = await Promise.all([
      focusSessionRepository.aggregateDaily(syncedUser.id, 7),
      distractionLogRepository.aggregateDaily(syncedUser.id, 7)
    ]);

    const averageFocusMinutes =
      focusTrend.length > 0
        ? focusTrend.reduce((sum, item) => sum + item.totalMinutes, 0) / focusTrend.length
        : 0;
    const averageDistractionMinutes =
      distractionTrend.length > 0
        ? distractionTrend.reduce((sum, item) => sum + item.totalMinutes, 0) / distractionTrend.length
        : 0;

    const streak = syncedUser.focusStreak || 0;
    const burnoutRisk = Math.min(
      100,
      Math.round(
        averageDistractionMinutes * 0.35 +
          Math.max(0, 140 - averageFocusMinutes) * 0.3 +
          Math.max(0, 3 - streak) * 12
      )
    );

    const riskBand = burnoutRisk >= 70 ? "HIGH RISK" : burnoutRisk >= 40 ? "ELEVATED" : "STABLE";

    const recommendations = [
      averageDistractionMinutes >= 120
        ? "Storm pressure is overwhelming your operating rhythm. Cut one high-friction app block tomorrow morning."
        : "Distraction pressure is within control. Keep your current protected work blocks intact.",
      averageFocusMinutes < 75
        ? "Your spice harvest is thin. Commit to two completed sessions before midday."
        : "Focus volume is holding. Increase quality with one uninterrupted deep-50 session.",
      streak <= 1
        ? "Your streak is fragile. Secure a small win early tomorrow to re-establish behavioral momentum."
        : "Your streak is compounding well. Preserve it with consistent session starts."
    ];

    return {
      burnoutRisk,
      riskBand,
      averages: {
        focusMinutes: Math.round(averageFocusMinutes),
        distractionMinutes: Math.round(averageDistractionMinutes),
        streak
      },
      recommendations
    };
  }
}
