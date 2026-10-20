import { http } from "./http";

export const platformService = {
  dashboard: () => http.get("/analytics/dashboard"),
  prescience: () => http.get("/prescience/analyze"),
  mentatAnalyze: (payload) => http.post("/mentat/analyze", payload),
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
