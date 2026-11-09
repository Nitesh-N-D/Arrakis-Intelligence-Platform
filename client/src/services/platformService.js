import { http } from "./http";

/** Minutes east of UTC, matching the server's `tzOffset` query parameter. */
export const timezoneOffset = () => -new Date().getTimezoneOffset();

/** The user's local calendar day as YYYY-MM-DD. */
export const localDay = (date = new Date()) => {
  const shifted = new Date(date.getTime() + timezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 10);
};

export const platformService = {
  dashboard: () => http.get("/analytics/dashboard"),
  prescience: () => http.get("/prescience/analyze"),
  mentatAnalyze: (payload = {}) => http.post("/mentat/analyze", { ...payload, tzOffset: timezoneOffset() }),
  behavior: () => http.get("/analytics/behavior", { params: { tzOffset: timezoneOffset() } }),
  weeklyReview: () => http.get("/analytics/weekly-review", { params: { tzOffset: timezoneOffset() } }),
  missions: (day = localDay()) => http.get("/missions", { params: { day } }),
  createMission: (payload) => http.post("/missions", { day: localDay(), ...payload }),
  updateMission: (id, payload) => http.patch(`/missions/${id}`, payload),
  deleteMission: (id) => http.delete(`/missions/${id}`),
  carryForwardMissions: (missionIds) => http.post("/missions/carry-forward", { toDay: localDay(), missionIds }),
  goals: () => http.get("/goals"),
  createGoal: (payload) => http.post("/goals", payload),
  updateGoal: (id, payload) => http.patch(`/goals/${id}`, payload),
  toggleGoalMilestone: (goalId, milestoneId, done) => http.patch(`/goals/${goalId}/milestones/${milestoneId}`, { done }),
  deleteGoal: (id) => http.delete(`/goals/${id}`),
  extensionPolicy: () => http.get("/profile/extension-policy"),
  analyzeSkills: (payload) => http.post("/skills/analyze", payload),
  harvestSpice: (payload) => http.post("/spice/harvest", payload),
  startFocusSession: (payload) => http.post("/focus/sessions", payload),
  getActiveFocusSession: () => http.get("/focus/sessions/active"),
  pauseFocusSession: (id) => http.patch(`/focus/sessions/${id}/pause`),
  resumeFocusSession: (id) => http.patch(`/focus/sessions/${id}/resume`),
  resetFocusSession: (id) => http.delete(`/focus/sessions/${id}`),
  completeFocusSession: (id) => http.post(`/focus/sessions/${id}/complete`),
  logStorm: (payload) => http.post("/storm/log", payload),
  roadmap: () => http.get("/roadmap/current"),
  completeRoadmapPhase: (phaseId) => http.post(`/roadmap/phases/${phaseId}/complete`),
  updateRoadmapPhase: (phaseId, payload) => http.patch(`/roadmap/phases/${phaseId}`, payload),
  addRoadmapEvidence: (phaseId, payload) => http.post(`/roadmap/phases/${phaseId}/evidence`, payload),
  removeRoadmapEvidence: (phaseId, evidenceId) => http.delete(`/roadmap/phases/${phaseId}/evidence/${evidenceId}`),
  career: () => http.get("/career"),
  previewCareer: (career) => http.post("/career/preview", { career }),
  updateCareer: (career, confirmRoadmapChange = false) => http.put("/career", { career, confirmRoadmapChange }),
  leaderboardUsers: () => http.get("/leaderboard/users"),
  leaderboardTeams: () => http.get("/leaderboard/teams"),
  createTeam: (payload) => http.post("/team/create", payload),
  joinTeam: (payload) => http.post("/team/join", payload),
  profile: () => http.get("/profile"),
  updateProfile: (payload) => http.patch("/profile", payload),
  updateSettings: (payload) => http.patch("/profile/settings", payload),
  exportAccount: () => http.get("/profile/export"),
  deleteAccount: (payload) => http.delete("/profile/account", { data: payload })
};
