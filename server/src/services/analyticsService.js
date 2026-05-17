import { DistractionLogRepository } from "../repositories/DistractionLogRepository.js";
import { FocusSessionRepository } from "../repositories/FocusSessionRepository.js";
import { LeaderboardService } from "./leaderboardService.js";
import { OperativeStateService } from "./operativeStateService.js";
import { RoadmapService } from "./roadmapService.js";
import { SkillAnalyzerService } from "./skillAnalyzerService.js";
import { StormEngine } from "./stormEngine.js";

const focusSessionRepository = new FocusSessionRepository();
const distractionLogRepository = new DistractionLogRepository();
const leaderboardService = new LeaderboardService();
const operativeStateService = new OperativeStateService();
const roadmapService = new RoadmapService();
const skillAnalyzerService = new SkillAnalyzerService();
const stormEngine = new StormEngine();

export class AnalyticsService {
  async getDashboard(user) {
    const syncedUser = await operativeStateService.syncUserState(user);
    const [
      focusTrend,
      distractionTrend,
      roadmap,
      focusSessionsCount,
      distractionEventsCount,
      leaderboard
    ] = await Promise.all([
      focusSessionRepository.aggregateDaily(syncedUser.id, 7),
      distractionLogRepository.aggregateDaily(syncedUser.id, 7),
      roadmapService.ensureRoadmap(syncedUser),
      focusSessionRepository.countByUser(syncedUser.id),
      distractionLogRepository.countByUser(syncedUser.id),
      leaderboardService.getSummary()
    ]);

    const skillAnalysis = skillAnalyzerService.analyze({
      userSkills: syncedUser.skills,
      targetRole: syncedUser.targetRole
    });

    const todayDistractionMinutes = distractionTrend.at(-1)?.totalMinutes || 0;
    const stormState = stormEngine.evaluate(todayDistractionMinutes);

    const weeklyProductivityScore =
      focusTrend.length > 0
        ? Math.round(
            focusTrend.reduce((sum, day) => sum + day.averageProductivity, 0) / focusTrend.length
          )
        : 0;
    const totalFocusMinutes = focusTrend.reduce((sum, day) => sum + day.totalMinutes, 0);
    const totalDistractionMinutes = distractionTrend.reduce((sum, day) => sum + day.totalMinutes, 0);
    const focusEfficiency =
      totalFocusMinutes > 0
        ? Math.round(
            (totalFocusMinutes / Math.max(totalFocusMinutes + totalDistractionMinutes, 1)) * 100
          )
        : 0;
    const distractionRatio =
      totalFocusMinutes + totalDistractionMinutes > 0
        ? Number(
            (
              totalDistractionMinutes /
              Math.max(totalFocusMinutes + totalDistractionMinutes, 1)
            ).toFixed(2)
          )
        : 0;
    const productivityScore = Math.max(
      0,
      Math.min(100, Math.round(weeklyProductivityScore * 0.7 + focusEfficiency * 0.3))
    );

    return {
      operative: {
        id: syncedUser.id,
        name: syncedUser.name,
        email: syncedUser.email,
        avatarUrl: syncedUser.avatarUrl || "",
        bio: syncedUser.bio || "",
        rank: syncedUser.currentRank,
        totalSpice: syncedUser.totalSpice,
        focusStreak: syncedUser.focusStreak,
        stormModeActive: syncedUser.stormModeActive,
        targetRole: syncedUser.targetRole,
        preferences: syncedUser.preferences,
        billing: syncedUser.billing,
        onboarding: syncedUser.onboarding,
        team: syncedUser.team
          ? {
              id: syncedUser.team.id,
              name: syncedUser.team.name,
              totalSpice: syncedUser.team.totalSpice,
              totalStreak: syncedUser.team.totalStreak
            }
          : null
      },
      analytics: {
        summary: {
          focusSessionsCount,
          distractionEventsCount
        },
        focusTrend,
        distractionTrend,
        skillAnalysis,
        stormState,
        weeklyProductivityScore,
        performanceSignals: {
          productivityScore,
          focusEfficiency,
          distractionRatio,
          totalFocusMinutes,
          totalDistractionMinutes
        },
        roadmap,
        leaderboard
      }
    };
  }
}
