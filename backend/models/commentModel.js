import pool from '../config/db.js';

export const normalizeComment = (c) => {
    if (!c) return null;
    const fullName = c.display_name || '';
    return {
        id:        String(c.id),
        videoId:   String(c.video_id),
        userId:    String(c.user_id),
        parentId:  c.parent_comment_id ? String(c.parent_comment_id) : null,
        content:   c.content,
        likes:     Number(c.likes_count)   || 0,
        replies:   Number(c.replies_count) || 0,
        createdAt: c.created_at,
        username:  c.username || 'user',
        fullName,
        initials: fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U',
        anh_dai_dien: c.avatar_url || null,
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
            likeJoin = 'LEFT JOIN comment_likes cl ON cl.comment_id = c.id AND cl.user_id = ?';
            likeSelect = ', IF(cl.id IS NOT NULL, 1, 0) AS isLiked';
        }

        const params = currentUserId
            ? [currentUserId, videoId, limit, offset]
            : [videoId, limit, offset];

        const [rows] = await pool.query(
            `SELECT c.*, u.username, u.display_name, u.avatar_url ${likeSelect}
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             ${likeJoin}
             WHERE c.video_id = ? AND c.parent_comment_id IS NULL AND c.is_active = 1
             ORDER BY c.created_at DESC
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
            likeJoin = 'LEFT JOIN comment_likes cl ON cl.comment_id = c.id AND cl.user_id = ?';
            likeSelect = ', IF(cl.id IS NOT NULL, 1, 0) AS isLiked';
        }

        const params = currentUserId
            ? [currentUserId, parentId, limit, offset]
            : [parentId, limit, offset];

        const [rows] = await pool.query(
            `SELECT c.*, u.username, u.display_name, u.avatar_url ${likeSelect}
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             ${likeJoin}
             WHERE c.parent_comment_id = ? AND c.is_active = 1
             ORDER BY c.created_at ASC
             LIMIT ? OFFSET ?`,
            params
        );

        // Count total replies
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) AS total FROM comments WHERE parent_comment_id = ? AND is_active = 1',
            [parentId]
        );

        return { replies: rows.map(normalizeComment), total };
    },

    // Tạo comment
    async create({ videoId, userId, content, parentId = null, mentions = null }) {
        const mentionsJson = mentions && mentions.length > 0 ? JSON.stringify(mentions) : null;

        const [result] = await pool.query(
            'INSERT INTO comments (video_id, user_id, parent_comment_id, content, mentions) VALUES (?, ?, ?, ?, ?)',
            [videoId, userId, parentId, content, mentionsJson]
        );
        // Nếu là reply thì tăng replies_count của comment gốc
        if (parentId) {
            await pool.query(
                'UPDATE comments SET replies_count = replies_count + 1 WHERE id = ?',
                [parentId]
            );
        }
        const [rows] = await pool.query(
            `SELECT c.*, u.username, u.display_name, u.avatar_url
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [result.insertId]
        );
        return normalizeComment(rows[0]);
    },

    // Like comment
    async likeComment(commentId, userId) {
        try {
            await pool.query(
                'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
                [commentId, userId]
            );
            await pool.query(
                'UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?',
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
            'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );
        if (result.affectedRows > 0) {
            await pool.query(
                'UPDATE comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?',
                [commentId]
            );
        }
        return result.affectedRows > 0;
    },

    // Xóa comment
    async softDelete(commentId, userId) {
        const [result] = await pool.query(
            'UPDATE comments SET is_active = 0 WHERE id = ? AND user_id = ?',
            [commentId, userId]
        );
        return result.affectedRows > 0;
    },
};