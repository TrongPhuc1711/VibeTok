import { NotificationModel } from '../models/notificationModel.js';
import { emitNotification } from '../utils/socket.js';
import pool from '../config/db.js';

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy từ middleware xác thực (JWT)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const rows = await NotificationModel.getNotifications(userId, limit, offset);

        // Map data để khớp với format Frontend yêu cầu trong file NotificationItem.jsx
        const formattedNotifications = rows.map(row => ({
            id: row.id,
            type: row.type,
            read: Boolean(row.read),
            createdAt: row.createdAt,
            actor: {
                id: row.actorId,
                username: row.username || 'system',
                fullName: row.fullName || 'Hệ thống VibeTok',
                anh_dai_dien: row.avatar_url,
                initials: row.fullName ? row.fullName.charAt(0).toUpperCase() : 'V'
            },
            meta: {
                videoId: row.videoId,
                commentId: row.commentId,
                videoThumb: row.videoThumb,
                rejectionReason: row.rejectionReason,
                videoCaption: row.videoCaption
            }
        }));

        res.status(200).json({ notifications: formattedNotifications });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy thông báo', error: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;
        await NotificationModel.markAsRead(notificationId, userId);
        res.status(200).json({ message: 'Đã đánh dấu đọc' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await NotificationModel.markAllAsRead(userId);
        res.status(200).json({ message: 'Đã đánh dấu đọc tất cả' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Gọi khi có hành động
export const triggerNotification = async (receiverId, sender, type, videoId = null, commentId = null) => {
    try {
        // Lưu vào DB
        const senderId = sender?.id ?? receiverId;
        const notifId = await NotificationModel.create(receiverId, senderId, type, videoId, commentId);

        if (notifId) {
            let meta = { videoId, commentId };
            if (videoId) {
                try {
                    const [videoRows] = await pool.query(
                        'SELECT thumbnail_url, rejection_reason, description FROM videos WHERE id = ?',
                        [videoId]
                    );
                    if (videoRows[0]) {
                        meta.videoThumb = videoRows[0].thumbnail_url;
                        meta.rejectionReason = videoRows[0].rejection_reason;
                        meta.videoCaption = videoRows[0].description;
                    }
                } catch { }
            }

            // Định dạng lại data cho Socket giống với Frontend
            const newNotif = {
                id: notifId,
                type: type,
                read: false,
                createdAt: new Date().toISOString(),
                actor: {
                    id: senderId,
                    username: sender?.username || 'system',
                    fullName: sender?.fullName || 'Hệ thống VibeTok',
                    anh_dai_dien: sender?.anh_dai_dien || null,
                    initials: sender?.fullName ? sender.fullName.charAt(0).toUpperCase() : 'V'
                },
                meta
            };

            // Push realtime cho người nhận
            emitNotification(receiverId, newNotif);
        }
    } catch (error) {
        console.error('Lỗi khi trigger thông báo:', error);
    }
};