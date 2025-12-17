import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: async (data: { fullName: string; email: string; password: string }) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

export const fileAPI = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  uploadBulkFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await api.post('/files/upload/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getUserFiles: async () => {
    const response = await api.get('/files');
    return response.data;
  },
  downloadFile: async (fileId: string) => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  deleteFile: async (fileId: string) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },
};

export const shareAPI = {
  getAllUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
  getSharedFiles: async () => {
    const response = await api.get('/share/shared-with-me');
    return response.data;
  },
  shareWithUsers: async (fileId: string, userIds: string[], expiresAt?: string) => {
    const response = await api.post('/share/users', { fileId, userIds, expiresAt });
    return response.data;
  },
  generateShareLink: async (fileId: string, expiresAt?: string) => {
    const response = await api.post('/share/link', { fileId, expiresAt });
    return response.data;
  },
  accessFileViaLink: async (token: string) => {
    const response = await api.get(`/share/link/${token}`);
    return response.data;
  },
  downloadFileViaLink: async (token: string) => {
    const response = await api.get(`/share/link/${token}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  getFilePermissions: async (fileId: string) => {
    const response = await api.get(`/share/permissions/${fileId}`);
    return response.data;
  },
  revokeAccess: async (fileId: string, targetUserId: string) => {
    const response = await api.post('/share/revoke', { fileId, targetUserId });
    return response.data;
  },
};

export const auditAPI = {
  getFileAuditLog: async (fileId: string) => {
    const response = await api.get(`/audit/file/${fileId}`);
    return response.data;
  },
  getUserActivity: async () => {
    const response = await api.get('/audit/user');
    return response.data;
  },
};

export default api;
