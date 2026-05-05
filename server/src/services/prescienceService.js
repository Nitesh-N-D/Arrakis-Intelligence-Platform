import { DistractionLogRepository } from "../repositories/DistractionLogRepository.js";
import { FocusSessionRepository } from "../repositories/FocusSessionRepository.js";

const focusSessionRepository = new FocusSessionRepository();
const distractionLogRepository = new DistractionLogRepository();

export class PrescienceService {
  async analyze(user) {
    const [focusTrend, distractionTrend] = await Promise.all([
      focusSessionRepository.aggregateDaily(user._id, 7),
      distractionLogRepository.aggregateDaily(user._id, 7)
    ]);

    const avgFocusMinutes =
      focusTrend.length > 0
        ? focusTrend.reduce((sum, item) => sum + item.totalMinutes, 0) / focusTrend.length
        : 0;
    const avgDistractionMinutes =
      distractionTrend.length > 0
        ? distractionTrend.reduce((sum, item) => sum + item.totalMinutes, 0) / distractionTrend.length
        : 0;

    const burnoutRisk = Math.min(
      100,
      Math.round(avgDistractionMinutes * 0.45 + Math.max(0, 300 - avgFocusMinutes) * 0.12)
    );

    return {
      burnoutRisk,
      averages: {
        focusMinutes: Math.round(avgFocusMinutes),
        distractionMinutes: Math.round(avgDistractionMinutes)
      },
      recommendations: [
        avgDistractionMinutes > 90
          ? "Reduce high-friction apps during your first two work hours to calm storm formation."
          : "Your distraction load is controlled. Protect your current ritual windows.",
        avgFocusMinutes < 120
          ? "Schedule at least two spice harvest sessions per day to rebuild sustained attention."
          : "Your focus volume is strong. Increase intensity through one 50-minute deep session.",
        burnoutRisk > 65
          ? "Burnout risk is elevated. Introduce one low-cognitive recovery block each afternoon."
          : "Burnout risk is manageable. Continue alternating deep focus and recovery cycles."
      ]
    };
  }
}
