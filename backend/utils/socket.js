import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    io.on('connection', (socket) => {
        socket.on('join_user_room', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} đã tham gia room nhận thông báo`);
        });
    });
    return io;
};

export const emitNotification = (userId, notificationData) => {
    if (io) {
        io.to(`user_${userId}`).emit('receive_new_notification', notificationData);
    }
};