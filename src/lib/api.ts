import axios from "axios";

// Default to localhost:3001 if no environment variable is provided
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // Handle unauthorized error globally — clear token and redirect to login
      localStorage.removeItem("token");
      if (window.location.pathname !== '/login') {
         window.location.href = "/login";
      }
    } else if (status === 403) {
      // Handle forbidden — user is authenticated but lacks permission
      // Do NOT clear token or redirect; let the calling component handle via onError
      console.warn("Access denied (403):", error.response?.data?.message || "You don't have permission to perform this action.");
    }
    return Promise.reject(error);
  }
);
