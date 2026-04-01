import { NotificationModel } from '../models/notificationModel.js';
import { emitNotification } from '../utils/socket.js';


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
                username: row.username,
                fullName: row.fullName,
                anh_dai_dien: row.anh_dai_dien,
                initials: row.fullName ? row.fullName.charAt(0).toUpperCase() : 'U'
            },
            meta: {
                videoId: row.videoId,
                commentId: row.commentId
            }
        }));

        res.status(200).json({ notifications: formattedNotifications });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy thông báo', error });
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

//goi khi co hanh dong
export const triggerNotification = async (receiverId, sender, type, videoId = null, commentId = null) => {
    try {
        // Lưu vào DB
        const notifId = await NotificationModel.create(receiverId, sender.id, type, videoId, commentId);
        
        if (notifId) {
            // Định dạng lại data cho Socket giống với Frontend
            const newNotif = {
                id: notifId,
                type: type,
                read: false,
                createdAt: new Date().toISOString(),
                actor: {
                    id: sender.id,
                    username: sender.username,
                    fullName: sender.fullName,
                    anh_dai_dien: sender.anh_dai_dien,
                    initials: sender.fullName ? sender.fullName.charAt(0).toUpperCase() : 'U'
                },
                meta: { videoId, commentId }
            };

            // Push realtime cho người nhận
            emitNotification(receiverId, newNotif);
        }
    } catch (error) {
        console.error('Lỗi khi trigger thông báo:', error);
    }
};