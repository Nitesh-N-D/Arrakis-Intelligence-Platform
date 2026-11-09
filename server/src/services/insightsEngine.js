// Pure, explainable behavioural analytics. Every number here is derived from records the user
// generated (focus sessions, hostname + duration distraction events, missions). Nothing is a
// medical or psychological assessment, and every insight lists the evidence it was built from.

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
export const ANALYSIS_WINDOW_DAYS = 28;
export const CONSISTENCY_WINDOW_DAYS = 14;

/** Client sends `-new Date().getTimezoneOffset()` (minutes east of UTC). Out-of-range values fall back to UTC. */
export function parseTimezoneOffset(value) {
  const offset = Number(value);
  return Number.isInteger(offset) && offset >= -840 && offset <= 840 ? offset : 0;
}

const shift = (date, tz) => new Date(new Date(date).getTime() + tz * MINUTE_MS);
export const localDayKey = (date, tz = 0) => shift(date, tz).toISOString().slice(0, 10);
export const localHour = (date, tz = 0) => shift(date, tz).getUTCHours();

const dayKeysEndingAt = (now, tz, count) => {
  const keys = [];
  const today = Date.parse(`${localDayKey(now, tz)}T00:00:00Z`);
  for (let offset = count - 1; offset >= 0; offset -= 1) keys.push(new Date(today - offset * DAY_MS).toISOString().slice(0, 10));
  return keys;
};

const percentChange = (current, previous) => {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const formatHour = (hour) => `${String(hour).padStart(2, "0")}:00`;
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function computeBehavior({ sessions = [], distractions = [], now = new Date(), tzOffsetMinutes = 0 } = {}) {
  const tz = parseTimezoneOffset(tzOffsetMinutes);
  const windowStart = new Date(now.getTime() - ANALYSIS_WINDOW_DAYS * DAY_MS);
  const recent = sessions.filter((session) => new Date(session.startedAt) >= windowStart);
  const completed = recent.filter((session) => session.status === "completed" && session.completedAt);
  const abandoned = recent.filter((session) => session.status === "abandoned");

  // Productive hours: minutes of completed focus by the local hour the session started.
  const productiveHours = Array.from({ length: 24 }, (_, hour) => ({ hour, minutes: 0, sessions: 0 }));
  for (const session of completed) {
    const bucket = productiveHours[localHour(session.startedAt, tz)];
    bucket.minutes += session.duration || 0;
    bucket.sessions += 1;
  }
  const totalCompletedMinutes = completed.reduce((sum, session) => sum + (session.duration || 0), 0);
  const bestHours = [...productiveHours]
    .filter((bucket) => bucket.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes || a.hour - b.hour)
    .slice(0, 3)
    .map((bucket) => ({ ...bucket, label: formatHour(bucket.hour), share: totalCompletedMinutes ? Math.round((bucket.minutes / totalCompletedMinutes) * 100) : 0 }));

  const attempts = completed.length + abandoned.length;
  const sessionSuccess = {
    completed: completed.length,
    abandoned: abandoned.length,
    rate: attempts ? Math.round((completed.length / attempts) * 100) : null
  };

  const pauses = recent.map((session) => session.pauseCount || 0);
  const interruptions = {
    averagePauses: recent.length ? Number((pauses.reduce((sum, value) => sum + value, 0) / recent.length).toFixed(1)) : null,
    sessionsWithPauses: pauses.filter((value) => value > 0).length,
    // Recovery: sessions that were paused at least once and still completed.
    recovered: recent.filter((session) => (session.pauseCount || 0) > 0 && session.status === "completed").length
  };

  const consistencyKeys = dayKeysEndingAt(now, tz, CONSISTENCY_WINDOW_DAYS);
  const activeDaySet = new Set(completed.map((session) => localDayKey(session.completedAt, tz)));
  const activeDays = consistencyKeys.filter((key) => activeDaySet.has(key)).length;
  const consistency = { activeDays, windowDays: CONSISTENCY_WINDOW_DAYS, rate: Math.round((activeDays / CONSISTENCY_WINDOW_DAYS) * 100) };

  const fourteen = dayKeysEndingAt(now, tz, 14);
  const thisWeekKeys = new Set(fourteen.slice(7));
  const lastWeekKeys = new Set(fourteen.slice(0, 7));
  const weekTotals = (keys) => ({
    focusMinutes: completed.filter((session) => keys.has(localDayKey(session.completedAt, tz))).reduce((sum, session) => sum + (session.duration || 0), 0),
    sessions: completed.filter((session) => keys.has(localDayKey(session.completedAt, tz))).length,
    abandoned: abandoned.filter((session) => keys.has(localDayKey(session.startedAt, tz))).length,
    distractionMinutes: distractions.filter((event) => keys.has(localDayKey(event.loggedAt, tz))).reduce((sum, event) => sum + (event.duration || 0), 0)
  });
  const thisWeek = weekTotals(thisWeekKeys);
  const lastWeek = weekTotals(lastWeekKeys);
  const weekly = {
    thisWeek,
    lastWeek,
    change: {
      focusMinutes: percentChange(thisWeek.focusMinutes, lastWeek.focusMinutes),
      sessions: percentChange(thisWeek.sessions, lastWeek.sessions),
      distractionMinutes: percentChange(thisWeek.distractionMinutes, lastWeek.distractionMinutes)
    }
  };

  const byName = new Map();
  for (const event of distractions.filter((entry) => thisWeekKeys.has(localDayKey(entry.loggedAt, tz)))) {
    const name = String(event.metadata?.site || event.appName || "unknown").toLowerCase();
    const row = byName.get(name) || { name, minutes: 0, events: 0, category: event.metadata?.category || "general" };
    row.minutes += event.duration || 0;
    row.events += 1;
    byName.set(name, row);
  }
  const topDistractions = [...byName.values()].sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name)).slice(0, 5);

  const distractionTrend = fourteen.map((key) => ({
    day: key,
    minutes: distractions.filter((event) => localDayKey(event.loggedAt, tz) === key).reduce((sum, event) => sum + (event.duration || 0), 0)
  }));
  const focusTrend = fourteen.map((key) => ({
    day: key,
    minutes: completed.filter((session) => localDayKey(session.completedAt, tz) === key).reduce((sum, session) => sum + (session.duration || 0), 0)
  }));

  const dataSufficiency = completed.length === 0 && distractions.length === 0 ? "none" : completed.length < 5 ? "limited" : "enough";

  return {
    windowDays: ANALYSIS_WINDOW_DAYS,
    timezoneOffsetMinutes: tz,
    productiveHours,
    bestHours,
    sessionSuccess,
    interruptions,
    consistency,
    weekly,
    topDistractions,
    focusTrend,
    distractionTrend,
    dataSufficiency
  };
}

