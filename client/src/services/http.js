import axios from "axios";

let accessToken = null;
let refreshInFlight = null;
const accessTokenSubscribers = new Set();

const fallbackApiBase = import.meta.env.PROD
  ? `${window.location.origin}/api/v1`
  : "http://localhost:5000/api/v1";

const shouldSkipAuthRefresh = (request = {}) => {
  const url = String(request.url || "");
  return (
    request.__isRetryRequest ||
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/google")
  );
};

const notifyAccessTokenSubscribers = (token) => {
  accessTokenSubscribers.forEach((listener) => {
    try {
      listener(token);
    } catch (_error) {
      // Listener failures should not break the auth transport layer.
    }
  });
};

const isAuthFailure = (error) => {
  const statusCode = error?.statusCode || error?.response?.status;
  return statusCode === 401 || statusCode === 403;
};

export const setAccessToken = (token) => {
  accessToken = token || null;
  notifyAccessTokenSubscribers(accessToken);
};

export const subscribeToAccessToken = (listener) => {
  accessTokenSubscribers.add(listener);
  return () => {
    accessTokenSubscribers.delete(listener);
  };
};

const normalizeClientError = (error) => {
  if (error?.response?.data) {
    return {
      statusCode: error.response.status,
      ...error.response.data,
      message: error.response.data.message || "Request failed"
    };
  }

  return {
    success: false,
    message:
      error?.message ||
      "The request could not be completed. Please check your connection and try again.",
    details: null
  };
};

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackApiBase,
  withCredentials: true
});

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !shouldSkipAuthRefresh(originalRequest)) {
      if (!refreshInFlight) {
        refreshInFlight = axios
          .post(`${http.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true })
          .then((response) => {
            const nextToken = response.data?.data?.accessToken || null;
            setAccessToken(nextToken);
            return nextToken;
          })
          .finally(() => {
            refreshInFlight = null;
          });
      }

      try {
        const nextToken = await refreshInFlight;
        if (nextToken) {
          originalRequest.__isRetryRequest = true;
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${nextToken}`
          };
          return http(originalRequest);
        }
      } catch (refreshError) {
        const normalizedRefreshError = normalizeClientError(refreshError);
        if (isAuthFailure(normalizedRefreshError)) {
          setAccessToken(null);
        }
        return Promise.reject(normalizedRefreshError);
      }
    }

    return Promise.reject(normalizeClientError(error));
  }
);
