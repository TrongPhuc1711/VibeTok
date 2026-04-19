import api from '../api/api';

const BASE = '/admin';

//  Dashboard 
export const getStats = () => api.get(`${BASE}/stats`).then(r => r.data.stats);
export const getUserGrowth = (days = 12) => api.get(`${BASE}/user-growth`, { params: { days } }).then(r => r.data.data);
export const getContentDistribution = () => api.get(`${BASE}/content-distribution`).then(r => r.data.data);
export const getTopCreators = (limit = 5) => api.get(`${BASE}/top-creators`, { params: { limit } }).then(r => r.data.data);
export const getSidebarCounts = () => api.get(`${BASE}/sidebar-counts`).then(r => r.data.counts);

// Users 
export const getUsers = (params) => api.get(`${BASE}/users`, { params }).then(r => r.data);
export const getUserCounts = () => api.get(`${BASE}/user-counts`).then(r => r.data.counts);
export const banUser = (id) => api.patch(`${BASE}/users/${id}/ban`);
export const unbanUser = (id) => api.patch(`${BASE}/users/${id}/unban`);
export const resetUserPassword = (id, mat_khau_moi) => api.patch(`${BASE}/users/${id}/reset-password`, { mat_khau_moi });

// Videos 
export const getAdminVideos = (params) => api.get(`${BASE}/videos`, { params }).then(r => r.data);
export const getVideoCounts = () => api.get(`${BASE}/video-counts`).then(r => r.data.counts);
export const hideVideo = (id) => api.patch(`${BASE}/videos/${id}/hide`);
export const restoreVideo = (id) => api.patch(`${BASE}/videos/${id}/restore`);

// Music
export const getAdminMusic = (params) => api.get(`${BASE}/music`, { params }).then(r => r.data);
export const getMusicCounts = () => api.get(`${BASE}/music-counts`).then(r => r.data.counts);
export const createMusic = (data) => api.post(`${BASE}/music`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
export const updateMusic = (id, data) => api.patch(`${BASE}/music/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
export const deleteMusic = (id) => api.delete(`${BASE}/music/${id}`).then(r => r.data);
export const toggleMusicTrending = (id) => api.patch(`${BASE}/music/${id}/trending`).then(r => r.data);

// Analytics
export const getViewsPerDay = (days = 7) => api.get(`${BASE}/views-per-day`, { params: { days } }).then(r => r.data.data);
