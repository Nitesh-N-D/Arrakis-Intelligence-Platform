export const EVIDENCE_MIN = 40;
export const EVIDENCE_MAX = 1000;
export const NOTES_MAX = 4000;
export const EVIDENCE_PER_PHASE = 10;

/** What still blocks "mastered" for a phase. Mirrors the server rules; the server enforces them. */
export function masteryChecklist(phase) {
  const tasks = phase.tasks?.length || 0;
  const tasksDone = new Set((phase.completedTasks || []).filter((index) => index < tasks)).size;
  const criteria = phase.assessmentCriteria?.length || 0;
  const confirmed = new Set((phase.assessmentConfirmed || []).filter((index) => index < criteria)).size;
  const evidence = phase.evidence?.length || 0;
  return {
    tasks: { done: tasksDone, total: tasks, met: tasksDone >= tasks },
    evidence: { done: evidence, met: evidence > 0 },
    assessment: { done: confirmed, total: criteria, met: confirmed >= criteria },
    ready: tasksDone >= tasks && evidence > 0 && confirmed >= criteria
  };
}
