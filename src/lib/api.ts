import axios from "axios";
import axiosRetry from "axios-retry";

export const localAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api",
  withCredentials: true,
  timeout: 600000,
});

axiosRetry(localAPI, {
  retries: 3,
  retryCondition: (error) => {
    const status = error?.response?.status;
    return axiosRetry.isNetworkError(error) || status === 429 || status === 503;
  },
  retryDelay: (retryCount, error) => {
    const retryAfter = error.response?.headers?.["retry-after"];
    if (retryAfter) {
      return parseInt(retryAfter, 10) * 1000;
    }
    return Math.min(2 ** retryCount * 1000 + Math.random() * 1000, 30000);
  },
});
