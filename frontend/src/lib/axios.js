import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://chatly-gizs.onrender.com/api",
  withCredentials: true,
});
