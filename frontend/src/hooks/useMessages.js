import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import * as msgSvc from '../services/messageService';
import { getStoredUser } from '../utils/helpers';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Singleton socket
let _socket = null;
const getSocket = () => {
    if (!_socket) {
        _socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    }
    return _socket;
};

/* ── useInbox: quản lý danh sách conversations ── */
export function useInbox() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const me = getStoredUser();

    const load = useCallback(async () => {
        try {
            const res = await msgSvc.getInbox();
            setConversations(res.data.conversations || []);
        } catch {
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const socket = getSocket();
        if (me?.id) socket.emit('join_user_room', me.id);

        // Nhận tin nhắn mới → cập nhật inbox
        const onReceive = (msg) => {
            setConversations(prev => {
                const idx = prev.findIndex(c => c.partnerId === msg.senderId);
                const updated = {
                    partnerId: msg.senderId,
                    partnerUsername: msg.sender.username,
                    partnerFullname: msg.sender.fullName,
                    partnerAvatar: msg.sender.avatar,
                    partnerInitials: msg.sender.initials,
                    lastContent: msg.content,
                    lastSenderId: msg.senderId,
                    lastTime: msg.createdAt,
                    unreadCount: (idx >= 0 ? (prev[idx].unreadCount || 0) : 0) + 1,
                };
                if (idx >= 0) {
                    const copy = [...prev];
                    copy.splice(idx, 1);
                    return [updated, ...copy];
                }
                return [updated, ...prev];
            });
        };

        const onSent = (msg) => {
            setConversations(prev => {
                const idx = prev.findIndex(c => c.partnerId === msg.receiverId);
                const updated = {
                    partnerId: msg.receiverId,
                    partnerUsername: prev[idx]?.partnerUsername || '',
                    partnerFullname: prev[idx]?.partnerFullname || '',
                    partnerAvatar: prev[idx]?.partnerAvatar || null,
                    partnerInitials: prev[idx]?.partnerInitials || 'U',
                    lastContent: msg.content,
                    lastSenderId: msg.senderId,
                    lastTime: msg.createdAt,
                    unreadCount: 0,
                };
                if (idx >= 0) {
                    const copy = [...prev];
                    copy.splice(idx, 1);
                    return [updated, ...copy];
                }
                return [updated, ...prev];
            });
        };

        socket.on('receive_message', onReceive);
        socket.on('message_sent', onSent);
        return () => {
            socket.off('receive_message', onReceive);
            socket.off('message_sent', onSent);
        };
    }, [load, me?.id]);

    return { conversations, loading, refresh: load };
}

/* ── useChat: quản lý 1 cuộc trò chuyện ── */
export function useChat(partnerUsername) {
    const [messages, setMessages]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [sending, setSending]     = useState(false);
    const [isTyping, setIsTyping]   = useState(false);
    const [error, setError]         = useState('');
    const typingTimer = useRef(null);
    const me = getStoredUser();

    // Load lịch sử
    useEffect(() => {
        if (!partnerUsername) return;
        setLoading(true);
        setMessages([]);
        msgSvc.getConversation(partnerUsername)
            .then(res => {
                setMessages(res.data.messages || []);
                // Đánh dấu đã đọc
                msgSvc.markRead(partnerUsername).catch(() => {});
            })
            .catch(() => setMessages([]))
            .finally(() => setLoading(false));
    }, [partnerUsername]);

    // Socket events
    useEffect(() => {
        if (!me?.id) return;
        const socket = getSocket();
        socket.emit('join_user_room', me.id);

        const onReceive = (msg) => {
            if (msg.sender.username === partnerUsername) {
                setMessages(prev => [...prev, msg]);
                msgSvc.markRead(partnerUsername).catch(() => {});
            }
        };

        const onSent = (msg) => {
            // msg đã append optimistically, không cần append lại
        };

        const onTyping = ({ fromUserId }) => {
            if (fromUserId !== me.id) {
                setIsTyping(true);
                clearTimeout(typingTimer.current);
                typingTimer.current = setTimeout(() => setIsTyping(false), 3000);
            }
        };

        const onStopTyping = () => setIsTyping(false);

        socket.on('receive_message', onReceive);
        socket.on('partner_typing', onTyping);
        socket.on('partner_stopped_typing', onStopTyping);

        return () => {
            socket.off('receive_message', onReceive);
            socket.off('partner_typing', onTyping);
            socket.off('partner_stopped_typing', onStopTyping);
        };
    }, [me?.id, partnerUsername]);

    const send = useCallback(async (content) => {
        if (!content.trim() || sending) return;
        const tempId = `temp_${Date.now()}`;

        // Optimistic insert
        const tempMsg = {
            id: tempId,
            senderId: String(me?.id),
            content: content.trim(),
            createdAt: new Date().toISOString(),
            pending: true,
            sender: {
                username: me?.username,
                fullName: me?.fullName,
                avatar: me?.anh_dai_dien,
                initials: me?.initials || 'U',
            },
        };
        setMessages(prev => [...prev, tempMsg]);
        setSending(true);
        setError('');

        try {
            const res = await msgSvc.sendMessage(partnerUsername, content.trim());
            setMessages(prev =>
                prev.map(m => m.id === tempId ? { ...res.data.message, pending: false } : m)
            );
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setError(e.response?.data?.message || 'Gửi thất bại');
        } finally {
            setSending(false);
        }
    }, [partnerUsername, sending, me]);

    const emitTyping = useCallback((partnerId) => {
        const socket = getSocket();
        socket.emit('typing_start', { toUserId: partnerId, fromUserId: me?.id });
    }, [me?.id]);

    const emitStopTyping = useCallback((partnerId) => {
        const socket = getSocket();
        socket.emit('typing_stop', { toUserId: partnerId, fromUserId: me?.id });
    }, [me?.id]);

    return { messages, loading, sending, isTyping, error, send, emitTyping, emitStopTyping };
}