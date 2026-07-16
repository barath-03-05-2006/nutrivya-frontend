import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const isAuth = url.includes('/auth/login') || url.includes('/auth/register');

    // Real 401 from backend — session/token invalid or expired
    if (err.response?.status === 401 && !isAuth) {
      localStorage.clear();
      window.location.href = '/login?reason=expired';
      return Promise.reject(err);
    }

    // No response at all = backend unreachable (server down, wrong URL, CORS block, network error)
    if (!err.response) {
      err.isNetworkError = true;
    }

    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (email, password) => API.post('/auth/login', { email, password }),
  register: (data) => API.post('/auth/register', data),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => API.post('/auth/reset-password', { token, newPassword }),
};

export const clientAPI = {
  getMyProfile: () => API.get('/clients/my-profile'),
  getProfile: (id) => API.get(`/clients/profile/${id}`),
  saveProfile: (data) => API.post('/clients/profile', data),
  getMyClients: () => API.get('/clients/dietitian/my-clients'),
  getDietitians: () => API.get('/clients/dietitians'),
  setTargets: (clientId, targets) => API.post(`/clients/set-targets/${clientId}`, targets),
};

// Single unified mealAPI — no more duplicate mealPlanAPI
export const mealAPI = {
  create: (data) => API.post('/meal-plans', data),
  update: (planId, data) => API.put(`/meal-plans/${planId}`, data),
  delete: (planId) => API.delete(`/meal-plans/${planId}`),
  getClientPlans: (clientId) => API.get(`/meal-plans/client/${clientId}`),
  getToday: () => API.get('/meal-plans/my-plans/today'),
  getMyPlans: () => API.get('/meal-plans/my-plans'),
  getByDate: (clientId, date) => API.get(`/meal-plans/client/${clientId}/date/${date}`),
  completeMeal: (mealId) => API.post(`/meal-plans/meal/${mealId}/complete`),
reportFoodItemDeviation: (foodItemId, note) => API.post(`/meal-plans/food-item/${foodItemId}/deviation`, { note }),
updateFoodItemActualNutrition: (foodItemId, data) => API.put(`/meal-plans/food-item/${foodItemId}/actual-nutrition`, data),
};

export const analyticsAPI = {
  getMyDaily: (date) => API.get('/analytics/my/daily', { params: { date } }),
  getDaily: (clientId, date) => API.get(`/analytics/daily/${clientId}`, { params: { date } }),
  getMyWeekly: (weekStart) => API.get('/analytics/my/weekly', { params: { weekStart } }),
  getWeekly: (clientId, weekStart) => API.get(`/analytics/weekly/${clientId}`, { params: { weekStart } }),
  getClientOverview: (clientId) => API.get(`/analytics/client-overview/${clientId}`),
  getAllClientsOverview: () => API.get('/analytics/dietitian/clients'),
  logWater: (data) => API.post('/analytics/water', data),
  logWeight: (data) => API.post('/analytics/weight', data),
  getWeightHistory: (clientId) => API.get(`/analytics/weight-history/${clientId}`),
  getMyWeightHistory: () => API.get('/analytics/my/weight-history'),
  addNote: (clientId, note) => API.post(`/analytics/progress-note/${clientId}`, { note }),
  updateNote: (noteId, note) => API.put(`/analytics/progress-note/${noteId}`, { note }),
  deleteNote: (noteId) => API.delete(`/analytics/progress-note/${noteId}`),
  getNotes: (clientId) => API.get(`/analytics/progress-notes/${clientId}`),
  getMyNotes: () => API.get('/analytics/my-progress-notes'),
};

export const alertAPI = {
  getAll: () => API.get('/alerts'),
  getUnread: () => API.get('/alerts/unread'),
  getCount: () => API.get('/alerts/count'),
  markRead: (id) => API.put(`/alerts/${id}/read`),
  markAllRead: () => API.put('/alerts/mark-all-read'),
  triggerAlerts: () => API.post('/alerts/trigger'),
};

export const foodAPI = {
  search: (q) => API.get('/foods/search', { params: { q } }),
  getAll: () => API.get('/foods'),
  create: (data) => API.post('/foods', data),
};

export default API;

export const photoAPI = {
  upload: (formData) => API.post('/photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMine: () => API.get('/photos/my'),
  getClientPhotos: (clientId) => API.get(`/photos/client/${clientId}`),
  // Fetches the actual image bytes with the JWT auth header attached, as a Blob.
  // A plain <img src="..."> can't send the Authorization header, so this is required.
  getImageBlob: (id) => API.get(`/photos/${id}/image`, { responseType: 'blob' }),
  delete: (id) => API.delete(`/photos/${id}`),
};

export const digestAPI = {
  sendMyDigest: () => API.post('/digest/send-my-digest'),
};
