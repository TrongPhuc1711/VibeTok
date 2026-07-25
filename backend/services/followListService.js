import { FollowListModel } from "../models/follow/followListModel.js";

// Chuẩn hoá một user row thành object trả về frontend
const normalizeUser = (u, followingSet, followersSet) => ({
    id: String(u.id),
    username: u.username,
    fullName: u.display_name || '',
    anh_dai_dien: u.avatar_url || null,
    followers: Number(u.followers) || 0,
    isCreator: u.role === 'creator' || u.role === 'admin',
    isFollowing: followingSet.has(u.id),
    isMutual: followingSet.has(u.id) && followersSet.has(u.id),
    initials: (u.display_name || '')
        .trim()
        .split(/\s+/)
        .map(w => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('') || 'U',
});

export const FollowListService = {

    async getFollowers(username, { page, limit, currentUserId, currentUserRole }) {
        const userId = await FollowListModel.findUserIdByUsername(username);
        if (!userId) return null; // caller xử lý 404

        // Ẩn admin khỏi danh sách nếu người xem không phải admin
        const hideAdmins = currentUserRole !== 'admin';

        const [{ rows, total }, followingSet, followersSet] = await Promise.all([
            FollowListModel.getFollowers(userId, { page, limit }, hideAdmins),
            FollowListModel.getMyFollowingSet(currentUserId),
            FollowListModel.getMyFollowersSet(currentUserId),
        ]);

        return {
            users: rows.map(u => normalizeUser(u, followingSet, followersSet)),
            total,
            hasMore: (page - 1) * limit + rows.length < total,
        };
    },

    async getFollowing(username, { page, limit, currentUserId, currentUserRole }) {
        const userId = await FollowListModel.findUserIdByUsername(username);
        if (!userId) return null;

        // Ẩn admin khỏi danh sách nếu người xem không phải admin
        const hideAdmins = currentUserRole !== 'admin';

        const [{ rows, total }, followingSet, followersSet] = await Promise.all([
            FollowListModel.getFollowing(userId, { page, limit }, hideAdmins),
            FollowListModel.getMyFollowingSet(currentUserId),
            FollowListModel.getMyFollowersSet(currentUserId),
        ]);

        return {
            users: rows.map(u => normalizeUser(u, followingSet, followersSet)),
            total,
            hasMore: (page - 1) * limit + rows.length < total,
        };
    },

    async getFriends(username, { page, limit, currentUserId, currentUserRole }) {
        const userId = await FollowListModel.findUserIdByUsername(username);
        if (!userId) return null;

        // Ẩn admin khỏi danh sách nếu người xem không phải admin
        const hideAdmins = currentUserRole !== 'admin';

        const [{ rows, total }, followingSet, followersSet] = await Promise.all([
            FollowListModel.getFriends(userId, { page, limit }, hideAdmins),
            FollowListModel.getMyFollowingSet(currentUserId),
            FollowListModel.getMyFollowersSet(currentUserId),
        ]);

        return {
            users: rows.map(u => normalizeUser(u, followingSet, followersSet)),
            total,
            hasMore: (page - 1) * limit + rows.length < total,
        };
    },
};