import api from '../api/api';

// GET /api/categories
export const getCategories = async () => {
    try {
        const res = await api.get('/categories');
        return { data: res.data };
    } catch {
        return { data: { categories: [{ id: '1', label: 'Tất cả', value: 'all' }] } };
    }
};

// GET /api/hashtags/trending
export const getTrendingHashtags = async ({ limit = 7 } = {}) => {
    try {
        const res = await api.get('/hashtags/trending', { params: { limit } });
        return { data: res.data };
    } catch {
        return { data: { hashtags: [] } };
    }
};

// GET /api/users/suggestions (lọc chỉ creator)
export const getFeaturedCreators = async ({ limit = 5 } = {}) => {
    try {
        const res = await api.get('/users/suggestions', { params: { limit: limit * 2 } });
        const all = res.data.users || [];
        const creators = all.filter(u => u.isCreator);
        return { data: { creators: (creators.length ? creators : all).slice(0, limit) } };
    } catch {
        return { data: { creators: [] } };
    }
};

// Tìm kiếm tổng hợp
export const globalSearch = async ({ q = '', limit = 20 } = {}) => {
    try {
        const [videosRes, usersRes, hashtagsRes] = await Promise.allSettled([
            api.get('/videos/search', { params: { q, limit } }),
            api.get('/users/suggestions', { params: { limit: 5 } }),
            api.get('/hashtags/search', { params: { q, limit: 5 } }),
        ]);

        const videos = videosRes.status === 'fulfilled' ? (videosRes.value.data.videos || []) : [];
        const allUsers = usersRes.status === 'fulfilled' ? (usersRes.value.data.users || []) : [];
        const hashtags = hashtagsRes.status === 'fulfilled' ? (hashtagsRes.value.data.hashtags || []) : [];

        // Lọc users theo query
        const lq = q.toLowerCase();
        const users = allUsers.filter(u =>
            u.username?.toLowerCase().includes(lq) ||
            u.fullName?.toLowerCase().includes(lq)
        );

        return { data: { videos, users, hashtags, query: q } };
    } catch {
        return { data: { videos: [], users: [], hashtags: [], query: q } };
    }
};