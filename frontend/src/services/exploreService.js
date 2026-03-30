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

// GET /api/users/suggestions — hiển thị tất cả users gợi ý, ưu tiên creator
export const getFeaturedCreators = async ({ limit = 5 } = {}) => {
    try {
        const res = await api.get('/users/suggestions', { params: { limit: limit * 3 } });
        const all = res.data.users || [];

        // Ưu tiên creator lên trước nhưng vẫn hiện user thường nếu chưa đủ
        const creators = all.filter(u => u.isCreator);
        const others = all.filter(u => !u.isCreator);
        const merged = [...creators, ...others].slice(0, limit);

        return { data: { creators: merged } };
    } catch {
        return { data: { creators: [] } };
    }
};

// Tìm kiếm tổng hợp
export const globalSearch = async ({ q = '', limit = 20 } = {}) => {
    try {
        const [videosRes, usersRes, hashtagsRes] = await Promise.allSettled([
            api.get('/videos/search', { params: { q, limit } }),
            api.get('/users/suggestions', { params: { limit: 20 } }),
            api.get('/hashtags/search', { params: { q, limit: 5 } }),
        ]);

        const videos = videosRes.status === 'fulfilled' ? (videosRes.value.data.videos || []) : [];
        const allUsers = usersRes.status === 'fulfilled' ? (usersRes.value.data.users || []) : [];
        const hashtags = hashtagsRes.status === 'fulfilled' ? (hashtagsRes.value.data.hashtags || []) : [];

        // Lọc users theo query (bao gồm cả user thường)
        const lq = q.toLowerCase();
        const users = q.trim()
            ? allUsers.filter(u =>
                u.username?.toLowerCase().includes(lq) ||
                u.fullName?.toLowerCase().includes(lq)
            )
            : allUsers;

        return { data: { videos, users, hashtags, query: q } };
    } catch {
        return { data: { videos: [], users: [], hashtags: [], query: q } };
    }
};