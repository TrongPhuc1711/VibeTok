import { MessageModel } from '../models/messageModel.js';
import { UserModel }    from '../models/userModel.js';
import { getIO }        from '../utils/socket.js';

// ── GET /api/messages/inbox ──
export const getInbox = async (req, res) => {
    try {
        const inbox = await MessageModel.getInbox(req.user.id);
        res.json({ conversations: inbox });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy inbox', error: e.message });
    }
};

// ── GET /api/messages/:username ──
export const getConversation = async (req, res) => {
    try {
        const partner = await UserModel.findByUsername(req.params.username);
        if (!partner) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const page    = parseInt(req.query.page)  || 1;
        const limit   = parseInt(req.query.limit) || 50;
        const messages = await MessageModel.getConversation(req.user.id, partner.id, { page, limit });
        res.json({ messages, partnerId: String(partner.id) });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy tin nhắn', error: e.message });
    }
};

// ── POST /api/messages/:username ──
export const sendMessage = async (req, res) => {
    try {
        const { content, type } = req.body;
        if (!content?.trim()) return res.status(400).json({ message: 'Nội dung không được trống' });

        const partner = await UserModel.findByUsername(req.params.username);
        if (!partner) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        if (partner.id === req.user.id) return res.status(400).json({ message: 'Không thể nhắn tin cho chính mình' });

        const newMessage = await MessageModel.create({
            senderId:   req.user.id,
            receiverId: partner.id,
            content:    content.trim(),
            type:       type || 'text',
        });

        // Add receiver info for the sender's client so it can update its sidebar with partner details
        newMessage.receiver = {
            id: String(partner.id),
            username: partner.ten_dang_nhap,
            fullName: partner.ten_hien_thi || partner.ten_dang_nhap,
            avatar: partner.anh_dai_dien,
        };

        const io = getIO();
        if (io) {
            io.to(`user_${partner.id}`).emit('receive_message',  newMessage);
            io.to(`user_${req.user.id}`).emit('message_sent',    newMessage);
        }

        res.status(201).json({ message: newMessage });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi gửi tin nhắn', error: e.message });
    }
};

// ── PATCH /api/messages/:id/recall ──
export const recallMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const result = await MessageModel.recall(messageId, req.user.id);

        if (!result) return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
        if (result === 'forbidden') return res.status(403).json({ message: 'Bạn không thể thu hồi tin nhắn này' });

        // Thông báo realtime cho cả 2 phía
        const io = getIO();
        if (io) {
            // Lấy receiverId để push đúng room
            const { receiverId } = result;
            io.to(`user_${req.user.id}`).emit('message_recalled', { messageId: String(messageId) });
            if (receiverId) io.to(`user_${receiverId}`).emit('message_recalled', { messageId: String(messageId) });
        }

        res.json({ messageId: String(messageId), recalled: true });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi thu hồi', error: e.message });
    }
};

// ── GET /api/messages/:username/search?q= ──
export const searchMessages = async (req, res) => {
    try {
        const partner = await UserModel.findByUsername(req.params.username);
        if (!partner) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const results = await MessageModel.search(req.user.id, partner.id, req.query.q);
        res.json({ results });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tìm kiếm', error: e.message });
    }
};

// ── POST /api/messages/:id/react ── { emoji }
export const reactMessage = async (req, res) => {
    try {
        const { emoji } = req.body;
        if (!emoji) return res.status(400).json({ message: 'Thiếu emoji' });

        const reactions = await MessageModel.addReaction(req.params.id, req.user.id, emoji);

        const io = getIO();
        if (io) {
            // Broadcast reaction update — cần biết 2 userId liên quan
            // Lấy thông tin tin nhắn để biết ai là người nhận
            const payload = { messageId: String(req.params.id), reactions };
            io.to(`user_${req.user.id}`).emit('message_reaction', payload);
            // Sẽ emit sang partner trong socket khi có receiverId context
        }

        res.json({ messageId: String(req.params.id), reactions });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi react', error: e.message });
    }
};

// ── DELETE /api/messages/:id/react ──
export const removeReaction = async (req, res) => {
    try {
        const reactions = await MessageModel.removeReaction(req.params.id, req.user.id);
        res.json({ messageId: String(req.params.id), reactions });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi xóa react', error: e.message });
    }
};

// ── GET /api/messages/unread-count ──
export const getUnreadCount = async (req, res) => {
    try {
        const count = await MessageModel.countUnread(req.user.id);
        res.json({ count });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi đếm tin chưa đọc', error: e.message });
    }
};

// ── PATCH /api/messages/:username/read ──
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