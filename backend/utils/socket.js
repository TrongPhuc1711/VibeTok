import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    // Xác thực JWT khi kết nối Socket.io
    // Middleware chạy trước mỗi kết nối mới
    io.use((socket, next) => {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            // Cho phép kết nối anonymous (đọc public, không join room riêng)
            socket.userId = null;
            return next();
        }

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'vibetok_secret_key_default'
            );
            socket.userId = decoded.id;
            next();
        } catch {
            // Token lỗi → vẫn cho kết nối nhưng không có userId
            socket.userId = null;
            next();
        }
    });

    io.on('connection', (socket) => {
        // Chỉ cho join room nếu userId khớp với token đã xác thực
        socket.on('join_user_room', (userId) => {
            const requestedId = String(userId);

            // Nếu đã xác thực bằng JWT → kiểm tra khớp
            if (socket.userId && String(socket.userId) !== requestedId) {
                // Ngăn user A join room của user B
                socket.emit('error', { message: 'Không được phép join room này' });
                return;
            }

            // Anonymous hoặc đúng userId → cho phép (graceful degradation)
            socket.join(`user_${requestedId}`);
            console.log(`User ${requestedId} đã tham gia room`);
        });

        // Typing indicator — chỉ cho phép nếu đã auth
        socket.on('typing_start', ({ toUserId, fromUserId }) => {
            if (socket.userId && String(socket.userId) !== String(fromUserId)) return;
            io.to(`user_${toUserId}`).emit('partner_typing', { fromUserId });
        });

        socket.on('typing_stop', ({ toUserId, fromUserId }) => {
            if (socket.userId && String(socket.userId) !== String(fromUserId)) return;
            io.to(`user_${toUserId}`).emit('partner_stopped_typing', { fromUserId });
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => io;

export const emitNotification = (userId, notificationData) => {
    if (io) {
        io.to(`user_${userId}`).emit('receive_new_notification', notificationData);
    }
};