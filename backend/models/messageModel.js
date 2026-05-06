import pool from '../config/db.js';

export const MessageModel = {
    // ── Tạo tin nhắn mới ──
    async create({ senderId, receiverId, content, type = 'text' }) {
        const [result] = await pool.query(
            `INSERT INTO messages (ma_nguoi_gui, ma_nguoi_nhan, noi_dung, loai_tin) VALUES (?, ?, ?, ?)`,
            [senderId, receiverId, content, type]
        );
        const [rows] = await pool.query(
            `SELECT m.*,
                    u.ten_dang_nhap AS sender_username,
                    u.ten_hien_thi  AS sender_fullname,
                    u.anh_dai_dien  AS sender_avatar
             FROM messages m
             JOIN users u ON m.ma_nguoi_gui = u.id
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
                    u.ten_dang_nhap AS sender_username,
                    u.ten_hien_thi  AS sender_fullname,
                    u.anh_dai_dien  AS sender_avatar
             FROM messages m
             JOIN users u ON m.ma_nguoi_gui = u.id
             WHERE (m.ma_nguoi_gui = ? AND m.ma_nguoi_nhan = ?)
                OR (m.ma_nguoi_gui = ? AND m.ma_nguoi_nhan = ?)
             ORDER BY m.ngay_tao DESC
             LIMIT ? OFFSET ?`,
            [userId1, userId2, userId2, userId1, limit, offset]
        );

        // Lấy reactions cho batch tin nhắn
        const ids = rows.map(r => r.id);
        let reactionsMap = {};
        if (ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            const [rRows] = await pool.query(
                `SELECT mr.ma_tin_nhan, mr.emoji, mr.ma_nguoi_dung,
                        u.ten_dang_nhap AS username
                 FROM message_reactions mr
                 JOIN users u ON mr.ma_nguoi_dung = u.id
                 WHERE mr.ma_tin_nhan IN (${placeholders})`,
                ids
            );
            rRows.forEach(r => {
                const key = String(r.ma_tin_nhan);
                if (!reactionsMap[key]) reactionsMap[key] = [];
                reactionsMap[key].push({ emoji: r.emoji, userId: String(r.ma_nguoi_dung), username: r.username });
            });
        }

        // Đánh dấu đã đọc
        await pool.query(
            `UPDATE messages SET da_doc = 1
             WHERE ma_nguoi_nhan = ? AND ma_nguoi_gui = ? AND da_doc = 0`,
            [userId1, userId2]
        );

        return rows.map(r => normalizeMessage(r, reactionsMap[String(r.id)] || [])).reverse();
    },

    // ── Thu hồi tin nhắn ──
    async recall(messageId, senderId) {
        const [[msg]] = await pool.query(
            `SELECT id, ma_nguoi_gui, ma_nguoi_nhan FROM messages WHERE id = ?`,
            [messageId]
        );
        if (!msg) return null;
        if (String(msg.ma_nguoi_gui) !== String(senderId)) return 'forbidden';

        await pool.query(
            `UPDATE messages SET da_thu_hoi = 1 WHERE id = ?`,
            [messageId]
        );
        return { id: String(messageId), recalled: true, receiverId: String(msg.ma_nguoi_nhan) };
    },

    // ── Tìm kiếm tin nhắn trong cuộc hội thoại ──
    async search(userId1, userId2, query) {
        if (!query || query.trim().length < 1) return [];
        const keyword = `%${query.trim()}%`;
        const [rows] = await pool.query(
            `SELECT m.*,
                    u.ten_dang_nhap AS sender_username,
                    u.ten_hien_thi  AS sender_fullname,
                    u.anh_dai_dien  AS sender_avatar
             FROM messages m
             JOIN users u ON m.ma_nguoi_gui = u.id
             WHERE ((m.ma_nguoi_gui = ? AND m.ma_nguoi_nhan = ?)
                 OR (m.ma_nguoi_gui = ? AND m.ma_nguoi_nhan = ?))
               AND m.da_thu_hoi = 0
               AND m.noi_dung LIKE ?
             ORDER BY m.ngay_tao DESC
             LIMIT 50`,
            [userId1, userId2, userId2, userId1, keyword]
        );
        return rows.map(r => normalizeMessage(r)).reverse();
    },

    // ── Thêm/cập nhật reaction ──
    async addReaction(messageId, userId, emoji) {
        await pool.query(
            `INSERT INTO message_reactions (ma_tin_nhan, ma_nguoi_dung, emoji)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE emoji = VALUES(emoji), ngay_tao = CURRENT_TIMESTAMP`,
            [messageId, userId, emoji]
        );
        // Trả về tất cả reactions của tin nhắn đó
        const [rows] = await pool.query(
            `SELECT mr.emoji, mr.ma_nguoi_dung AS userId, u.ten_dang_nhap AS username
             FROM message_reactions mr
             JOIN users u ON mr.ma_nguoi_dung = u.id
             WHERE mr.ma_tin_nhan = ?`,
            [messageId]
        );
        return rows.map(r => ({ emoji: r.emoji, userId: String(r.userId), username: r.username }));
    },

    // ── Xóa reaction ──
    async removeReaction(messageId, userId) {
        await pool.query(
            `DELETE FROM message_reactions WHERE ma_tin_nhan = ? AND ma_nguoi_dung = ?`,
            [messageId, userId]
        );
        const [rows] = await pool.query(
            `SELECT mr.emoji, mr.ma_nguoi_dung AS userId, u.ten_dang_nhap AS username
             FROM message_reactions mr
             JOIN users u ON mr.ma_nguoi_dung = u.id
             WHERE mr.ma_tin_nhan = ?`,
            [messageId]
        );
        return rows.map(r => ({ emoji: r.emoji, userId: String(r.userId), username: r.username }));
    },

    // ── Lấy danh sách conversations (inbox) ──
    async getInbox(userId) {
        const [rows] = await pool.query(
            `SELECT
                partner.id               AS partner_id,
                partner.ten_dang_nhap    AS partner_username,
                partner.ten_hien_thi     AS partner_fullname,
                partner.anh_dai_dien     AS partner_avatar,
                last_msg.noi_dung        AS last_content,
                last_msg.ma_nguoi_gui    AS last_sender_id,
                last_msg.ngay_tao        AS last_time,
                last_msg.da_thu_hoi      AS last_recalled,
                (SELECT COUNT(*) FROM messages
                 WHERE ma_nguoi_nhan = ? AND ma_nguoi_gui = partner.id AND da_doc = 0) AS unread_count
             FROM (
                SELECT
                    CASE WHEN ma_nguoi_gui = ? THEN ma_nguoi_nhan ELSE ma_nguoi_gui END AS partner_id,
                    MAX(id) AS last_msg_id
                FROM messages
                WHERE ma_nguoi_gui = ? OR ma_nguoi_nhan = ?
                GROUP BY partner_id
             ) conv
             JOIN users partner ON partner.id = conv.partner_id
             JOIN messages last_msg ON last_msg.id = conv.last_msg_id
             WHERE partner.hoat_dong = 1
             ORDER BY last_msg.ngay_tao DESC`,
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
            `SELECT COUNT(*) AS total FROM messages WHERE ma_nguoi_nhan = ? AND da_doc = 0`,
            [userId]
        );
        return Number(row.total) || 0;
    },

    // ── Đánh dấu đã đọc ──
    async markRead(userId, senderId) {
        await pool.query(
            `UPDATE messages SET da_doc = 1
             WHERE ma_nguoi_nhan = ? AND ma_nguoi_gui = ? AND da_doc = 0`,
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
        senderId:   String(m.ma_nguoi_gui),
        receiverId: String(m.ma_nguoi_nhan),
        content:    m.da_thu_hoi ? null : m.noi_dung,
        recalled:   Boolean(m.da_thu_hoi),
        type:       m.loai_tin || 'text',
        read:       Boolean(m.da_doc),
        createdAt:  m.ngay_tao,
        reactions,
        sender: {
            username: m.sender_username,
            fullName: m.sender_fullname || m.sender_username,
            avatar:   m.sender_avatar,
            initials: initials(m.sender_fullname || m.sender_username),
        },
    };
}