import { http } from "./http";

const fallbackApiBase = import.meta.env.PROD
  ? `${window.location.origin}/api/v1`
  : "http://localhost:5000/api/v1";
const apiBase = import.meta.env.VITE_API_URL || fallbackApiBase;

export const authService = {
  register: (payload) => http.post("/auth/register", payload),
  login: (payload) => http.post("/auth/login", payload),
  refresh: () => http.post("/auth/refresh", {}),
  me: () => http.get("/auth/me"),
  logout: () => http.post("/auth/logout", {}),
  googleUrl: () => http.get("/auth/google/url"),
  googleStartUrl: () => `${apiBase}/auth/google`
};
