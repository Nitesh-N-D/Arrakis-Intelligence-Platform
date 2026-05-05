import { DistractionLogRepository } from "../repositories/DistractionLogRepository.js";
import { FocusSessionRepository } from "../repositories/FocusSessionRepository.js";
import { SkillAnalyzerService } from "./skillAnalyzerService.js";
import { StormEngine } from "./stormEngine.js";

const focusSessionRepository = new FocusSessionRepository();
const distractionLogRepository = new DistractionLogRepository();
const skillAnalyzerService = new SkillAnalyzerService();
const stormEngine = new StormEngine();

export class AnalyticsService {
  async getDashboard(user) {
    const [focusTrend, distractionTrend] = await Promise.all([
      focusSessionRepository.aggregateDaily(user._id, 7),
      distractionLogRepository.aggregateDaily(user._id, 7)
    ]);

    const skillAnalysis = skillAnalyzerService.analyze({
      userSkills: user.skills,
      targetRole: user.targetRole
    });

    const currentDistractionTotal = distractionTrend.at(-1)?.totalMinutes || 0;
    const stormState = stormEngine.evaluate({
      totalMinutes: currentDistractionTotal,
      thresholdMinutes: user.preferences?.distractionThresholdMinutes
    });

    const weeklyProductivityScore =
      focusTrend.length > 0
        ? Math.round(focusTrend.reduce((sum, day) => sum + day.averageProductivity, 0) / focusTrend.length)
        : 0;

    return {
      operative: {
        name: user.name,
        email: user.email,
        rank: user.currentRank,
        totalSpice: user.totalSpice,
        focusStreak: user.focusStreak,
        stormModeActive: user.stormModeActive
      },
      analytics: {
        focusTrend,
        distractionTrend,
        skillAnalysis,
        stormState,
        weeklyProductivityScore
      }
    };
  }
}
