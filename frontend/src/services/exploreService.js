import api from '../api/api';
import { CATEGORIES } from '../utils/constants';

//  getCategories: dùng local constant (không cần API) 
export const getCategories = async () => ({
    data: { categories: CATEGORIES }
});

//  getTrendingHashtags: tìm từ videos hiện có 
export const getTrendingHashtags = async ({ limit = 7 } = {}) => {
    try {
        // Tìm video popular → parse hashtags từ caption
        const res = await api.get('/videos/feed', { params: { page: 1, limit: 20 } });
        const videos = res.data.videos || [];

        const tagMap = {};
        videos.forEach(v => {
            const tags = (v.caption || '').match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g) ?? [];
            tags.forEach(tag => {
                if (!tagMap[tag]) tagMap[tag] = { id: tag, tag, videos: 0, category: 'Trending' };
                tagMap[tag].videos += (v.views || 0);
            });
        });

        const hashtags = Object.values(tagMap)
            .sort((a, b) => b.videos - a.videos)
            .slice(0, limit);

        // Nếu không có hashtags trong DB → trả placeholder
        if (!hashtags.length) {
            return { data: { hashtags: [
                { id: 'h1', tag: '#vibetok',   videos: 120000, category: 'Trending' },
                { id: 'h2', tag: '#trending',  videos: 98000,  category: 'Trending' },
                { id: 'h3', tag: '#vn',        videos: 76000,  category: 'Lifestyle' },
                { id: 'h4', tag: '#travel',    videos: 54000,  category: 'Travel' },
                { id: 'h5', tag: '#music',     videos: 41000,  category: 'Music' },
                { id: 'h6', tag: '#dance',     videos: 38000,  category: 'Dance' },
                { id: 'h7', tag: '#food',      videos: 67000,  category: 'Food' },
            ].slice(0, limit) } };
        }

        return { data: { hashtags } };
    } catch {
        return { data: { hashtags: [] } };
    }
};

// getFeaturedCreators
export const getFeaturedCreators = async ({ limit = 5 } = {}) => {
    try {
        const res = await api.get('/users/suggestions', { params: { limit } });
        const creators = (res.data.users || []).filter(u => u.isCreator || u.vai_tro === 'creator');
        // Nếu không đủ creator, lấy tất cả suggestions
        const list = creators.length ? creators : (res.data.users || []);
        return { data: { creators: list.slice(0, limit) } };
    } catch {
        return { data: { creators: [] } };
    }
};

// globalSearch: tìm kiếm videos + users
export const globalSearch = async ({ q = '', limit = 20 } = {}) => {
    try {
        const [videosRes, usersRes] = await Promise.allSettled([
            api.get('/videos/search', { params: { q, limit } }),
            api.get('/users/suggestions', { params: { limit: 5 } }),
        ]);

        const videos  = videosRes.status  === 'fulfilled' ? (videosRes.value.data.videos  || []) : [];
        const allUsers = usersRes.status  === 'fulfilled' ? (usersRes.value.data.users    || []) : [];

        // Lọc users theo query
        const lq = q.toLowerCase();
        const users = allUsers.filter(u =>
            u.username?.toLowerCase().includes(lq) ||
            u.fullName?.toLowerCase().includes(lq) ||
            u.ten_dang_nhap?.toLowerCase().includes(lq) ||
            u.ten_hien_thi?.toLowerCase().includes(lq)
        );

        // Parse hashtags từ video captions
        const tagMap = {};
        videos.forEach(v => {
            const tags = (v.caption || '').match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g) ?? [];
            tags.filter(t => t.toLowerCase().includes(lq)).forEach(tag => {
                if (!tagMap[tag]) tagMap[tag] = { id: tag, tag, videos: 0 };
                tagMap[tag].videos++;
            });
        });

        return {
            data: {
                videos,
                users,
                hashtags: Object.values(tagMap).slice(0, 5),
                query: q,
            }
        };
    } catch {
        return { data: { videos: [], users: [], hashtags: [], query: q } };
    }
};