/**
 * Turns behaviour metrics into a short list of explainable observations and optional suggestions.
 * Language is descriptive, never shaming, and correlations are never presented as causes.
 */
export function explainInsights(behavior, { blockedSites = [], preferences = {}, missionSummary = null } = {}) {
  const insights = [];
  const confidence = behavior.dataSufficiency === "enough" ? "medium" : "low";

  if (behavior.dataSufficiency === "none") {
    insights.push({
      id: "no-data",
      kind: "observation",
      title: "Not enough history yet",
      detail: "Complete a few focus sessions and Arrakis will start describing your patterns. Nothing here is a judgement.",
      evidence: ["0 completed focus sessions and 0 distraction events in the last 28 days"],
      confidence: "low"
    });
    return insights;
  }

  const [best] = behavior.bestHours;
  if (best && behavior.sessionSuccess.completed >= 3) {
    insights.push({
      id: "best-hour",
      kind: "observation",
      title: `Your most productive hour is around ${best.label}`,
      detail: `Sessions that start near ${best.label} account for ${best.share}% of your completed focus time. Protecting this hour for important work is one option.`,
      evidence: [`${best.minutes} of ${behavior.productiveHours.reduce((sum, bucket) => sum + bucket.minutes, 0)} completed focus minutes started in this hour (last 28 days)`],
      confidence
    });
  }

  const { thisWeek, lastWeek, change } = behavior.weekly;
  if (lastWeek.focusMinutes > 0 && change.focusMinutes !== null && change.focusMinutes <= -20) {
    const alongside = [];
    if (thisWeek.distractionMinutes > lastWeek.distractionMinutes) alongside.push(`tracked distraction time rose from ${lastWeek.distractionMinutes} to ${thisWeek.distractionMinutes} minutes`);
    if (thisWeek.abandoned > lastWeek.abandoned) alongside.push(`${plural(thisWeek.abandoned, "session")} were reset before finishing (last week: ${lastWeek.abandoned})`);
    insights.push({
      id: "focus-down",
      kind: "observation",
      title: `Focus time is ${Math.abs(change.focusMinutes)}% lower than last week`,
      detail: alongside.length
        ? `At the same time, ${alongside.join(" and ")}. These happened together; Arrakis cannot tell which caused which.`
        : "No other tracked signal changed much, so the reason is probably outside what Arrakis can see (workload, schedule, rest).",
      evidence: [`This week: ${thisWeek.focusMinutes} focus minutes`, `Last week: ${lastWeek.focusMinutes} focus minutes`],
      confidence
    });
  } else if (lastWeek.focusMinutes > 0 && change.focusMinutes !== null && change.focusMinutes >= 20) {
    insights.push({
      id: "focus-up",
      kind: "observation",
      title: `Focus time is ${change.focusMinutes}% higher than last week`,
      detail: "Whatever changed in your routine seems to be working for you.",
      evidence: [`This week: ${thisWeek.focusMinutes} focus minutes`, `Last week: ${lastWeek.focusMinutes} focus minutes`],
      confidence
    });
  }

  const [topDistraction] = behavior.topDistractions;
  if (topDistraction && topDistraction.minutes >= 15) {
    const blocked = blockedSites.some((site) => topDistraction.name === site || topDistraction.name.endsWith(`.${site}`));
    insights.push({
      id: "top-distraction",
      kind: blocked ? "observation" : "suggestion",
      title: `${topDistraction.name} took the most tracked time this week`,
      detail: blocked
        ? "It is already on your Storm Zone list; the time was logged while blocking was off, overridden or outside focus-only hours."
        : "If this time was unplanned, you could add it to your Storm Zone list, or set blocking to focus-only so it stays available outside sessions.",
      evidence: [`${topDistraction.minutes} minutes across ${plural(topDistraction.events, "tracked interval")} in the last 7 days`],
      confidence,
      action: blocked ? null : { type: "block-site", site: topDistraction.name }
    });
  }

  const { rate, completed, abandoned } = behavior.sessionSuccess;
  if (rate !== null && completed + abandoned >= 5 && rate < 60) {
    const current = preferences.focusDurationPreference || 50;
    insights.push({
      id: "session-length",
      kind: "suggestion",
      title: `${rate}% of recent sessions were completed`,
      detail: current > 25
        ? `A shorter session length (for example 25 minutes instead of ${current}) often makes sessions easier to finish. You can change presets in Settings.`
        : "Sessions are already short. Starting with a clear single task may help more than a shorter timer.",
      evidence: [`${completed} completed and ${abandoned} reset sessions in the last 28 days`],
      confidence
    });
  }

  if (behavior.interruptions.averagePauses !== null && behavior.interruptions.averagePauses >= 1.5) {
    insights.push({
      id: "interruptions",
      kind: "suggestion",
      title: "Sessions are paused often",
      detail: `On average sessions are paused ${behavior.interruptions.averagePauses} times, and ${behavior.interruptions.recovered} paused sessions were still completed — pausing is fine. Silencing notifications before you start may reduce interruptions.`,
      evidence: [`${behavior.interruptions.sessionsWithPauses} sessions had at least one pause`],
      confidence
    });
  }

  const { activeDays, windowDays } = behavior.consistency;
  if (behavior.sessionSuccess.completed > 0) {
    insights.push({
      id: "consistency",
      kind: "observation",
      title: `You focused on ${activeDays} of the last ${windowDays} days`,
      detail: activeDays >= 10
        ? "That is a steady rhythm. Rest days are part of a sustainable routine, not a failure."
        : "Consistency tends to come from small, repeatable starts. A short session at a fixed time is enough to count.",
      evidence: [`${activeDays} days with at least one completed session`],
      confidence
    });
  }

  if (missionSummary && missionSummary.plannedMinutes > 360) {
    insights.push({
      id: "workload",
      kind: "suggestion",
      title: "Today's plan is heavy",
      detail: `You've planned ${Math.round(missionSummary.plannedMinutes / 60)} hours of focused work. Choosing what can move to tomorrow keeps the plan realistic.`,
      evidence: [`${missionSummary.plannedMinutes} planned focus minutes across ${plural(missionSummary.total, "mission")}`],
      confidence: "medium"
    });
  }

  return insights;
}
