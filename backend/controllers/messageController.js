import { MessageModel } from '../models/messageModel.js';
import { UserModel } from '../models/userModel.js';
import { getIO } from '../utils/socket.js';

// GET /api/messages/inbox
export const getInbox = async (req, res) => {
    try {
        const inbox = await MessageModel.getInbox(req.user.id);
        res.json({ conversations: inbox });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy inbox', error: e.message });
    }
};

// GET /api/messages/:username
export const getConversation = async (req, res) => {
    try {
        const partner = await UserModel.findByUsername(req.params.username);
        if (!partner) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 50;
        const messages = await MessageModel.getConversation(req.user.id, partner.id, { page, limit });
        res.json({ messages, partnerId: String(partner.id) });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy tin nhắn', error: e.message });
    }
};

// POST /api/messages/:username
export const sendMessage = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content?.trim()) return res.status(400).json({ message: 'Nội dung không được trống' });

        const partner = await UserModel.findByUsername(req.params.username);
        if (!partner) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        if (partner.id === req.user.id) return res.status(400).json({ message: 'Không thể nhắn tin cho chính mình' });

        const message = await MessageModel.create({
            senderId: req.user.id,
            receiverId: partner.id,
            content: content.trim(),
        });

        // Push realtime đến cả 2 phía
        const io = getIO();
        if (io) {
            io.to(`user_${partner.id}`).emit('receive_message', message);
            io.to(`user_${req.user.id}`).emit('message_sent', message);
        }

        res.status(201).json({ message });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi gửi tin nhắn', error: e.message });
    }
};

// GET /api/messages/unread-count
export const getUnreadCount = async (req, res) => {
    try {
        const count = await MessageModel.countUnread(req.user.id);
        res.json({ count });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi đếm tin chưa đọc', error: e.message });
    }
};

// PATCH /api/messages/:username/read
export const markRead = async (req, res) => {
    try {
        const partner = await UserModel.findByUsername(req.params.username);
        if (!partner) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        await MessageModel.markRead(req.user.id, partner.id);
        res.json({ message: 'Đã đánh dấu đọc' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi', error: e.message });
    }
};