// lib/axios.js - FIXED
import axios from "axios";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api"
    : "https://chatly-gizs.onrender.com/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ This is critical for CORS with cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds (for Render cold starts)
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to:`,
      config.url
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("❌ Network Error or CORS issue:", error.message);
      console.error(
        "This usually means the backend is down or CORS is blocking the request"
      );
    } else {
      console.error(
        "❌ Server Error:",
        error.response.status,
        error.response.data
      );
    }
    return Promise.reject(error);
  }
);
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;
