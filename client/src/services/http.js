import axios from "axios";

let accessToken = localStorage.getItem("arrakis_access_token");
let refreshInFlight = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
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

    if (status === 401 && originalRequest && !originalRequest.__isRetryRequest) {
      if (!refreshInFlight) {
        refreshInFlight = axios
          .post(
            `${http.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          )
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
      } catch (_refreshError) {
        setAccessToken(null);
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);
