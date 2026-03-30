import api from '../api/api';
import { FEED_PAGE_SIZE } from '../utils/constants';

//  GET /api/videos/feed 
export const getFeed = async ({ type = 'forYou', page = 1, limit = FEED_PAGE_SIZE } = {}) => {
    const res = await api.get('/videos/feed', { params: { page, limit } });
    return { data: res.data };
};

//  GET /api/videos/:id 
export const getVideoById = async (id) => {
    const res = await api.get(`/videos/${id}`);
    return { data: res.data };
};

//  GET /api/videos/:id/comments 
export const getComments = async (videoId, { page = 1, limit = 20 } = {}) => {
    const res = await api.get(`/videos/${videoId}/comments`, { params: { page, limit } });
    return { data: res.data };
};

//  POST /api/videos/:id/comments 
export const postComment = async (videoId, { content }) => {
    const res = await api.post(`/videos/${videoId}/comments`, { content });
    return { data: res.data };
};

//  POST /api/videos/:id/like 
export const likeVideo = async (videoId) => {
    const res = await api.post(`/videos/${videoId}/like`);
    return { data: res.data };
};

//  DELETE /api/videos/:id/like 
export const unlikeVideo = async (videoId) => {
    const res = await api.delete(`/videos/${videoId}/like`);
    return { data: res.data };
};

//  GET /api/videos/search 
export const searchVideos = async ({ q = '', page = 1, limit = 10 } = {}) => {
    const res = await api.get('/videos/search', { params: { q, page, limit } });
    return { data: res.data };
};

//  GET /api/videos/user/:userId 
export const getUserVideosByUserId = async (userId, { page = 1, limit = 12 } = {}) => {
    const res = await api.get(`/videos/user/${userId}`, { params: { page, limit } });
    return { data: res.data };
};

//  POST /api/videos/upload 
// (Phase 2 — cần Cloudinary. Hiện tạm giữ stub)
export const uploadVideo = async (formData) => {
    // TODO: implement khi thêm Cloudinary
    throw new Error('Tính năng upload đang được phát triển');
};