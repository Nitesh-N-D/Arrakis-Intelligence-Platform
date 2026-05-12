import { http } from "./http";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const authService = {
  register: (payload) => http.post("/auth/register", payload),
  login: (payload) => http.post("/auth/login", payload),
  refresh: () => http.post("/auth/refresh", {}),
  me: () => http.get("/auth/me"),
  logout: (refreshToken) => http.post("/auth/logout", { refreshToken }),
  googleUrl: () => http.get("/auth/google/url"),
  googleStartUrl: () => `${apiBase}/auth/google`
};
