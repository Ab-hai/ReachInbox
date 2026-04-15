import axios from 'axios';
import type {
  AuthStatusResponse,
  EmailsResponse,
  ScheduleEmailRequest,
  ScheduleEmailResponse,
  StatsResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authApi = {
  getStatus: async (): Promise<AuthStatusResponse> => {
    const response = await api.get('/api/auth/status');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // Redirect to Google OAuth
  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  },
};

// Email API
export const emailApi = {
  schedule: async (data: ScheduleEmailRequest): Promise<ScheduleEmailResponse> => {
    const response = await api.post('/api/emails/schedule', data);
    return response.data;
  },

  getScheduled: async (page = 1, limit = 50): Promise<EmailsResponse> => {
    const response = await api.get(`/api/emails/scheduled?page=${page}&limit=${limit}`);
    return response.data;
  },

  getSent: async (page = 1, limit = 50): Promise<EmailsResponse> => {
    const response = await api.get(`/api/emails/sent?page=${page}&limit=${limit}`);
    return response.data;
  },

  getFailed: async (): Promise<EmailsResponse> => {
    const response = await api.get('/api/emails/failed');
    return response.data;
  },

  getAll: async (page = 1, limit = 50): Promise<EmailsResponse> => {
    const response = await api.get(`/api/emails?page=${page}&limit=${limit}`);
    return response.data;
  },

  getStats: async (): Promise<StatsResponse> => {
    const response = await api.get('/api/emails/stats');
    return response.data;
  },
};

export default api;
