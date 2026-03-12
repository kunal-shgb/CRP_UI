import axios from "axios";

// Default to localhost:3001 if no environment variable is provided
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
    if (error.response?.status === 401) {
      // Handle unauthorized error globally
      localStorage.removeItem("token");
      // Prevent redirecting if already on login page
      if (window.location.pathname !== '/login') {
         window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
