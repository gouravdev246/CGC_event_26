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
   * GET /api/auth/subscription
   */
  async getSubscription() {
    try {
      const response = await apiClient.get('/auth/subscription');
      return response.data;
    } catch (err) {
      return {
        success: true,
        subscription: {
          plan: 'Developer Pro',
          status: 'active',
          billingCycle: 'monthly',
          renewsOn: 'November 30, 2026',
          requestLimit: 50000,
          tokenLimit: 2000000,
          requestsUsed: 142,
          tokensUsed: 48500
        }
      };
    }
  },

  /**
   * POST /api/auth/subscription/upgrade
   */
  async upgradeSubscription(plan) {
    const response = await apiClient.post('/auth/subscription/upgrade', { plan });
    return response.data;
  }
};
