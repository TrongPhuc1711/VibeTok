import pool from '../config/db.js';

export const MessageModel = {
    // Tạo tin nhắn mới
    async create({ senderId, receiverId, content }) {
        const [result] = await pool.query(
            `INSERT INTO messages (ma_nguoi_gui, ma_nguoi_nhan, noi_dung) VALUES (?, ?, ?)`,
            [senderId, receiverId, content]
        );
        const [rows] = await pool.query(
            `SELECT m.*, 
                    u.ten_dang_nhap as sender_username, u.ten_hien_thi as sender_fullname, u.anh_dai_dien as sender_avatar
             FROM messages m
             JOIN users u ON m.ma_nguoi_gui = u.id
             WHERE m.id = ?`,
            [result.insertId]
        );
        return rows[0] ? normalizeMessage(rows[0]) : null;
    },

    // Lấy lịch sử chat giữa 2 người
    async getConversation(userId1, userId2, { page = 1, limit = 50 } = {}) {
        const offset = (page - 1) * limit;
        const [rows] = await pool.query(
            `SELECT m.*,
                    u.ten_dang_nhap as sender_username, u.ten_hien_thi as sender_fullname, u.anh_dai_dien as sender_avatar
             FROM messages m
             JOIN users u ON m.ma_nguoi_gui = u.id
             WHERE (m.ma_nguoi_gui = ? AND m.ma_nguoi_nhan = ?)
                OR (m.ma_nguoi_gui = ? AND m.ma_nguoi_nhan = ?)
             ORDER BY m.ngay_tao DESC
             LIMIT ? OFFSET ?`,
            [userId1, userId2, userId2, userId1, limit, offset]
        );
        // Đánh dấu đã đọc
        await pool.query(
            `UPDATE messages SET da_doc = 1 
             WHERE ma_nguoi_nhan = ? AND ma_nguoi_gui = ? AND da_doc = 0`,
            [userId1, userId2]
        );
        return rows.map(normalizeMessage).reverse();
    },

    // Lấy danh sách conversations (inbox)
    async getInbox(userId) {
        const [rows] = await pool.query(
            `SELECT 
                partner.id as partner_id,
                partner.ten_dang_nhap as partner_username,
                partner.ten_hien_thi as partner_fullname,
                partner.anh_dai_dien as partner_avatar,
                last_msg.noi_dung as last_content,
                last_msg.ma_nguoi_gui as last_sender_id,
                last_msg.ngay_tao as last_time,
                (SELECT COUNT(*) FROM messages 
                 WHERE ma_nguoi_nhan = ? AND ma_nguoi_gui = partner.id AND da_doc = 0) as unread_count
             FROM (
                SELECT 
                    CASE WHEN ma_nguoi_gui = ? THEN ma_nguoi_nhan ELSE ma_nguoi_gui END as partner_id,
                    MAX(id) as last_msg_id
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
            partnerId: String(r.partner_id),
            partnerUsername: r.partner_username,
            partnerFullname: r.partner_fullname || r.partner_username,
            partnerAvatar: r.partner_avatar,
            partnerInitials: (r.partner_fullname || r.partner_username || 'U')
                .trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U',
            lastContent: r.last_content,
            lastSenderId: String(r.last_sender_id),
            lastTime: r.last_time,
            unreadCount: Number(r.unread_count) || 0,
        }));
    },

    // Đếm tổng tin chưa đọc
    async countUnread(userId) {
        const [[row]] = await pool.query(
            `SELECT COUNT(*) as total FROM messages WHERE ma_nguoi_nhan = ? AND da_doc = 0`,
            [userId]
        );
        return Number(row.total) || 0;
    },

    // Đánh dấu đã đọc
    async markRead(userId, senderId) {
        await pool.query(
            `UPDATE messages SET da_doc = 1 WHERE ma_nguoi_nhan = ? AND ma_nguoi_gui = ? AND da_doc = 0`,
            [userId, senderId]
        );
    },
};

function normalizeMessage(m) {
    return {
        id: String(m.id),
        senderId: String(m.ma_nguoi_gui),
        receiverId: String(m.ma_nguoi_nhan),
        content: m.noi_dung,
        read: Boolean(m.da_doc),
        createdAt: m.ngay_tao,
        sender: {
            username: m.sender_username,
            fullName: m.sender_fullname || m.sender_username,
            avatar: m.sender_avatar,
            initials: (m.sender_fullname || m.sender_username || 'U')
                .trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U',
        },
    };
}