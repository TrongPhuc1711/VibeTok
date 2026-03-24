import { delay, ok, fail, mockVideos, mockUsers, mockComments } from './mockData';
import { getStoredUser } from '../utils/helpers';
import { FEED_PAGE_SIZE } from '../utils/constants';

const withUser = v => ({ ...v, user: mockUsers.find(u => u.id === v.userId) });

/* GET /api/videos/feed */
export const getFeed = async ({ type = 'forYou', page = 1, limit = FEED_PAGE_SIZE } = {}) => {
    await delay(600);
    const start = (page - 1) * limit;
    const videos = mockVideos.slice(start, start + limit).map(withUser);
    return ok({ videos, hasMore: start + limit < mockVideos.length, page, total: mockVideos.length });
};

/* GET /api/videos/:id */
export const getVideoById = async (id) => {
    await delay(400);
    const v = mockVideos.find(v => v.id === id);
    if (!v) fail(404, 'Video không tồn tại');
    return ok({ video: withUser(v) });
};

/* GET /api/videos/:id/comments */
export const getComments = async (videoId, { page = 1, limit = 20 } = {}) => {
    await delay(500);
    const all = mockComments.filter(c => c.videoId === videoId);
    const start = (page - 1) * limit;
    return ok({ comments: all.slice(start, start + limit), total: all.length, hasMore: start + limit < all.length });
};

/* POST /api/videos/:id/comments */
export const postComment = async (videoId, { content }) => {
    await delay(400);
    const user = getStoredUser();
    if (!user) fail(401, 'Vui lòng đăng nhập để bình luận');

    const comment = {
        id: `c_${Date.now()}`, videoId, userId: user.id,
        username: user.fullName, initials: user.initials,
        content, likes: 0, replies: 0,
        createdAt: new Date().toISOString(),
    };
    mockComments.unshift(comment);
    return ok({ comment });
};

/* POST /api/videos/:id/like */
export const likeVideo = async (videoId) => {
    await delay(200);
    const v = mockVideos.find(v => v.id === videoId);
    if (!v) fail(404, 'Video không tồn tại');
    v.likes += 1;
    return ok({ likes: v.likes, liked: true });
};

/* DELETE /api/videos/:id/like */
export const unlikeVideo = async (videoId) => {
    await delay(200);
    const v = mockVideos.find(v => v.id === videoId);
    if (!v) fail(404, 'Video không tồn tại');
    v.likes = Math.max(0, v.likes - 1);
    return ok({ likes: v.likes, liked: false });
};

/* POST /api/videos/upload */
export const uploadVideo = async (formData) => {
    await delay(2000);
    const user = getStoredUser();
    if (!user) fail(401, 'Vui lòng đăng nhập');

    const video = {
        id: `v_${Date.now()}`, userId: user.id,
        caption: formData.caption || '',
        hashtags: (formData.caption || '').match(/#[\w]+/g) || [],
        duration: 0, likes: 0, comments: 0, shares: 0, bookmarks: 0, views: 0,
        music: formData.music || null, location: formData.location || '',
        privacy: formData.privacy || 'public',
        allowDuet: formData.allowDuet ?? true,
        allowStitch: formData.allowStitch ?? true,
        isDraft: formData.isDraft || false,
        createdAt: new Date().toISOString(),
    };
    mockVideos.unshift(video);
    return ok({ video: withUser(video) });
};

/* GET /api/videos/search */
export const searchVideos = async ({ q = '', category = 'all', page = 1, limit = 10 } = {}) => {
    await delay(500);
    let results = mockVideos;
    if (q) {
        const lq = q.toLowerCase();
        results = results.filter(v =>
            v.caption.toLowerCase().includes(lq) ||
            v.hashtags.some(h => h.toLowerCase().includes(lq))
        );
    }
    if (category && category !== 'all') results = results.filter(v => v.category === category);
    const start = (page - 1) * limit;
    return ok({ videos: results.slice(start, start + limit).map(withUser), total: results.length });
};