import axios from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL;
// In production we force same-origin /api to keep auth cookies first-party on iOS Safari.
const baseURL = import.meta.env.PROD ? '/api' : (envApiUrl || '/api');

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  // Required for Better Auth session cookies to be sent cross-origin
  withCredentials: true,
});

// No Authorization header interceptor — Better Auth uses HTTP-only cookies.

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
