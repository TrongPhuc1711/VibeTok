import { FollowListModel } from "../models/follow/followListModel";

// Chuẩn hoá một user row thành object trả về frontend
const normalizeUser = (u, followingSet) => ({
    id:           String(u.id),
    username:     u.ten_dang_nhap,
    fullName:     u.ten_hien_thi || '',
    anh_dai_dien: u.anh_dai_dien || null,
    followers:    Number(u.so_nguoi_theo_doi) || 0,
    isCreator:    u.vai_tro === 'creator' || u.vai_tro === 'admin',
    isFollowing:  followingSet.has(u.id),
    initials:     (u.ten_hien_thi || '')
                    .trim()
                    .split(/\s+/)
                    .map(w => w[0]?.toUpperCase() ?? '')
                    .slice(0, 2)
                    .join('') || 'U',
});

export const FollowListService = {

    async getFollowers(username, { page, limit, currentUserId }) {
        const userId = await FollowListModel.findUserIdByUsername(username);
        if (!userId) return null; // caller xử lý 404

        const [{ rows, total }, followingSet] = await Promise.all([
            FollowListModel.getFollowers(userId, { page, limit }),
            FollowListModel.getMyFollowingSet(currentUserId),
        ]);

        return {
            users:   rows.map(u => normalizeUser(u, followingSet)),
            total,
            hasMore: (page - 1) * limit + rows.length < total,
        };
    },

    async getFollowing(username, { page, limit, currentUserId }) {
        const userId = await FollowListModel.findUserIdByUsername(username);
        if (!userId) return null;

        const [{ rows, total }, followingSet] = await Promise.all([
            FollowListModel.getFollowing(userId, { page, limit }),
            FollowListModel.getMyFollowingSet(currentUserId),
        ]);

        return {
            users:   rows.map(u => normalizeUser(u, followingSet)),
            total,
            hasMore: (page - 1) * limit + rows.length < total,
        };
    },
};