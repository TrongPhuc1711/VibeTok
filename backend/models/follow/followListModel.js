import pool from "../../config/db.js";

export const FollowListModel = {

    // Lấy danh sách người follow user này
    // hideAdmins: true nếu người xem không phải admin
    async getFollowers(userId, { page = 1, limit = 20 } = {}, hideAdmins = true) {
        const offset = (page - 1) * limit;
        const adminFilter = hideAdmins ? "AND u.role != 'admin'" : '';

        const [rows] = await pool.query(
            `SELECT u.id, u.username, u.display_name, u.avatar_url,
                    u.followers, u.role
             FROM follows f
             JOIN users u ON f.follower_id = u.id
             WHERE f.following_id = ? AND u.is_active = 1 ${adminFilter}
             ORDER BY f.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM follows f
             JOIN users u ON f.follower_id = u.id
             WHERE f.following_id = ? AND u.is_active = 1 ${adminFilter}`,
            [userId]
        );

        return { rows, total };
    },

    // Lấy danh sách user này đang follow
    async getFollowing(userId, { page = 1, limit = 20 } = {}, hideAdmins = true) {
        const offset = (page - 1) * limit;
        const adminFilter = hideAdmins ? "AND u.role != 'admin'" : '';

        const [rows] = await pool.query(
            `SELECT u.id, u.username, u.display_name, u.avatar_url,
                    u.followers, u.role
             FROM follows f
             JOIN users u ON f.following_id = u.id
             WHERE f.follower_id = ? AND u.is_active = 1 ${adminFilter}
             ORDER BY f.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM follows f
             JOIN users u ON f.following_id = u.id
             WHERE f.follower_id = ? AND u.is_active = 1 ${adminFilter}`,
            [userId]
        );

        return { rows, total };
    },

    // Lấy danh sách bạn bè (mutual follow)
    async getFriends(userId, { page = 1, limit = 20 } = {}, hideAdmins = true) {
        const offset = (page - 1) * limit;
        const adminFilter = hideAdmins ? "AND u.role != 'admin'" : '';

        const [rows] = await pool.query(
            `SELECT u.id, u.username, u.display_name, u.avatar_url,
                    u.followers, u.role
             FROM follows f1
             JOIN follows f2 ON f1.following_id = f2.follower_id 
                             AND f1.follower_id = f2.following_id
             JOIN users u ON f1.following_id = u.id
             WHERE f1.follower_id = ? AND u.is_active = 1 ${adminFilter}
             ORDER BY f1.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM follows f1
             JOIN follows f2 ON f1.following_id = f2.follower_id 
                             AND f1.follower_id = f2.following_id
             JOIN users u ON f1.following_id = u.id
             WHERE f1.follower_id = ? AND u.is_active = 1 ${adminFilter}`,
            [userId]
        );

        return { rows, total };
    },

    // Lấy tập hợp id mà currentUser đang follow (dùng để check isFollowing)
    async getMyFollowingSet(currentUserId) {
        if (!currentUserId) return new Set();
        const [rows] = await pool.query(
            'SELECT following_id FROM follows WHERE follower_id = ?',
            [currentUserId]
        );
        return new Set(rows.map(r => r.following_id));
    },

    // Lấy tập hợp id đang follow currentUser (dùng để check isMutual)
    async getMyFollowersSet(currentUserId) {
        if (!currentUserId) return new Set();
        const [rows] = await pool.query(
            'SELECT follower_id FROM follows WHERE following_id = ?',
            [currentUserId]
        );
        return new Set(rows.map(r => r.follower_id));
    },

    // Tìm user theo username, trả về id
    async findUserIdByUsername(username) {
        const [rows] = await pool.query(
            'SELECT id FROM users WHERE username = ? AND is_active = 1',
            [username]
        );
        return rows[0]?.id ?? null;
    },
};