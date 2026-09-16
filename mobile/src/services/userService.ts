/**
 * User service — profile, follow, suggestions.
 */

import api from '../api/api';

export const getUserProfile = async (username: string) => {
  const res = await api.get(`/users/${username.replace('@', '')}`);
  return { data: res.data };
};

export const getSuggestedUsers = async ({ limit = 50 } = {}) => {
  const res = await api.get('/users/suggestions', { params: { limit } });
  return { data: res.data };
};

export const followUser = async (username: string) => {
  const res = await api.post(`/users/${username.replace('@', '')}/follow`);
  return { data: res.data };
};

export const unfollowUser = async (username: string) => {
  const res = await api.delete(`/users/${username.replace('@', '')}/follow`);
  return { data: res.data };
};

export const updateProfile = async (updates: Record<string, any>) => {
  const res = await api.patch('/users/me', updates);
  return { data: res.data };
};

export const updateAvatar = async (file: any) => {
  const data = new FormData();
  data.append('avatar', file);
  const res = await api.patch('/users/me', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { data: res.data };
};

export const searchUsers = async ({ q = '', limit = 10 } = {}) => {
  const res = await api.get('/users/search', { params: { q, limit } });
  return { data: res.data };
};
