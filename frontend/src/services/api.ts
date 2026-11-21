import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Tasks
export const taskAPI = {
  getAll: (params?: { status?: string; priority?: string }) => api.get('/tasks', { params }),
  create: (data: { title: string; description?: string; priority?: string }) => api.post('/tasks', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Pomodoro
export const pomodoroAPI = {
  start: (data: { focus_duration?: number; break_duration?: number; task_id?: string }) => api.post('/pomodoro/start', data),
  pause: () => api.post('/pomodoro/pause'),
  resume: () => api.post('/pomodoro/resume'),
  stop: (status: string) => api.post('/pomodoro/stop', { status }),
  getHistory: (params?: { limit?: number; offset?: number }) => api.get('/pomodoro/history', { params }),
  getActive: () => api.get('/pomodoro/active'),
};

// Vision
export const visionAPI = {
  reportDrowsiness: (data: { eye_closure_duration: number; severity: string }) => api.post('/vision/drowsiness', data),
  reportFocus: (data: { event_type: string; duration?: number }) => api.post('/vision/focus', data),
  getDrowsinessEvents: (params?: { from?: string; to?: string }) => api.get('/vision/drowsiness', { params }),
  getFocusEvents: (params?: { from?: string; to?: string }) => api.get('/vision/focus', { params }),
};

// Analytics
export const analyticsAPI = {
  getDaily: (date?: string) => api.get('/analytics/daily', { params: { date } }),
  getWeekly: () => api.get('/analytics/weekly'),
  getMonthly: () => api.get('/analytics/monthly'),
  getInsights: () => api.get('/analytics/insights'),
};

// Telegram
export const telegramAPI = {
  getSettings: () => api.get('/telegram/settings'),
  updateSettings: (data: { bot_token?: string; chat_id?: string; enabled?: boolean }) => api.put('/telegram/settings', data),
  test: () => api.post('/telegram/test'),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
