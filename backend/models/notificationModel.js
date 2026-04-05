import db from '../config/db.js'

export const NotificationModel = {
    // 1. Lấy danh sách thông báo của 1 user (có phân trang và join lấy thông tin người gửi)
    getNotifications: async (userId, limit = 20, offset = 0) => {
        const query = `
            SELECT 
                    n.id, n.loai_thong_bao as type, n.da_doc as \`read\`, n.ngay_tao as createdAt,
                    n.ma_video as videoId, n.ma_binh_luan as commentId,
                    u.id as actorId, u.ten_dang_nhap as username, u.ten_hien_thi as fullName, u.anh_dai_dien,
                    v.anh_thu_nho as videoThumb
            FROM notifications n
            LEFT JOIN users u ON n.ma_nguoi_gui = u.id
            LEFT JOIN videos v ON n.ma_video = v.id
            WHERE n.ma_nguoi_nhan = ?
            ORDER BY n.ngay_tao DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.execute(query, [userId, limit.toString(), offset.toString()]);
        return rows;
    },

    // 2. Tạo thông báo mới
    create: async (receiverId, senderId, type, videoId = null, commentId = null) => {
        // Không gửi thông báo cho chính mình
        if (receiverId === senderId) return null;

        const query = `
            INSERT INTO notifications (ma_nguoi_nhan, ma_nguoi_gui, loai_thong_bao, ma_video, ma_binh_luan)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [receiverId, senderId, type, videoId, commentId]);
        return result.insertId;
    },

    // 3. Đánh dấu 1 thông báo là đã đọc
    markAsRead: async (notificationId, userId) => {
        const query = `UPDATE notifications SET da_doc = 1 WHERE id = ? AND ma_nguoi_nhan = ?`;
        const [result] = await db.execute(query, [notificationId, userId]);
        return result.affectedRows > 0;
    },

    // 4. Đánh dấu tất cả là đã đọc
    markAllAsRead: async (userId) => {
        const query = `UPDATE notifications SET da_doc = 1 WHERE ma_nguoi_nhan = ? AND da_doc = 0`;
        const [result] = await db.execute(query, [userId]);
        return result.affectedRows;
    }
};
