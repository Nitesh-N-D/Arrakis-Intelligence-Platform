import { DistractionLogRepository } from "../repositories/DistractionLogRepository.js";
import { FocusSessionRepository } from "../repositories/FocusSessionRepository.js";
import { GoalRepository } from "../repositories/GoalRepository.js";
import { MissionRepository } from "../repositories/MissionRepository.js";
import { RoadmapRepository } from "../repositories/RoadmapRepository.js";
import { ANALYSIS_WINDOW_DAYS, computeBehavior, explainInsights, localDayKey, parseTimezoneOffset } from "./insightsEngine.js";
import { summarizeMissions } from "./missionService.js";

const DAY_MS = 86_400_000;

export class BehaviorService {
  constructor({
    focusSessionRepository = new FocusSessionRepository(),
    distractionLogRepository = new DistractionLogRepository(),
    missionRepository = new MissionRepository(),
    goalRepository = new GoalRepository(),
    roadmapRepository = new RoadmapRepository(),
    clock = () => new Date()
  } = {}) {
    Object.assign(this, { focusSessionRepository, distractionLogRepository, missionRepository, goalRepository, roadmapRepository, clock });
  }

  /** Applies the user's chosen retention period. A value of 0 keeps records until the user deletes them. */
  async applyRetention(user) {
    const days = Number(user.preferences?.dataRetentionDays) || 0;
    if (!days) return { applied: false };
    const cutoff = new Date(this.clock().getTime() - days * DAY_MS);
    const [focus, distractions] = await Promise.all([
      this.focusSessionRepository.deleteOlderThan(user.id, cutoff),
      this.distractionLogRepository.deleteOlderThan(user.id, cutoff)
    ]);
    return { applied: true, cutoff, removed: (focus?.deletedCount || 0) + (distractions?.deletedCount || 0) };
  }

  async loadHistory(user) {
    const since = new Date(this.clock().getTime() - ANALYSIS_WINDOW_DAYS * DAY_MS);
    const [sessions, distractions] = await Promise.all([
      this.focusSessionRepository.listSince(user.id, since),
      this.distractionLogRepository.listSince(user.id, since)
    ]);
    return { sessions, distractions };
  }

  async behavior(user, query = {}) {
    await this.applyRetention(user);
    const tzOffsetMinutes = parseTimezoneOffset(query.tzOffset);
    const now = this.clock();
    const { sessions, distractions } = await this.loadHistory(user);
    const behavior = computeBehavior({ sessions, distractions, now, tzOffsetMinutes });
    const today = localDayKey(now, tzOffsetMinutes);
    const missions = await this.missionRepository.listByDay(user.id, today);
    const missionSummary = summarizeMissions(missions);
    const insights = explainInsights(behavior, {
      blockedSites: user.preferences?.blockedSites || [],
      preferences: user.preferences || {},
      missionSummary
    });
    return {
      ...behavior,
      missionSummary,
      insights,
      disclaimer: "These are descriptive patterns from your own focus and hostname-duration records. They are estimates, not medical or psychological assessments."
    };
  }

  /** Data-backed review of the last seven local days. */
  async weeklyReview(user, query = {}) {
    const tz = parseTimezoneOffset(query.tzOffset);
    const now = this.clock();
    const behavior = await this.behavior(user, { tzOffset: tz });
    const toDay = localDayKey(now, tz);
    const fromDay = localDayKey(new Date(now.getTime() - 6 * DAY_MS), tz);
    const weekStart = new Date(Date.parse(`${fromDay}T00:00:00Z`) - tz * 60_000);

    const [missions, goals, roadmap] = await Promise.all([
      this.missionRepository.listRange(user.id, fromDay, toDay),
      this.goalRepository.listByUser(user.id),
      this.roadmapRepository.findByUser(user.id)
    ]);
    const missionSummary = summarizeMissions(missions);
    const milestonesCompleted = goals.flatMap((goal) => goal.milestones || []).filter((milestone) => milestone.doneAt && new Date(milestone.doneAt) >= weekStart).length;
    const goalsCompleted = goals.filter((goal) => goal.completedAt && new Date(goal.completedAt) >= weekStart).length;
    const phases = roadmap?.phases || [];
    const phasesCompleted = phases.filter((phase) => phase.completedAt && new Date(phase.completedAt) >= weekStart).map((phase) => phase.skill);
    const evidenceSubmitted = phases.flatMap((phase) => phase.evidence || []).filter((entry) => entry.submittedAt && new Date(entry.submittedAt) >= weekStart).length;
    const activePhase = phases.find((phase) => phase.status === "active");

    const { thisWeek, lastWeek, change } = behavior.weekly;
    const highlights = [];
    if (thisWeek.sessions) highlights.push(`Completed ${thisWeek.sessions} focus session${thisWeek.sessions === 1 ? "" : "s"} (${thisWeek.focusMinutes} minutes).`);
    if (missionSummary.done) highlights.push(`Finished ${missionSummary.done} of ${missionSummary.total} planned missions, including ${missionSummary.prioritiesDone} priorit${missionSummary.prioritiesDone === 1 ? "y" : "ies"}.`);
    if (milestonesCompleted) highlights.push(`Reached ${milestonesCompleted} goal milestone${milestonesCompleted === 1 ? "" : "s"}.`);
    if (phasesCompleted.length) highlights.push(`Mastered roadmap phase${phasesCompleted.length === 1 ? "" : "s"}: ${phasesCompleted.join(", ")}.`);
    if (evidenceSubmitted) highlights.push(`Submitted ${evidenceSubmitted} piece${evidenceSubmitted === 1 ? "" : "s"} of learning evidence.`);
    if (!highlights.length) highlights.push("A quiet week in the records. That's allowed — pick one small thing for next week.");

    const nextWeek = [];
    const [best] = behavior.bestHours;
    if (best) nextWeek.push(`Schedule your most important task near ${best.label}, your strongest focus hour.`);
    if (activePhase) nextWeek.push(`Continue the ${activePhase.skill} roadmap phase and add one piece of evidence when you finish a task.`);
    const carry = missions.filter((mission) => mission.status === "todo").length;
    if (carry) nextWeek.push(`Decide what to do with ${carry} unfinished mission${carry === 1 ? "" : "s"}: carry forward, reschedule, or drop.`);
    const [topDistraction] = behavior.topDistractions;
    if (topDistraction && topDistraction.minutes >= 30) nextWeek.push(`Consider a focus-only block for ${topDistraction.name} (${topDistraction.minutes} min this week).`);

    return {
      period: { from: fromDay, to: toDay },
      focus: { minutes: thisWeek.focusMinutes, sessions: thisWeek.sessions, previousMinutes: lastWeek.focusMinutes, changePercent: change.focusMinutes },
      distractions: { minutes: thisWeek.distractionMinutes, previousMinutes: lastWeek.distractionMinutes, changePercent: change.distractionMinutes, top: behavior.topDistractions },
      sessionSuccess: behavior.sessionSuccess,
      consistency: behavior.consistency,
      missions: missionSummary,
      goals: { milestonesCompleted, goalsCompleted, active: goals.filter((goal) => goal.status === "active").length },
      learning: { phasesCompleted, evidenceSubmitted, activePhase: activePhase?.skill || null },
      highlights,
      nextWeek: nextWeek.slice(0, 4),
      insights: behavior.insights,
      dataSufficiency: behavior.dataSufficiency,
      disclaimer: behavior.disclaimer
    };
  }
}
