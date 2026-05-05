import { http } from "./http";

export const authService = {
  register: (payload) => http.post("/auth/register", payload),
  login: (payload) => http.post("/auth/login", payload),
  me: () => http.get("/auth/me"),
  logout: (refreshToken) => http.post("/auth/logout", { refreshToken }),
  googleUrl: () => http.get("/auth/google/url")
};
