import { createContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { setAccessToken, subscribeToAccessToken } from "../services/http";

export const AuthContext = createContext(null);

const isAuthFailure = (error) => {
  const statusCode = error?.statusCode;
  return statusCode === 401 || statusCode === 403;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setToken] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sessionState, setSessionState] = useState("bootstrapping");

  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    const trustedOrigins = ["https://arrakis-intelligence-platform.vercel.app", "http://localhost:5173"];
    if (!trustedOrigins.includes(window.location.origin)) return undefined;
    const sendToken = () => {
      if (sessionState === "authenticated" && accessToken) {
        window.postMessage({ source: "arrakis-platform", type: "ACCESS_TOKEN_UPDATE", accessToken }, window.location.origin);
      } else if (sessionState === "anonymous" || sessionState === "expired") {
        window.postMessage({ source: "arrakis-platform", type: "ACCESS_TOKEN_UPDATE", accessToken: "" }, window.location.origin);
      }
    };
    const onExtensionRequest = (event) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (event.data?.source === "arrakis-extension" && event.data?.type === "ACCESS_TOKEN_REQUEST") sendToken();
    };
    window.addEventListener("message", onExtensionRequest);
    sendToken();
    return () => window.removeEventListener("message", onExtensionRequest);
  }, [accessToken, sessionState]);

  useEffect(() => {
    const unsubscribe = subscribeToAccessToken((token) => {
      setToken((current) => (current === token ? current : token));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        let nextAccessToken = accessToken;

        if (!nextAccessToken) {
          const refreshResponse = await authService.refresh();
          nextAccessToken = refreshResponse.data?.accessToken || null;

          if (cancelled) {
            return;
          }

          if (nextAccessToken) {
            setToken(nextAccessToken);
          }
        }

        if (!nextAccessToken) {
          if (!cancelled) {
            setUser(null);
            setSessionState("anonymous");
          }
          return;
        }

        const response = await authService.me();
        if (!cancelled) {
          setUser(response.data);
          setSessionState("authenticated");
        }
      } catch (error) {
        if (!cancelled) {
          if (isAuthFailure(error)) {
            setUser(null);
            setToken(null);
            setSessionState("expired");
          } else {
            setSessionState("offline");
          }
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    };

    bootstrap().catch(() => {
      if (!cancelled) {
        setBootstrapping(false);
        setSessionState("offline");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      bootstrapping,
      sessionState,
      setUser,
      setAccessToken: setToken,
      logout: async () => {
        await authService.logout().catch(() => {});
        setUser(null);
        setToken(null);
        setSessionState("anonymous");
      }
    }),
    [user, accessToken, bootstrapping, sessionState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
