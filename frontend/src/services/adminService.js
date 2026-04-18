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

// Videos 
export const getAdminVideos = (params) => api.get(`${BASE}/videos`, { params }).then(r => r.data);
export const getVideoCounts = () => api.get(`${BASE}/video-counts`).then(r => r.data.counts);
export const hideVideo = (id) => api.patch(`${BASE}/videos/${id}/hide`);
export const restoreVideo = (id) => api.patch(`${BASE}/videos/${id}/restore`);

// Analytics
export const getViewsPerDay = (days = 7) => api.get(`${BASE}/views-per-day`, { params: { days } }).then(r => r.data.data);
