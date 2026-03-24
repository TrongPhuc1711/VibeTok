import { delay, ok, mockHashtags, mockUsers, mockVideos } from './mockData';
import { CATEGORIES } from '../utils/constants';

const safe = ({ password: _, ...u }) => u;

/* GET /api/explore/categories */
export const getCategories = async () => {
    await delay(200);
    return ok({ categories: CATEGORIES });
};

/* GET /api/explore/trending-hashtags */
export const getTrendingHashtags = async ({ limit = 7 } = {}) => {
    await delay(400);
    return ok({ hashtags: mockHashtags.slice(0, limit) });
};

/* GET /api/explore/featured-creators */
export const getFeaturedCreators = async ({ limit = 5 } = {}) => {
    await delay(400);
    return ok({ creators: mockUsers.filter(u => u.isCreator).slice(0, limit).map(safe) });
};

/* GET /api/explore/search */
export const globalSearch = async ({ q = '', limit = 20 } = {}) => {
    await delay(500);
    const lq = q.toLowerCase();

    const videos = mockVideos
        .filter(v => v.caption.toLowerCase().includes(lq) || v.hashtags.some(h => h.toLowerCase().includes(lq)))
        .slice(0, limit);

    const users = mockUsers
        .filter(u => u.username.toLowerCase().includes(lq) || u.fullName.toLowerCase().includes(lq))
        .slice(0, 5).map(safe);

    const hashtags = mockHashtags.filter(h => h.tag.toLowerCase().includes(lq)).slice(0, 5);

    return ok({ videos, users, hashtags, query: q });
};