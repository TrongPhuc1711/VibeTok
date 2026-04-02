import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    io.on('connection', (socket) => {
        // User join room thông báo & tin nhắn theo userId
        socket.on('join_user_room', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} đã tham gia room`);
        });

        // Typing indicator
        socket.on('typing_start', ({ toUserId, fromUserId }) => {
            io.to(`user_${toUserId}`).emit('partner_typing', { fromUserId });
        });

        socket.on('typing_stop', ({ toUserId, fromUserId }) => {
            io.to(`user_${toUserId}`).emit('partner_stopped_typing', { fromUserId });
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });
    return io;
};

// Export để dùng trong controllers
export const getIO = () => io;

export const emitNotification = (userId, notificationData) => {
    if (io) {
        io.to(`user_${userId}`).emit('receive_new_notification', notificationData);
    }
};