// lib/api-new.ts - API client for AssetWorks backend (FRESH VERSION)
import axios from 'axios';

// AssetWorks API Base URL - Using Next.js proxy to avoid CORS issues
const API_BASE_URL = '/api/proxy';

console.log('🔗 NEW API_BASE_URL:', API_BASE_URL);

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token (but not for auth endpoints)
apiClient.interceptors.request.use((config) => {
  // Don't add auth token for authentication endpoints
  const isAuthEndpoint = config.url?.includes('/auth/');
  if (!isAuthEndpoint) {
    const token = localStorage.getItem('assetworks_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if it's an onboarding issue vs actual auth failure
      const errorMessage = error.response?.data?.message || '';
      
      if (errorMessage.includes('User has not completed onboarding')) {
        // This is an onboarding issue, not an auth failure
        // Don't logout the user, just let the error propagate
        console.warn('⚠️ User has not completed onboarding, but keeping auth state');
        return Promise.reject(error);
      } else {
        // Actual authentication failure - logout and redirect
        console.log('🔐 Authentication failed, logging out');
        localStorage.removeItem('assetworks_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const API = {
  // Authentication
  auth: {
    googleLogin: (data: any) => apiClient.post('/auth/callbacks/login/google', data),
    appleLogin: (data: any) => apiClient.post('/auth/callbacks/login/apple', data),
    sendOTP: (data: { identifier: string }) => apiClient.post('/auth/otp/send', data),
    verifyOTP: (data: { identifier: string; otp: string }) => apiClient.post('/auth/otp/verify', data),
  },

  // User management
  user: {
    getProfile: () => apiClient.get('/users/profile'),
    getUserProfile: (userId: string) => apiClient.get(`/users/profile/${userId}`),
    updateProfile: (data: any) => apiClient.put('/users/profile/update', data),
    getNotifications: () => apiClient.get('/users/notifications'),
    readNotifications: () => apiClient.put('/users/notifications/read'),
    deleteAccount: () => apiClient.post('/users/delete-account'),
    signOut: () => apiClient.post('/users/signout'),
  },

  // Data endpoints
  data: {
    getOnboardData: () => apiClient.get('/data/onboard-data'),
    getCountries: () => apiClient.get('/data/countries'),
    getWidgetData: () => apiClient.get('/data/widget-data'),
    getMaintenanceStatus: () => apiClient.get('/data/maintenance'),
    getSoftUpdates: () => apiClient.get('/data/soft_updates'),
    getForceUpdates: () => apiClient.get('/data/force_updates'),
  },

  // Widgets
  widgets: {
    getDashboardWidgets: (page = 1, limit = 10) => apiClient.get(`/personalization/dashboard/widgets?page=${page}&limit=${limit}`),
    getDetail: (id: string) => apiClient.get(`/widgets/${id}/detail`),
    getTrending: (page = 1, limit = 10) => apiClient.get(`/widgets/trending?page=${page}&limit=${limit}`),
    follow: (id: string) => apiClient.post(`/widgets/${id}/follow`),
    unfollow: (id: string) => apiClient.post(`/widgets/${id}/unfollow`),
    like: (id: string) => apiClient.post(`/widgets/${id}/like`),
    dislike: (id: string) => apiClient.post(`/widgets/${id}/dislike`),
    save: (id: string) => apiClient.post(`/widgets/${id}/save`),
    share: (id: string) => apiClient.post(`/widgets/${id}/share`),
    report: (id: string) => apiClient.post(`/widgets/${id}/report`),
  },

  // AI Prompts
  prompts: {
    sendPrompt: (data: any) => apiClient.post('/prompts/intention', data),
    getResult: (data: any) => apiClient.post('/prompts/result', data),
    uploadAttachment: (data: FormData) => apiClient.post('/prompts/attachments', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    notify: (data: any) => apiClient.post('/prompts/notify', data),
  },
};

export default apiClient;