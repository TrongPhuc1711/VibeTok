import api from '../api/api';
import { getStoredUser } from '../utils/helpers';

//  GET /api/users/:username 
export const getUserProfile = async (username) => {
    const res = await api.get(`/users/${username.replace('@', '')}`);
    return { data: res.data };
};

//  GET /api/videos/user/:userId (videos của user theo id) 
// Dùng userService vì frontend gọi theo username → cần lookup id trước
export const getUserVideos = async (username, opts = {}) => {
    // Lấy profile để có userId, rồi lấy videos
    const profileRes = await getUserProfile(username);
    const userId = profileRes.data.user.id;
    const res = await api.get(`/videos/user/${userId}`, { params: opts });
    return { data: res.data };
};

//  GET /api/users/suggestions 
export const getSuggestedUsers = async ({ limit = 5 } = {}) => {
    const res = await api.get('/users/suggestions', { params: { limit } });
    return { data: res.data };
};

//  POST /api/users/:username/follow 
export const followUser = async (username) => {
    const res = await api.post(`/users/${username.replace('@', '')}/follow`);
    return { data: res.data };
};

//  DELETE /api/users/:username/follow 
export const unfollowUser = async (username) => {
    const res = await api.delete(`/users/${username.replace('@', '')}/follow`);
    return { data: res.data };
};

//  PATCH /api/users/me 
export const updateProfile = async (updates) => {
    const res = await api.patch('/users/me', updates);
    return { data: res.data };
};