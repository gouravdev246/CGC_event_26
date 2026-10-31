import axios from 'axios';
import { initialEmptyOverview, emptyTimeSeries } from './mockData';

// API Client pointing to backend environment or localhost:5001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach authenticated JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rag_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
 * Service to consume genuine backend telemetry endpoints.
 * Returns clean empty data structures when no data is recorded yet (no fake bloated numbers).
 */
export const apiService = {
  /**
   * GET /api/usage/overview
   */
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

  /**
   * GET /api/usage/requests
   */
  async getRequestsTimeSeries(params = {}) {
    try {
      const response = await apiClient.get('/usage/requests', { params });
      return { data: response.data || [], source: 'backend' };
    } catch (err) {
      return { data: emptyTimeSeries, source: 'empty' };
    }
  },

  /**
   * GET /api/usage/tokens
   */
  async getTokensTimeSeries(params = {}) {
    try {
      const response = await apiClient.get('/usage/tokens', { params });
      return { data: response.data || [], source: 'backend' };
    } catch (err) {
      return { data: emptyTimeSeries, source: 'empty' };
    }
  },

  /**
   * GET /api/usage/latency
   */
  async getLatencyTimeSeries(params = {}) {
    try {
      const response = await apiClient.get('/usage/latency', { params });
      return { data: response.data || [], source: 'backend' };
    } catch (err) {
      return { data: emptyTimeSeries, source: 'empty' };
    }
  },

  /**
   * GET /api/usage/models
   */
  async getModelWiseUsage(params = {}) {
    try {
      const response = await apiClient.get('/usage/models', { params });
      return { data: response.data || [], source: 'backend' };
    } catch (err) {
      return { data: [], source: 'empty' };
    }
  },

  /**
   * GET /api/usage/rag-performance
   */
  async getRagPerformance(params = {}) {
    try {
      const response = await apiClient.get('/usage/rag-performance', { params });
      return { data: response.data || null, source: 'backend' };
    } catch (err) {
      return { data: null, source: 'empty' };
    }
  },

  /**
   * GET /api/usage/history
   */
  async getRequestHistory(params = {}) {
    try {
      const response = await apiClient.get('/usage/history', { params });
      return { data: response.data || [], source: 'backend' };
    } catch (err) {
      // Check if user has executed real queries locally, or return empty list
      const savedLocalHistory = localStorage.getItem('rag_recent_queries');
      if (savedLocalHistory) {
        try {
          return { data: JSON.parse(savedLocalHistory), source: 'local' };
        } catch (_) {}
      }
      return { data: [], source: 'empty' };
    }
  },

  /**
   * GET /api/auth/me
   */
  async getMe() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (err) {
      const email = localStorage.getItem('rag_user_email') || '';
      const name = localStorage.getItem('rag_user_name') || '';
      return { success: false, user: { email, name } };
    }
  },

  /**
   * POST /api/auth/change-password
   */
  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  /**
   * File Upload & Management endpoints
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('rag_auth_token');
    const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return response.data;
  },

  async getFiles() {
    try {
      const response = await apiClient.get('/files');
      return response.data;
    } catch (err) {
      return { success: false, files: [] };
    }
  },

  async deleteFile(fileId) {
    const response = await apiClient.delete(`/files/${fileId}`);
    return response.data;
  },

  /**
   * RAG Query endpoint
   */
  async queryRag(queryText, topK = 3) {
    const response = await apiClient.post('/rag/query', { query: queryText, topK });
    return response.data;
  },

  /**
   * GET /api/subscription/current (with fallback)
   */
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

  /**
   * POST /api/subscription/create-checkout-session
   */
  async createCheckoutSession(planId) {
    const response = await apiClient.post('/subscription/create-checkout-session', { planId });
    return response.data;
  },

  /**
   * GET /api/subscription/verify-session?session_id=...
   */
  async verifyCheckoutSession(sessionId) {
    const response = await apiClient.get('/subscription/verify-session', {
      params: { session_id: sessionId }
    });
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
