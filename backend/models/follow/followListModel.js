import pool from "../../config/db.js";

export const FollowListModel = {

    // Lấy danh sách người follow user này
    // hideAdmins: true nếu người xem không phải admin
    async getFollowers(userId, { page = 1, limit = 20 } = {}, hideAdmins = true) {
        const offset = (page - 1) * limit;
        const adminFilter = hideAdmins ? "AND u.vai_tro != 'admin'" : '';

        const [rows] = await pool.query(
            `SELECT u.id, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien,
                    u.so_nguoi_theo_doi, u.vai_tro
             FROM follows f
             JOIN users u ON f.ma_nguoi_theo_doi = u.id
             WHERE f.ma_nguoi_duoc_theo_doi = ? AND u.hoat_dong = 1 ${adminFilter}
             ORDER BY f.ngay_tao DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM follows f
             JOIN users u ON f.ma_nguoi_theo_doi = u.id
             WHERE f.ma_nguoi_duoc_theo_doi = ? AND u.hoat_dong = 1 ${adminFilter}`,
            [userId]
        );

        return { rows, total };
    },

    // Lấy danh sách user này đang follow
    async getFollowing(userId, { page = 1, limit = 20 } = {}, hideAdmins = true) {
        const offset = (page - 1) * limit;
        const adminFilter = hideAdmins ? "AND u.vai_tro != 'admin'" : '';

        const [rows] = await pool.query(
            `SELECT u.id, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien,
                    u.so_nguoi_theo_doi, u.vai_tro
             FROM follows f
             JOIN users u ON f.ma_nguoi_duoc_theo_doi = u.id
             WHERE f.ma_nguoi_theo_doi = ? AND u.hoat_dong = 1 ${adminFilter}
             ORDER BY f.ngay_tao DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM follows f
             JOIN users u ON f.ma_nguoi_duoc_theo_doi = u.id
             WHERE f.ma_nguoi_theo_doi = ? AND u.hoat_dong = 1 ${adminFilter}`,
            [userId]
        );

        return { rows, total };
    },

    // Lấy danh sách bạn bè (mutual follow)
    async getFriends(userId, { page = 1, limit = 20 } = {}, hideAdmins = true) {
        const offset = (page - 1) * limit;
        const adminFilter = hideAdmins ? "AND u.vai_tro != 'admin'" : '';

        const [rows] = await pool.query(
            `SELECT u.id, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien,
                    u.so_nguoi_theo_doi, u.vai_tro
             FROM follows f1
             JOIN follows f2 ON f1.ma_nguoi_duoc_theo_doi = f2.ma_nguoi_theo_doi 
                             AND f1.ma_nguoi_theo_doi = f2.ma_nguoi_duoc_theo_doi
             JOIN users u ON f1.ma_nguoi_duoc_theo_doi = u.id
             WHERE f1.ma_nguoi_theo_doi = ? AND u.hoat_dong = 1 ${adminFilter}
             ORDER BY f1.ngay_tao DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM follows f1
             JOIN follows f2 ON f1.ma_nguoi_duoc_theo_doi = f2.ma_nguoi_theo_doi 
                             AND f1.ma_nguoi_theo_doi = f2.ma_nguoi_duoc_theo_doi
             JOIN users u ON f1.ma_nguoi_duoc_theo_doi = u.id
             WHERE f1.ma_nguoi_theo_doi = ? AND u.hoat_dong = 1 ${adminFilter}`,
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

    // Lấy tập hợp id đang follow currentUser (dùng để check isMutual)
    async getMyFollowersSet(currentUserId) {
        if (!currentUserId) return new Set();
        const [rows] = await pool.query(
            'SELECT ma_nguoi_theo_doi FROM follows WHERE ma_nguoi_duoc_theo_doi = ?',
            [currentUserId]
        );
        return new Set(rows.map(r => r.ma_nguoi_theo_doi));
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