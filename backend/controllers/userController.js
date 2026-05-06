import { UserModel, normalizeUser } from '../models/userModel.js';
import { FollowModel } from '../models/follow/followLikeModel.js';
import pool from '../config/db.js';

// GET /api/users/:username
export const getUserProfile = async (req, res) => {
    try {
        const user = await UserModel.findByUsername(req.params.username);
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

        // Ẩn profile admin khỏi user thường và khách chưa đăng nhập
        const currentUserRole = req.user?.vai_tro || null;
        if (user.vai_tro === 'admin' && currentUserRole !== 'admin') {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

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
        const currentUserRole = req.user?.vai_tro || null;

        // Truyền role để lọc admin nếu cần
        const users = await UserModel.getSuggestions(currentId, limit, currentUserRole);

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

// GET /api/users/search?q=&limit=10
export const searchUsers = async (req, res) => {
    try {
        const { q = '', limit = 10 } = req.query;
        if (!q.trim()) return res.json({ users: [] });

        const currentUserRole = req.user?.vai_tro ?? null;
        const rows = await UserModel.search(
            q.trim(),
            Math.min(50, parseInt(limit) || 10),
            currentUserRole
        );
        const users = rows.map(u => normalizeUser(u));
        res.json({ users });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tìm kiếm người dùng', error: e.message });
    }
};

// POST /api/users/:username/follow
export const followUser = async (req, res) => {
    try {
        const target = await UserModel.findByUsername(req.params.username);
        if (!target) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        if (target.id === req.user.id) return res.status(400).json({ message: 'Không thể follow chính mình' });

        // Không cho phép follow admin (nếu người dùng hiện tại không phải admin)
        if (target.vai_tro === 'admin' && req.user.vai_tro !== 'admin') {
            return res.status(403).json({ message: 'Không thể follow người dùng này' });
        }

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
        if (tieu_su !== undefined) updates.tieu_su = tieu_su;
        if (vi_tri !== undefined) updates.vi_tri = vi_tri;

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

// GET /api/users/mention-search?q= — Tìm user để @mention (chỉ hiển thị người đang follow / bạn bè)
export const searchMentionUsers = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const limit = Math.min(20, parseInt(req.query.limit) || 10);
        const currentUserId = req.user.id;

        const like = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;

        // Tìm trong danh sách đang follow trước, check xem có mutual không (Bạn bè)
        const [followingRows] = await pool.query(
            `SELECT u.id, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien,
                    (SELECT 1 FROM follows f2 WHERE f2.ma_nguoi_theo_doi = u.id AND f2.ma_nguoi_duoc_theo_doi = ?) AS is_mutual
             FROM follows f
             JOIN users u ON f.ma_nguoi_duoc_theo_doi = u.id
             WHERE f.ma_nguoi_theo_doi = ?
               AND u.hoat_dong = 1
               AND u.vai_tro != 'admin'
               AND (u.ten_dang_nhap LIKE ? OR u.ten_hien_thi LIKE ?)
             ORDER BY is_mutual DESC, u.ten_dang_nhap ASC
             LIMIT ?`,
            [currentUserId, currentUserId, like, like, limit]
        );

        const formatUser = (u) => ({
            id: String(u.id),
            username: u.ten_dang_nhap,
            fullName: u.ten_hien_thi || '',
            anh_dai_dien: u.anh_dai_dien || null,
            isFollowing: true,
            isMutual: Boolean(u.is_mutual)
        });

        const users = followingRows.map(formatUser);

        res.json({ users });
    } catch (e) {
        console.error('searchMentionUsers error:', e);
        res.status(500).json({ message: 'Lỗi tìm kiếm người dùng', error: e.message });
    }
};