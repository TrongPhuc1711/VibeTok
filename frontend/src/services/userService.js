import api from '../api/api';

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

// GET /api/users/suggestions
export const getSuggestedUsers = async ({ limit = 5 } = {}) => {
    const res = await api.get('/users/suggestions', { params: { limit } });
    return { data: res.data };
};

// POST /api/users/:username/follow
export const followUser = async (username) => {
    const res = await api.post(`/users/${username.replace('@', '')}/follow`);
    return { data: res.data };
};

// DELETE /api/users/:username/follow
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