import { delay, ok, fail, mockUsers, mockVideos } from './mockData';
import { getStoredUser, setStoredUser } from '../utils/helpers';

const safe = ({ password: _, ...u }) => u;

/* GET /api/users/:username */
export const getUserProfile = async (username) => {
    await delay(500);
    const user = mockUsers.find(u => u.username === username.replace('@', ''));
    if (!user) fail(404, 'Người dùng không tồn tại');
    return ok({ user: safe(user) });
};

/* GET /api/users/:username/videos */
export const getUserVideos = async (username, { page = 1, limit = 10 } = {}) => {
    await delay(400);
    const user = mockUsers.find(u => u.username === username.replace('@', ''));
    if (!user) fail(404, 'Người dùng không tồn tại');
    const all = mockVideos.filter(v => v.userId === user.id);
    const start = (page - 1) * limit;
    return ok({ videos: all.slice(start, start + limit), total: all.length, hasMore: start + limit < all.length });
};

/* POST /api/users/:username/follow */
export const followUser = async (username) => {
    await delay(300);
    const user = mockUsers.find(u => u.username === username.replace('@', ''));
    if (!user) fail(404, 'Người dùng không tồn tại');
    user.followers += 1;
    return ok({ followers: user.followers, following: true });
};

/* DELETE /api/users/:username/follow */
export const unfollowUser = async (username) => {
    await delay(300);
    const user = mockUsers.find(u => u.username === username.replace('@', ''));
    if (!user) fail(404, 'Người dùng không tồn tại');
    user.followers = Math.max(0, user.followers - 1);
    return ok({ followers: user.followers, following: false });
};

/* PATCH /api/users/me */
export const updateProfile = async (updates) => {
    await delay(700);
    const current = getStoredUser();
    if (!current) fail(401, 'Chưa đăng nhập');
    const idx = mockUsers.findIndex(u => u.id === current.id);
    if (idx === -1) fail(404, 'Người dùng không tồn tại');
    mockUsers[idx] = { ...mockUsers[idx], ...updates };
    const updated = safe(mockUsers[idx]);
    setStoredUser(updated);
    return ok({ user: updated });
};

/* GET /api/users/suggestions */
export const getSuggestedUsers = async ({ limit = 5 } = {}) => {
    await delay(400);
    const me = getStoredUser();
    const suggestions = mockUsers
        .filter(u => u.id !== me?.id)
        .slice(0, limit)
        .map(safe);
    return ok({ users: suggestions });
};