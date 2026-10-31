import axios from 'axios';
import { initialEmptyOverview, emptyTimeSeries } from './mockData';

// API Client pointing to backend environment or localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds to allow for PDF parsing and embedding generation
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach authenticated JWT token and user ID to outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rag_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const userId = localStorage.getItem('rag_user_id');
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 Unauthorized responses to clear stale sessions and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rag_auth_token');
      localStorage.removeItem('rag_user_email');
      localStorage.removeItem('rag_user_name');
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/landing') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Service to connect to backend endpoints.
 */
export const apiService = {
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  async register(name, email, password) {
    const response = await apiClient.post('/auth/register', { name, email, password });
    return response.data;
  },

  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async getMe() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (err) {
      const email = localStorage.getItem('rag_user_email') || '';
      const name = localStorage.getItem('rag_user_name') || '';
      const id = localStorage.getItem('rag_user_id') || '';
      return { success: false, user: { id, email, name } };
    }
  },

  // ==========================================
  // DOCUMENT INGESTION (RAG UPLOAD)
  // ==========================================
  async uploadFile(formData, onProgress) {
    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  // ==========================================
  // API KEY MANAGEMENT
  // ==========================================
  async getCurrentApiKey() {
    const response = await apiClient.get('/keys/current');
    return response.data;
  },

  async generateApiKey() {
    const response = await apiClient.post('/keys/generate');
    return response.data;
  },

  // ==========================================
  // RAG CHATBOT QUERY SERVICE
  // ==========================================
  async queryRAG({ userId, apiKey, message, history = [], k = 4 }) {
    if (apiKey) {
      // Direct endpoint with API key in URL path: /api/:userid/:apikey/chat
      const response = await apiClient.post(`/${userId}/${apiKey}/chat`, {
        message,
        history,
        k,
      });
      return response.data;
    }

    // Standard endpoint with API key in header
    const response = await apiClient.post(
      `/${userId}/chat`,
      { message, history, k },
      { headers: { 'x-api-key': apiKey } }
    );
    return response.data;
  },

  // ==========================================
  // TELEMETRY & DASHBOARD
  // ==========================================
  async getDashboardOverview(params = {}) {
    try {
      const response = await apiClient.get('/usage/overview', { params });
      return { data: response.data, source: 'backend' };
    } catch (err) {
      return {
        data: initialEmptyOverview,
        source: 'empty',
        endpoint: `${API_BASE_URL}/usage/overview`
      };
    }
  },

  async getRequestsTimeSeries(params = {}) {
    try {
      const response = await apiClient.get('/usage/requests', { params });
      return { data: response.data || [], source: 'backend' };
    } catch (err) {
      return { data: emptyTimeSeries, source: 'empty' };
    }
  },

  async getTokensTimeSeries(params = {}) {
    try {
      const response = await apiClient.get('/usage/tokens', { params });
      return { data: response.data || [], source: 'backend' };
    } catch (err) {
      return { data: emptyTimeSeries, source: 'empty' };
    }
  },

  async getLatencyTimeSeries(params = {}) {
    try {
      const response = await apiClient.get('/usage/latency', { params });
      return { data: response.data || [], source: 'backend' };
    } catch (err) {
      return { data: emptyTimeSeries, source: 'empty' };
    }
  },

  async getModelWiseUsage(params = {}) {
    try {
      const response = await apiClient.get('/usage/models', { params });
      return { data: response.data || [], source: 'backend' };
    } catch (err) {
      return { data: [], source: 'empty' };
    }
  },

  async getRagPerformance(params = {}) {
    try {
      const response = await apiClient.get('/usage/rag-performance', { params });
      return { data: response.data || null, source: 'backend' };
    } catch (err) {
      return { data: null, source: 'empty' };
    }
  },

  async getRequestHistory(params = {}) {
    try {
      const response = await apiClient.get('/usage/history', { params });
      return { data: response.data || [], source: 'backend' };
    } catch (err) {
      const savedLocalHistory = localStorage.getItem('rag_recent_queries');
      if (savedLocalHistory) {
        try {
          return { data: JSON.parse(savedLocalHistory), source: 'local' };
        } catch (_) {}
      }
      return { data: [], source: 'empty' };
    }
  },

  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  async getSubscription() {
    try {
      const response = await apiClient.get('/subscription/current');
      return response.data;
    } catch (_) {
      try {
        const fallback = await apiClient.get('/auth/subscription');
        return fallback.data;
      } catch (err) {
        return {
          success: true,
          subscription: {
            plan: 'Free',
            status: 'active',
            billingCycle: 'monthly',
            renewsOn: 'Never (Free Tier)',
            documentLimit: 2,
            documentsUsed: 0,
            requestLimit: 100,
            requestsUsed: 0
          }
        };
      }
    }
  },

  /**
   * GET /api/subscription/plans
   */
  async getSubscriptionPlans() {
    try {
      const response = await apiClient.get('/subscription/plans');
      return response.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async upgradeSubscription(plan) {
    const response = await apiClient.post('/auth/subscription/upgrade', { plan });
    return response.data;
  },

  /**
   * POST /api/subscription/switch-free
   */
  async switchToFreePlan() {
    const response = await apiClient.post('/subscription/switch-free');
    return response.data;
  },

  /**
   * POST /api/subscription/portal
   */
  async openCustomerPortal() {
    const response = await apiClient.post('/subscription/portal');
    return response.data;
  },

  /**
   * Legacy upgrade fallback
   */
  async upgradeSubscription(plan) {
    try {
      const response = await apiClient.post('/auth/subscription/upgrade', { plan });
      return response.data;
    } catch (_) {
      return this.createCheckoutSession(plan);
    }
  }
};
