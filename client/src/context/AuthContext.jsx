import { createContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { setAccessToken } from "../services/http";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setToken] = useState(localStorage.getItem("arrakis_access_token"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("arrakis_refresh_token"));

  useEffect(() => {
    setAccessToken(accessToken);
    if (accessToken) {
      localStorage.setItem("arrakis_access_token", accessToken);
    } else {
      localStorage.removeItem("arrakis_access_token");
    }
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem("arrakis_refresh_token", refreshToken);
    } else {
      localStorage.removeItem("arrakis_refresh_token");
    }
  }, [refreshToken]);

  useEffect(() => {
    if (!accessToken) return;
    authService
      .me()
      .then((response) => setUser(response.data))
      .catch(() => {
        setUser(null);
        setToken(null);
        setRefreshToken(null);
      });
  }, [accessToken]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      setUser,
      setAccessToken: setToken,
      setRefreshToken,
      logout: async () => {
        if (refreshToken) {
          await authService.logout(refreshToken).catch(() => {});
        }
        setUser(null);
        setToken(null);
        setRefreshToken(null);
      }
    }),
    [user, accessToken, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
