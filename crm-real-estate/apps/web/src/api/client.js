import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // для refresh-токена в httpOnly cookie
});

let accessToken = null;
let onUnauthorized = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshingPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (
  status === 401 &&
  !original._retry &&
  !original.url?.includes("/auth/login") &&
  !original.url?.includes("/auth/refresh")
) {
      original._retry = true;
      try {
        if (!refreshingPromise) {
          refreshingPromise = api.post("/auth/refresh").finally(() => {
            refreshingPromise = null;
          });
        }
        const { data } = await refreshingPromise;
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        if (onUnauthorized) onUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(err, fallback = "Произошла ошибка") {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (data.details?.length) {
    return data.details.map((d) => d.message || d).join("; ");
  }
  return data.error || fallback;
}
