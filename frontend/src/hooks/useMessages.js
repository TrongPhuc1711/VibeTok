import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import * as msgSvc from '../services/messageService';
import { getStoredUser, getToken } from '../utils/helpers';
import { useToast } from '../components/ui/Toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
    || import.meta.env.VITE_API_URL
    || 'http://localhost:5000';

let _socket = null;

// Gửi JWT token khi kết nối socket để server xác thực
const getSocket = () => {
    if (!_socket) {
        const token = getToken();
        _socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            auth: token ? { token } : {},
        });
    }
    return _socket;
};

// Reset socket khi logout (gọi hàm này trong authService.logout)
export const resetSocket = () => {
    if (_socket) {
        _socket.disconnect();
        _socket = null;
    }
};

export function useInbox() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const me    = getStoredUser();
    const toast = useToast();

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

        const onReceive = (msg) => {
            setConversations(prev => {
                const idx = prev.findIndex(c => c.partnerId === msg.senderId);
                const updated = {
                    partnerId:       msg.senderId,
                    partnerUsername: msg.sender.username,
                    partnerFullname: msg.sender.fullName,
                    partnerAvatar:   msg.sender.avatar,
                    partnerInitials: msg.sender.initials,
                    lastContent:     msg.content,
                    lastSenderId:    msg.senderId,
                    lastTime:        msg.createdAt,
                    unreadCount:     (idx >= 0 ? (prev[idx].unreadCount || 0) : 0) + 1,
                };
                if (idx >= 0) {
                    const copy = [...prev];
                    copy.splice(idx, 1);
                    return [updated, ...copy];
                }
                return [updated, ...prev];
            });

            const currentPath = window.location.pathname;
            const isInChat = currentPath.includes('/messages') &&
                currentPath.includes(msg.sender.username);

            if (!isInChat && toast?.showMessageToast) {
                toast.showMessageToast({
                    senderName: msg.sender.fullName || msg.sender.username,
                    content:    msg.content,
                    avatar:     msg.sender.avatar || msg.sender.anh_dai_dien || null,
                    initials:   msg.sender.initials || (msg.sender.fullName || 'U').charAt(0).toUpperCase(),
                    username:   msg.sender.username,
                });
            }
        };

        const onSent = (msg) => {
            setConversations(prev => {
                const idx = prev.findIndex(c => c.partnerId === msg.receiverId);
                const updated = {
                    partnerId:       msg.receiverId,
                    partnerUsername: prev[idx]?.partnerUsername || '',
                    partnerFullname: prev[idx]?.partnerFullname || '',
                    partnerAvatar:   prev[idx]?.partnerAvatar   || null,
                    partnerInitials: prev[idx]?.partnerInitials || 'U',
                    lastContent:     msg.content,
                    lastSenderId:    msg.senderId,
                    lastTime:        msg.createdAt,
                    unreadCount:     0,
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
    }, [load, me?.id, toast]);

    return { conversations, loading, refresh: load };
}

export function useChat(partnerUsername) {
    const [messages,  setMessages]  = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [sending,   setSending]   = useState(false);
    const [isTyping,  setIsTyping]  = useState(false);
    const [error,     setError]     = useState('');
    const typingTimer = useRef(null);
    const me = getStoredUser();

    useEffect(() => {
        if (!partnerUsername) return;
        setLoading(true);
        setMessages([]);
        msgSvc.getConversation(partnerUsername)
            .then(res => {
                setMessages(res.data.messages || []);
                msgSvc.markRead(partnerUsername).catch(() => {});
            })
            .catch(() => setMessages([]))
            .finally(() => setLoading(false));
    }, [partnerUsername]);

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

        const onTyping      = ({ fromUserId }) => {
            if (fromUserId !== me.id) {
                setIsTyping(true);
                clearTimeout(typingTimer.current);
                typingTimer.current = setTimeout(() => setIsTyping(false), 3000);
            }
        };
        const onStopTyping  = () => setIsTyping(false);

        socket.on('receive_message',         onReceive);
        socket.on('partner_typing',          onTyping);
        socket.on('partner_stopped_typing',  onStopTyping);

        return () => {
            socket.off('receive_message',        onReceive);
            socket.off('partner_typing',         onTyping);
            socket.off('partner_stopped_typing', onStopTyping);
        };
    }, [me?.id, partnerUsername]);

    const send = useCallback(async (content) => {
        if (!content.trim() || sending) return;
        const tempId  = `temp_${Date.now()}`;
        const tempMsg = {
            id:         tempId,
            senderId:   String(me?.id),
            content:    content.trim(),
            createdAt:  new Date().toISOString(),
            pending:    true,
            sender: {
                username: me?.username,
                fullName: me?.fullName,
                avatar:   me?.anh_dai_dien,
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

    const emitTyping     = useCallback((partnerId) => {
        getSocket().emit('typing_start', { toUserId: partnerId, fromUserId: me?.id });
    }, [me?.id]);

    const emitStopTyping = useCallback((partnerId) => {
        getSocket().emit('typing_stop', { toUserId: partnerId, fromUserId: me?.id });
    }, [me?.id]);

    return { messages, loading, sending, isTyping, error, send, emitTyping, emitStopTyping };
}

export function useUnreadMessageCount() {
    const [unreadCount, setUnreadCount] = useState(0);
    const me = getStoredUser();

    const loadCount = useCallback(async () => {
        try {
            const count = await msgSvc.getUnreadCount();
            setUnreadCount(count || 0);
        } catch {}
    }, []);

    useEffect(() => {
        if (!me?.id) return;
        loadCount();

        const socket    = getSocket();
        const onReceive = (msg) => {
            if (msg.senderId !== String(me.id)) {
                setUnreadCount(prev => prev + 1);
            }
        };
        const onRead    = () => loadCount();

        socket.on('receive_message', onReceive);
        socket.on('messages_read',   onRead);
        return () => {
            socket.off('receive_message', onReceive);
            socket.off('messages_read',   onRead);
        };
    }, [me?.id, loadCount]);

    const decreaseCount = useCallback(() => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    return { unreadCount, decreaseCount, refreshCount: loadCount };
}