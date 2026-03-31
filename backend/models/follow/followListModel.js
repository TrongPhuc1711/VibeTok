import pool from "../../config/db";

export const FollowListModel = {

    // Lấy danh sách người follow user này
    async getFollowers(userId, { page = 1, limit = 20 } = {}) {
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(
            `SELECT u.id, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien,
                    u.so_nguoi_theo_doi, u.vai_tro
             FROM follows f
             JOIN users u ON f.ma_nguoi_theo_doi = u.id
             WHERE f.ma_nguoi_duoc_theo_doi = ? AND u.hoat_dong = 1
             ORDER BY f.ngay_tao DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM follows f
             JOIN users u ON f.ma_nguoi_theo_doi = u.id
             WHERE f.ma_nguoi_duoc_theo_doi = ? AND u.hoat_dong = 1`,
            [userId]
        );

        return { rows, total };
    },

    // Lấy danh sách user này đang follow
    async getFollowing(userId, { page = 1, limit = 20 } = {}) {
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(
            `SELECT u.id, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien,
                    u.so_nguoi_theo_doi, u.vai_tro
             FROM follows f
             JOIN users u ON f.ma_nguoi_duoc_theo_doi = u.id
             WHERE f.ma_nguoi_theo_doi = ? AND u.hoat_dong = 1
             ORDER BY f.ngay_tao DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM follows f
             JOIN users u ON f.ma_nguoi_duoc_theo_doi = u.id
             WHERE f.ma_nguoi_theo_doi = ? AND u.hoat_dong = 1`,
            [userId]
        );

        return { rows, total };
    },

    // Lấy tập hợp id mà currentUser đang follow (dùng để check isFollowing)
    async getMyFollowingSet(currentUserId) {
        if (!currentUserId) return new Set();
        const [rows] = await pool.query(
            'SELECT ma_nguoi_duoc_theo_doi FROM follows WHERE ma_nguoi_theo_doi = ?',
            [currentUserId]
        );
        return new Set(rows.map(r => r.ma_nguoi_duoc_theo_doi));
    },

    // Tìm user theo username, trả về id
    async findUserIdByUsername(username) {
        const [rows] = await pool.query(
            'SELECT id FROM users WHERE ten_dang_nhap = ? AND hoat_dong = 1',
            [username]
        );
        return rows[0]?.id ?? null;
    },
};