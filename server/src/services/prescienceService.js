import { DistractionLogRepository } from "../repositories/DistractionLogRepository.js";
import { FocusSessionRepository } from "../repositories/FocusSessionRepository.js";
import { OperativeStateService } from "./operativeStateService.js";
import { fillDailySeries } from "./dailySeries.js";

const focusSessionRepository = new FocusSessionRepository();
const distractionLogRepository = new DistractionLogRepository();
const operativeStateService = new OperativeStateService();

export class PrescienceService {
  async analyze(user) {
    const syncedUser = await operativeStateService.syncUserState(user);
    const [focusTrend, distractionTrend] = await Promise.all([
      focusSessionRepository.aggregateDaily(syncedUser.id, 7).then((rows) => fillDailySeries(rows, 7)),
      distractionLogRepository.aggregateDaily(syncedUser.id, 7).then((rows) => fillDailySeries(rows, 7))
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

    // Supportive, proportionate wording. These are workload-pattern estimates, never a diagnosis.
    const recommendations = [
      averageDistractionMinutes >= 120
        ? "Tracked distraction time has been high this week. If that wasn't planned downtime, try blocking one site during focus sessions only."
        : "Tracked distraction time is moderate. Your current Storm Zone setup seems to be working.",
      averageFocusMinutes < 75
        ? "Focus time has been light. One short session early in the day is a realistic place to start — no need to catch up all at once."
        : "Focus volume is healthy. If it feels sustainable, one longer uninterrupted session could deepen the work.",
      streak <= 1
        ? "Rhythm is just starting (or restarting). Any completed session today counts; rest days are normal."
        : "You've been showing up consistently. Keep the routine that's making that easy."
    ];

    return {
      burnoutRisk,
      riskBand,
      averages: {
        focusMinutes: Math.round(averageFocusMinutes),
        distractionMinutes: Math.round(averageDistractionMinutes),
        streak
      },
      recommendations,
      // Alias with clearer wording; `burnoutRisk` is kept for API compatibility.
      workloadStrain: burnoutRisk,
      basis: ["7-day average focus minutes", "7-day average tracked distraction minutes", "current streak"],
      disclaimer: "An estimate of workload pressure from your own focus and distraction records. It is not a medical or psychological assessment."
    };
  }
}
