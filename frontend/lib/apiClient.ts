import axios from 'axios';

export const TOKEN_KEY = 'hr_token';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: { Accept: 'application/json' },
});

export const VIEW_MODE_KEY = 'hr-compass:viewMode';

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const viewMode = localStorage.getItem(VIEW_MODE_KEY);
  if (viewMode) config.headers['X-View-Mode'] = viewMode;

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  },
);
