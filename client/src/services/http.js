import axios from "axios";

let accessToken = localStorage.getItem("arrakis_access_token");

export const setAccessToken = (token) => {
  accessToken = token;
};

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
});

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || error)
);
