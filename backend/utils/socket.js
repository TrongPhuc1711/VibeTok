import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

// ── Online status tracking ──
// userId → Set<socketId>  (1 user có thể mở nhiều tab)
const onlineUsers = new Map();
// userId → ISO timestamp (lần cuối offline)
const lastSeenMap = new Map();

const markUserOnline = (userId, socketId) => {
    const uid = String(userId);
    if (!onlineUsers.has(uid)) {
        onlineUsers.set(uid, new Set());
    }
    const wasOffline = onlineUsers.get(uid).size === 0;
    onlineUsers.get(uid).add(socketId);

    if (wasOffline && io) {
        // Broadcast cho tất cả clients biết user này vừa online
        io.emit('user_online', { userId: uid });
    }
};

const markUserOffline = (userId, socketId) => {
    const uid = String(userId);
    if (!onlineUsers.has(uid)) return;

    onlineUsers.get(uid).delete(socketId);

    if (onlineUsers.get(uid).size === 0) {
        // Không còn socket nào → user thật sự offline
        const now = new Date().toISOString();
        lastSeenMap.set(uid, now);
        if (io) {
            io.emit('user_offline', { userId: uid, lastSeen: now });
        }
    }
};

export const isUserOnline = (userId) => {
    const sockets = onlineUsers.get(String(userId));
    return sockets ? sockets.size > 0 : false;
};

export const getUserLastSeen = (userId) => {
    return lastSeenMap.get(String(userId)) || null;
};

