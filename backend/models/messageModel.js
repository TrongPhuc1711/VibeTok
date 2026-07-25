import pool from '../config/db.js';

export const MessageModel = {
    // ── Tạo tin nhắn mới ──
    async create({ senderId, receiverId, content, type = 'text' }) {
        const [result] = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?)`,
            [senderId, receiverId, content, type]
        );
        const [rows] = await pool.query(
            `SELECT m.*,
                    u.username AS sender_username,
                    u.display_name  AS sender_fullname,
                    u.avatar_url  AS sender_avatar
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.id = ?`,
            [result.insertId]
        );
        return rows[0] ? normalizeMessage(rows[0]) : null;
    },

    // ── Lấy lịch sử chat giữa 2 người (có phân trang) ──
    async getConversation(userId1, userId2, { page = 1, limit = 50 } = {}) {
        const offset = (page - 1) * limit;
        const [rows] = await pool.query(
            `SELECT m.*,
                    u.username AS sender_username,
                    u.display_name  AS sender_fullname,
                    u.avatar_url  AS sender_avatar
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE (m.sender_id = ? AND m.receiver_id = ?)
                OR (m.sender_id = ? AND m.receiver_id = ?)
             ORDER BY m.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId1, userId2, userId2, userId1, limit, offset]
        );

        // Lấy reactions cho batch tin nhắn
        const ids = rows.map(r => r.id);
        let reactionsMap = {};
        if (ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            const [rRows] = await pool.query(
                `SELECT mr.message_id, mr.emoji, mr.user_id,
                        u.username AS username
                 FROM message_reactions mr
                 JOIN users u ON mr.user_id = u.id
                 WHERE mr.message_id IN (${placeholders})`,
                ids
            );
            rRows.forEach(r => {
                const key = String(r.message_id);
                if (!reactionsMap[key]) reactionsMap[key] = [];
                reactionsMap[key].push({ emoji: r.emoji, userId: String(r.user_id), username: r.username });
            });
        }

        // Đánh dấu đã đọc
        await pool.query(
            `UPDATE messages SET is_read = 1
             WHERE receiver_id = ? AND sender_id = ? AND is_read = 0`,
            [userId1, userId2]
        );

        return rows.map(r => normalizeMessage(r, reactionsMap[String(r.id)] || [])).reverse();
    },

    // ── Thu hồi tin nhắn ──
    async recall(messageId, senderId) {
        const [[msg]] = await pool.query(
            `SELECT id, sender_id, receiver_id FROM messages WHERE id = ?`,
            [messageId]
        );
        if (!msg) return null;
        if (String(msg.sender_id) !== String(senderId)) return 'forbidden';

        await pool.query(
            `UPDATE messages SET is_recalled = 1 WHERE id = ?`,
            [messageId]
        );
        return { id: String(messageId), recalled: true, receiverId: String(msg.receiver_id) };
    },

    // ── Tìm kiếm tin nhắn trong cuộc hội thoại ──
    async search(userId1, userId2, query) {
        if (!query || query.trim().length < 1) return [];
        const keyword = `%${query.trim()}%`;
        const [rows] = await pool.query(
            `SELECT m.*,
                    u.username AS sender_username,
                    u.display_name  AS sender_fullname,
                    u.avatar_url  AS sender_avatar
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE ((m.sender_id = ? AND m.receiver_id = ?)
                 OR (m.sender_id = ? AND m.receiver_id = ?))
               AND m.is_recalled = 0
               AND m.content LIKE ?
             ORDER BY m.created_at DESC
             LIMIT 50`,
            [userId1, userId2, userId2, userId1, keyword]
        );
        return rows.map(r => normalizeMessage(r)).reverse();
    },

    // ── Thêm/cập nhật reaction ──
    async addReaction(messageId, userId, emoji) {
        await pool.query(
            `INSERT INTO message_reactions (message_id, user_id, emoji)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE emoji = VALUES(emoji), created_at = CURRENT_TIMESTAMP`,
            [messageId, userId, emoji]
        );
        // Trả về tất cả reactions của tin nhắn đó
        const [rows] = await pool.query(
            `SELECT mr.emoji, mr.user_id AS userId, u.username AS username
             FROM message_reactions mr
             JOIN users u ON mr.user_id = u.id
             WHERE mr.message_id = ?`,
            [messageId]
        );
        return rows.map(r => ({ emoji: r.emoji, userId: String(r.userId), username: r.username }));
    },

    // ── Xóa reaction ──
    async removeReaction(messageId, userId) {
        await pool.query(
            `DELETE FROM message_reactions WHERE message_id = ? AND user_id = ?`,
            [messageId, userId]
        );
        const [rows] = await pool.query(
            `SELECT mr.emoji, mr.user_id AS userId, u.username AS username
             FROM message_reactions mr
             JOIN users u ON mr.user_id = u.id
             WHERE mr.message_id = ?`,
            [messageId]
        );
        return rows.map(r => ({ emoji: r.emoji, userId: String(r.userId), username: r.username }));
    },

    // ── Lấy danh sách conversations (inbox) ──
    async getInbox(userId) {
        const [rows] = await pool.query(
            `SELECT
                partner.id               AS partner_id,
                partner.username    AS partner_username,
                partner.display_name     AS partner_fullname,
                partner.avatar_url     AS partner_avatar,
                last_msg.content        AS last_content,
                last_msg.sender_id    AS last_sender_id,
                last_msg.created_at        AS last_time,
                last_msg.is_recalled      AS last_recalled,
                (SELECT COUNT(*) FROM messages
                 WHERE receiver_id = ? AND sender_id = partner.id AND is_read = 0) AS unread_count
             FROM (
                SELECT
                    CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partner_id,
                    MAX(id) AS last_msg_id
                FROM messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY partner_id
             ) conv
             JOIN users partner ON partner.id = conv.partner_id
             JOIN messages last_msg ON last_msg.id = conv.last_msg_id
             WHERE partner.is_active = 1
             ORDER BY last_msg.created_at DESC`,
            [userId, userId, userId, userId]
        );
        return rows.map(r => ({
            partnerId:       String(r.partner_id),
            partnerUsername: r.partner_username,
            partnerFullname: r.partner_fullname || r.partner_username,
            partnerAvatar:   r.partner_avatar,
            partnerInitials: initials(r.partner_fullname || r.partner_username),
            lastContent:     r.last_recalled ? null : r.last_content,
            lastRecalled:    Boolean(r.last_recalled),
            lastSenderId:    String(r.last_sender_id),
            lastTime:        r.last_time,
            unreadCount:     Number(r.unread_count) || 0,
        }));
    },

    // ── Đếm tổng tin chưa đọc ──
    async countUnread(userId) {
        const [[row]] = await pool.query(
            `SELECT COUNT(*) AS total FROM messages WHERE receiver_id = ? AND is_read = 0`,
            [userId]
        );
        return Number(row.total) || 0;
    },

    // ── Đánh dấu đã đọc ──
    async markRead(userId, senderId) {
        await pool.query(
            `UPDATE messages SET is_read = 1
             WHERE receiver_id = ? AND sender_id = ? AND is_read = 0`,
            [userId, senderId]
        );
    },
};

// ── Helpers ──

function initials(name) {
    return (name || 'U')
        .trim().split(/\s+/)
        .map(w => w[0]?.toUpperCase() ?? '')
        .slice(0, 2).join('') || 'U';
}

function normalizeMessage(m, reactions = []) {
    return {
        id:         String(m.id),
        senderId:   String(m.sender_id),
        receiverId: String(m.receiver_id),
        content:    m.is_recalled ? null : m.content,
        recalled:   Boolean(m.is_recalled),
        type:       m.message_type || 'text',
        read:       Boolean(m.is_read),
        createdAt:  m.created_at,
        reactions,
        sender: {
            username: m.sender_username,
            fullName: m.sender_fullname || m.sender_username,
            avatar:   m.sender_avatar,
            initials: initials(m.sender_fullname || m.sender_username),
        },
    };
}