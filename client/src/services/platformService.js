import { http } from "./http";

export const platformService = {
  dashboard: () => http.get("/analytics/dashboard"),
  prescience: () => http.get("/prescience/analyze"),
  analyzeSkills: (payload) => http.post("/skills/analyze", payload),
  logStorm: (payload) => http.post("/storm/log", payload),
  harvestSpice: (payload) => http.post("/spice/harvest", payload)
};