export const initSocket = (server) => {
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,https://vibe-tok.vercel.app')
        .split(',')
        .map(s => s.trim());

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // ── JWT middleware ──
    io.use((socket, next) => {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            socket.userId = null;
            return next();
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vibetok_secret_key_default');
            socket.userId = decoded.id;
            next();
        } catch {
            socket.userId = null;
            next();
        }
    });

    io.on('connection', (socket) => {
        const sid = socket.id;
        const authedUserId = socket.userId ? String(socket.userId) : null;

        console.log('[Socket] connection', { sid, authedUserId });

        // ── Room management + Online tracking ──
        socket.on('join_user_room', (userId) => {
            const requestedId = String(userId);
            if (socket.userId && String(socket.userId) !== requestedId) {
                socket.emit('error', { message: 'Không được phép join room này' });
                return;
            }
            socket.join(`user_${requestedId}`);
            // Track gắn userId vào socket để xử lý disconnect
            socket._vibetokUserId = requestedId;
            markUserOnline(requestedId, socket.id);
            console.log('[Socket] join_user_room', { sid, requestedId, authedUserId });
        });
        
        if (authedUserId) {
            socket.join(`user_${authedUserId}`);
            socket._vibetokUserId = authedUserId;
            markUserOnline(authedUserId, sid);
            console.log('[Socket] auto_join_user_room', { sid, authedUserId });
        }

        // ── Client yêu cầu danh sách online ──
        socket.on('get_online_users', (userIds, callback) => {
            // userIds là array các userId cần check
            if (typeof callback !== 'function') return;
            const result = {};
            (userIds || []).forEach(uid => {
                const id = String(uid);
                const sockets = onlineUsers.get(id);
                const online = sockets ? sockets.size > 0 : false;
                result[id] = {
                    online,
                    lastSeen: online ? null : (lastSeenMap.get(id) || null),
                };
            });
            callback(result);
        });

        // ── Typing indicators ──
        socket.on('typing_start', ({ toUserId, fromUserId }) => {
            if (socket.userId && String(socket.userId) !== String(fromUserId)) return;
            io.to(`user_${toUserId}`).emit('partner_typing', { fromUserId });
        });

        socket.on('typing_stop', ({ toUserId, fromUserId }) => {
            if (socket.userId && String(socket.userId) !== String(fromUserId)) return;
            io.to(`user_${toUserId}`).emit('partner_stopped_typing', { fromUserId });
        });

        socket.on('call_offer', ({ toUserId, offer, callType: ct, callerInfo }) => {
            if (!socket.userId) {
                console.warn('[Call][Socket] call_offer ignored: unauthenticated');
                return;
            }
            const targetId = String(toUserId);
            const targetSockets = onlineUsers.get(targetId);
            const targetOnline = targetSockets ? targetSockets.size > 0 : false;

            console.log('[Call] call_offer debug', {
                from: socket.userId,
                to: targetId,
                targetOnline,
                onlineUsersKeys: [...onlineUsers.keys()],  // THÊM để debug
            });

            if (!targetOnline) {
                // THÊM: thử emit trực tiếp vào room thay vì báo offline ngay
                // Có thể user đang online nhưng chưa được track
                const roomName = `user_${targetId}`;
                const roomSockets = io.sockets.adapter.rooms.get(roomName);
                
                if (roomSockets && roomSockets.size > 0) {
                    // User có trong room nhưng chưa trong onlineUsers map → emit vẫn được
                    io.to(roomName).emit('call_incoming', {
                        fromUserId: socket.userId,
                        offer,
                        callType: ct || 'voice',
                        callerInfo,
                    });
                    return;
                }

                socket.emit('call_user_offline', {
                    toUserId: targetId,
                    lastSeen: lastSeenMap.get(targetId) || null,
                });
                return;
            }

            // Emit cả 2 cách để chắc chắn
            io.to(`user_${targetId}`).emit('call_incoming', {
                fromUserId: socket.userId,
                offer,
                callType: ct || 'voice',
                callerInfo,
            });
            
            targetSockets.forEach(targetSid => {
                io.to(targetSid).emit('call_incoming', {
                    fromUserId: socket.userId,
                    offer,
                    callType: ct || 'voice',
                    callerInfo,
                });
            });
        });

        /**
         * Bước 2: Người nhận (B) chấp nhận → emit call_answer
         */
        socket.on('call_answer', ({ toUserId, answer }) => {
            if (!socket.userId) return;
            const targetId = String(toUserId);
            io.to(`user_${targetId}`).emit('call_answered', { fromUserId: socket.userId, answer });
            const targetSockets = onlineUsers.get(targetId);
            if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('call_answered', { fromUserId: socket.userId, answer }));
        });

        /**
         * Bước 3: Trao đổi ICE candidates
         */
        socket.on('call_ice_candidate', ({ toUserId, candidate }) => {
            if (!socket.userId) return;
            const targetId = String(toUserId);
            io.to(`user_${targetId}`).emit('call_ice_candidate', { fromUserId: socket.userId, candidate });
            const targetSockets = onlineUsers.get(targetId);
            if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('call_ice_candidate', { fromUserId: socket.userId, candidate }));
        });

        /**
         * B từ chối cuộc gọi
         */
        socket.on('call_reject', ({ toUserId }) => {
            if (!socket.userId) return;
            const targetId = String(toUserId);
            io.to(`user_${targetId}`).emit('call_rejected', { fromUserId: socket.userId });
            const targetSockets = onlineUsers.get(targetId);
            if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('call_rejected', { fromUserId: socket.userId }));
        });

        /**
         * Kết thúc cuộc gọi
         */
        socket.on('call_end', ({ toUserId }) => {
            if (!socket.userId) return;
            const targetId = String(toUserId);
            io.to(`user_${targetId}`).emit('call_ended', { fromUserId: socket.userId });
            const targetSockets = onlineUsers.get(targetId);
            if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('call_ended', { fromUserId: socket.userId }));
        });

        /*
         Thông báo đang đổ chuông
         */
        socket.on('call_ringing', ({ toUserId }) => {
            if (!socket.userId) return;
            const targetId = String(toUserId);
            io.to(`user_${targetId}`).emit('call_ringing', { fromUserId: socket.userId });
            const targetSockets = onlineUsers.get(targetId);
            if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('call_ringing', { fromUserId: socket.userId }));
        });

        //Disconnect
        socket.on('disconnect', () => {
            console.log('[Socket] disconnect', { sid, authedUserId, trackedUserId: socket._vibetokUserId });
            // Online tracking: đánh dấu offline
            if (socket._vibetokUserId) {
                markUserOffline(socket._vibetokUserId, socket.id);
            }
            // Nếu đang trong cuộc gọi → sẽ được xử lý ở useCall hook phía client (timeout)
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