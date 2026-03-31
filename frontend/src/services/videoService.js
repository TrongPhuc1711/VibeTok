import api from '../api/api';
import { FEED_PAGE_SIZE } from '../utils/constants';

// GET /api/videos/feed
export const getFeed = async ({ type = 'forYou', page = 1, limit = FEED_PAGE_SIZE } = {}) => {
    const res = await api.get('/videos/feed', { params: { type, page, limit } });
    return { data: res.data };
};

// GET /api/videos/:id
export const getVideoById = async (id) => {
    const res = await api.get(`/videos/${id}`);
    return { data: res.data };
};

// GET /api/videos/:id/comments
export const getComments = async (videoId, { page = 1, limit = 20 } = {}) => {
    const res = await api.get(`/videos/${videoId}/comments`, { params: { page, limit } });
    return { data: res.data };
};

// POST /api/videos/:id/comments
export const postComment = async (videoId, { content, parentId = null }) => {
    const res = await api.post(`/videos/${videoId}/comments`, { content, parentId });
    return { data: res.data };
};

// POST /api/videos/:id/like
export const likeVideo = async (videoId) => {
    const res = await api.post(`/videos/${videoId}/like`);
    return { data: res.data };
};

// DELETE /api/videos/:id/like
export const unlikeVideo = async (videoId) => {
    const res = await api.delete(`/videos/${videoId}/like`);
    return { data: res.data };
};

// GET /api/videos/search
export const searchVideos = async ({ q = '', page = 1, limit = 10 } = {}) => {
    const res = await api.get('/videos/search', { params: { q, page, limit } });
    return { data: res.data };
};

// GET /api/videos/user/:userId
export const getUserVideosByUserId = async (userId, { page = 1, limit = 12 } = {}) => {
    const res = await api.get(`/videos/user/${userId}`, { params: { page, limit } });
    return { data: res.data };
};

// DELETE /api/videos/:id
export const deleteVideo = async (videoId) => {
    const res = await api.delete(`/videos/${videoId}`);
    return { data: res.data };
};

// POST /api/videos/upload — multipart/form-data
export const uploadVideo = async (formData) => {
    const { caption, privacy, allowDuet, allowStitch, location, music, isDraft, file } = formData;

    if (!file) throw new Error('Vui lòng chọn file video');

    const data = new FormData();
    data.append('video', file);
    data.append('caption', caption || '');
    data.append('privacy', privacy || 'public');
    data.append('allowDuet', String(allowDuet ?? true));
    data.append('allowStitch', String(allowStitch ?? true));
    data.append('location', location || '');
    data.append('isDraft', String(isDraft ?? false));
    if (music?.id) data.append('musicId', String(music.id));

    const res = await api.post('/videos/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: formData.onProgress
            ? (e) => formData.onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
            : undefined,
    });
    return { data: res.data };
};