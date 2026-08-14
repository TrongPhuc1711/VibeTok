import db from '../config/db.js'

export const NotificationModel = {
    // 1. Lấy danh sách thông báo của 1 user (có phân trang và join lấy thông tin người gửi)
    getNotifications: async (userId, limit = 20, offset = 0) => {
        const query = `
            SELECT 
                    n.id, n.notification_type as type, n.is_read as \`read\`, n.created_at as createdAt,
                    n.video_id as videoId, n.comment_id as commentId,
                    u.id as actorId, u.username as username, u.display_name as fullName, u.avatar_url,
                    v.thumbnail_url as videoThumb
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            LEFT JOIN videos v ON n.video_id = v.id
            WHERE n.receiver_id = ?
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.execute(query, [userId, limit.toString(), offset.toString()]);
        return rows;
    },

    // 2. Tạo thông báo mới
    create: async (receiverId, senderId, type, videoId = null, commentId = null) => {
        // Không gửi thông báo cho chính mình (ngoại trừ báo cáo video để admin có thể tự thử nghiệm)
        if (receiverId === senderId && type !== 'video_report') return null;

        const query = `
            INSERT INTO notifications (receiver_id, sender_id, notification_type, video_id, comment_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [receiverId, senderId, type, videoId, commentId]);
        return result.insertId;
    },

    // 3. Đánh dấu 1 thông báo là đã đọc
    markAsRead: async (notificationId, userId) => {
        const query = `UPDATE notifications SET is_read = 1 WHERE id = ? AND receiver_id = ?`;
        const [result] = await db.execute(query, [notificationId, userId]);
        return result.affectedRows > 0;
    },

    // 4. Đánh dấu tất cả là đã đọc
    markAllAsRead: async (userId) => {
        const query = `UPDATE notifications SET is_read = 1 WHERE receiver_id = ? AND is_read = 0`;
        const [result] = await db.execute(query, [userId]);
        return result.affectedRows;
    }
};
