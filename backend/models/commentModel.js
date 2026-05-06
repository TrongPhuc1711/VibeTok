import pool from '../config/db.js';

export const normalizeComment = (c) => {
    if (!c) return null;
    const fullName = c.ten_hien_thi || '';
    return {
        id:        String(c.id),
        videoId:   String(c.ma_video),
        userId:    String(c.ma_nguoi_dung),
        parentId:  c.ma_binh_luan_goc ? String(c.ma_binh_luan_goc) : null,
        content:   c.noi_dung,
        likes:     Number(c.luot_thich)   || 0,
        replies:   Number(c.luot_tra_loi) || 0,
        createdAt: c.ngay_tao,
        username:  c.ten_dang_nhap || 'user',
        fullName,
        initials: fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U',
        anh_dai_dien: c.anh_dai_dien || null,
        mentions: (() => {
            try {
                if (!c.mentions) return [];
                if (typeof c.mentions === 'string') return JSON.parse(c.mentions);
                return c.mentions;
            } catch { return []; }
        })(),
        isLiked: Boolean(c.isLiked),
    };
};

export const CommentModel = {
    // Lấy comments theo videoId (không phải reply)
    async getByVideoId(videoId, { page = 1, limit = 20, currentUserId = null } = {}) {
        const offset = (page - 1) * limit;

        let likeJoin = '';
        let likeSelect = ', 0 AS isLiked';
        if (currentUserId) {
            likeJoin = 'LEFT JOIN comment_likes cl ON cl.ma_binh_luan = c.id AND cl.ma_nguoi_dung = ?';
            likeSelect = ', IF(cl.id IS NOT NULL, 1, 0) AS isLiked';
        }

        const params = currentUserId
            ? [currentUserId, videoId, limit, offset]
            : [videoId, limit, offset];

        const [rows] = await pool.query(
            `SELECT c.*, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien ${likeSelect}
             FROM comments c
             LEFT JOIN users u ON c.ma_nguoi_dung = u.id
             ${likeJoin}
             WHERE c.ma_video = ? AND c.ma_binh_luan_goc IS NULL AND c.hoat_dong = 1
             ORDER BY c.ngay_tao DESC
             LIMIT ? OFFSET ?`,
            params
        );
        return rows.map(normalizeComment);
    },

    // Lấy replies theo comment gốc
    async getReplies(parentId, { page = 1, limit = 10, currentUserId = null } = {}) {
        const offset = (page - 1) * limit;

        let likeJoin = '';
        let likeSelect = ', 0 AS isLiked';
        if (currentUserId) {
            likeJoin = 'LEFT JOIN comment_likes cl ON cl.ma_binh_luan = c.id AND cl.ma_nguoi_dung = ?';
            likeSelect = ', IF(cl.id IS NOT NULL, 1, 0) AS isLiked';
        }

        const params = currentUserId
            ? [currentUserId, parentId, limit, offset]
            : [parentId, limit, offset];

        const [rows] = await pool.query(
            `SELECT c.*, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien ${likeSelect}
             FROM comments c
             LEFT JOIN users u ON c.ma_nguoi_dung = u.id
             ${likeJoin}
             WHERE c.ma_binh_luan_goc = ? AND c.hoat_dong = 1
             ORDER BY c.ngay_tao ASC
             LIMIT ? OFFSET ?`,
            params
        );

        // Count total replies
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) AS total FROM comments WHERE ma_binh_luan_goc = ? AND hoat_dong = 1',
            [parentId]
        );

        return { replies: rows.map(normalizeComment), total };
    },

    // Tạo comment
    async create({ videoId, userId, content, parentId = null, mentions = null }) {
        const mentionsJson = mentions && mentions.length > 0 ? JSON.stringify(mentions) : null;

        const [result] = await pool.query(
            'INSERT INTO comments (ma_video, ma_nguoi_dung, ma_binh_luan_goc, noi_dung, mentions) VALUES (?, ?, ?, ?, ?)',
            [videoId, userId, parentId, content, mentionsJson]
        );
        // Nếu là reply thì tăng luot_tra_loi của comment gốc
        if (parentId) {
            await pool.query(
                'UPDATE comments SET luot_tra_loi = luot_tra_loi + 1 WHERE id = ?',
                [parentId]
            );
        }
        const [rows] = await pool.query(
            `SELECT c.*, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien
             FROM comments c
             LEFT JOIN users u ON c.ma_nguoi_dung = u.id
             WHERE c.id = ?`,
            [result.insertId]
        );
        return normalizeComment(rows[0]);
    },

    // Like comment
    async likeComment(commentId, userId) {
        try {
            await pool.query(
                'INSERT INTO comment_likes (ma_binh_luan, ma_nguoi_dung) VALUES (?, ?)',
                [commentId, userId]
            );
            await pool.query(
                'UPDATE comments SET luot_thich = luot_thich + 1 WHERE id = ?',
                [commentId]
            );
            return true;
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') return false;
            throw e;
        }
    },

    // Unlike comment
    async unlikeComment(commentId, userId) {
        const [result] = await pool.query(
            'DELETE FROM comment_likes WHERE ma_binh_luan = ? AND ma_nguoi_dung = ?',
            [commentId, userId]
        );
        if (result.affectedRows > 0) {
            await pool.query(
                'UPDATE comments SET luot_thich = GREATEST(0, luot_thich - 1) WHERE id = ?',
                [commentId]
            );
        }
        return result.affectedRows > 0;
    },

    // Xóa comment
    async softDelete(commentId, userId) {
        const [result] = await pool.query(
            'UPDATE comments SET hoat_dong = 0 WHERE id = ? AND ma_nguoi_dung = ?',
            [commentId, userId]
        );
        return result.affectedRows > 0;
    },
};