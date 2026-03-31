import { UserModel, normalizeUser } from '../models/userModel.js';
import { FollowModel }              from '../models/follow/followLikeModel.js';

// GET /api/users/:username
export const getUserProfile = async (req, res) => {
    try {
        const user = await UserModel.findByUsername(req.params.username);
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

        let isFollowing = false;
        if (req.user) {
            isFollowing = await FollowModel.isFollowing(req.user.id, user.id);
        }

        res.json({ user: { ...normalizeUser(user), isFollowing } });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy thông tin người dùng', error: e.message });
    }
};

// GET /api/users/suggestions
export const getSuggestions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const currentId = req.user?.id || 0;
        const users = await UserModel.getSuggestions(currentId, limit);

        // Lấy danh sách id mà currentUser đang follow (nếu đã đăng nhập)
        let followingSet = new Set();
        if (currentId) {
            const rows = await FollowModel.getFollowingIds(currentId);
            followingSet = new Set(rows);
        }

        const result = users.map(u => ({
            ...normalizeUser(u),
            isFollowing: followingSet.has(u.id),
        }));

        res.json({ users: result });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi gợi ý người dùng', error: e.message });
    }
};

// POST /api/users/:username/follow
export const followUser = async (req, res) => {
    try {
        const target = await UserModel.findByUsername(req.params.username);
        if (!target) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        if (target.id === req.user.id) return res.status(400).json({ message: 'Không thể follow chính mình' });

        await FollowModel.follow(req.user.id, target.id);
        const updated = await UserModel.findById(target.id);
        res.json({ message: 'Đã follow', followers: updated.so_nguoi_theo_doi });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi follow', error: e.message });
    }
};

// DELETE /api/users/:username/follow
export const unfollowUser = async (req, res) => {
    try {
        const target = await UserModel.findByUsername(req.params.username);
        if (!target) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        await FollowModel.unfollow(req.user.id, target.id);
        const updated = await UserModel.findById(target.id);
        res.json({ message: 'Đã unfollow', followers: updated.so_nguoi_theo_doi });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi unfollow', error: e.message });
    }
};

// PATCH /api/users/me
export const updateMyProfile = async (req, res) => {
    try {
        const { ten_hien_thi, tieu_su, vi_tri } = req.body;

        const updates = {};
        if (ten_hien_thi !== undefined) updates.ten_hien_thi = ten_hien_thi;
        if (tieu_su      !== undefined) updates.tieu_su      = tieu_su;
        if (vi_tri       !== undefined) updates.vi_tri        = vi_tri;

        const updated = await UserModel.updateProfile(req.user.id, updates);

        if (req.file) {
            await UserModel.updateAvatar(req.user.id, req.file.path);
        }

        const normalized = normalizeUser(updated);

        res.json({
            message: 'Cập nhật thành công',
            user: {
                ...normalized,
                username: normalized.username || normalized.ten_dang_nhap,
                fullName: normalized.fullName || normalized.ten_hien_thi,
            }
        });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi cập nhật profile', error: e.message });
    }
};