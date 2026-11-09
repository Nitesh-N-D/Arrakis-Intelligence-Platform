// Users choose their own focus lengths and presets. The server keeps only a wide safety range
// so a session can't be created for 0 minutes or for days (which would break timers and the leaderboard).
export const FOCUS_LIMITS = Object.freeze({ minMinutes: 1, maxMinutes: 240, maxPresets: 6 });
export const DEFAULT_FOCUS_PRESETS = Object.freeze([25, 50]);

export const isValidFocusDuration = (value) =>
  Number.isInteger(value) && value >= FOCUS_LIMITS.minMinutes && value <= FOCUS_LIMITS.maxMinutes;

/** Sorted, de-duplicated, bounded list of the user's preset lengths; invalid entries are dropped. */
export function normalizeFocusPresets(value, fallback = DEFAULT_FOCUS_PRESETS) {
  if (!Array.isArray(value)) return [...fallback];
  const presets = [...new Set(value.map(Number).filter(isValidFocusDuration))].sort((a, b) => a - b);
  return presets.length ? presets.slice(0, FOCUS_LIMITS.maxPresets) : [...fallback];
}
