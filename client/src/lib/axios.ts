import axios from 'axios';

// In production (Vercel), use the environment variable. In dev, use the local Vite proxy (/api) to avoid CORS/cookie issues.
const API_BASE = import.meta.env.PROD ? (import.meta.env.VITE_API_URL ?? '/api') : '/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Don't intercept if already on login/register or if this is the refresh call itself
    const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/register';
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');
    const isAuthMeCall = originalRequest?.url?.includes('/auth/me');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute &&
      !isRefreshCall &&
      !isAuthMeCall
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
