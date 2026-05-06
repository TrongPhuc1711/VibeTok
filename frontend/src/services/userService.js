import api from '../api/api';
import {seedFollowingCache } from '../utils/following';

// GET /api/users/:username
export const getUserProfile = async (username) => {
    const res = await api.get(`/users/${username.replace('@', '')}`);
    return { data: res.data };
};

// GET videos của user (theo username → lấy userId từ profile)
export const getUserVideos = async (username, opts = {}) => {
    const profileRes = await getUserProfile(username);
    const userId = profileRes.data.user.id;
    const res = await api.get(`/videos/user/${userId}`, { params: opts });
    return { data: res.data };
};

// GET /api/users/suggestions — seed cache từ kết quả trả về
export const getSuggestedUsers = async ({ limit = 5 } = {}) => {
    const res = await api.get('/users/suggestions', { params: { limit } });
    const users = res.data.users || [];

    // Seed followingCache từ danh sách gợi ý
    const followingIds = users
        .filter(u => u.isFollowing)
        .map(u => u.id);
    if (followingIds.length > 0) {
        seedFollowingCache(followingIds);
    }

    return { data: res.data };
};

// POST /api/users/:username/follow 
export const followUser = async (username) => {
    const res = await api.post(`/users/${username.replace('@', '')}/follow`);
    // Lấy userId từ response nếu có, không thì bỏ qua 
    return { data: res.data };
};

// DELETE /api/users/:username/follow — cập nhật cache ngay
export const unfollowUser = async (username) => {
    const res = await api.delete(`/users/${username.replace('@', '')}/follow`);
    return { data: res.data };
};

// PATCH /api/users/me
export const updateProfile = async (updates) => {
    const res = await api.patch('/users/me', updates);
    return { data: res.data };
};

// PATCH /api/users/me — upload ảnh đại diện
export const updateAvatar = async (file) => {
    const data = new FormData();
    data.append('avatar', file);
    const res = await api.patch('/users/me', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: res.data };
};

// GET /api/users/mention-search?q= — Tìm user để @nhắc đến
export const searchMentionUsers = async (q = '', limit = 10) => {
    const res = await api.get('/users/mention-search', { params: { q, limit } });
    return { data: res.data };
};