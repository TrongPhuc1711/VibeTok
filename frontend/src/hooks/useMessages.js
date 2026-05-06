import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import * as msgSvc from '../services/messageService';
import { getStoredUser, getToken } from '../utils/helpers';
import { useToast } from '../components/ui/Toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
    || import.meta.env.VITE_API_URL
    || 'http://localhost:5000';

// ── Singleton socket ──
let _socket = null;
let _socketToken = null;

const getSocket = () => {
    const token = getToken();
    if (_socket && _socketToken !== token) {
        _socket.removeAllListeners();
        _socket.disconnect();
        _socket = null;
        _socketToken = null;
    }
    if (!_socket) {
        _socketToken = token;
        _socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            auth: token ? { token } : {},
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            timeout: 10000,
        });
        _socket.on('connect', () => console.log('[Socket] Connected:', _socket.id));
        _socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
        _socket.on('connect_error', (err) => console.warn('[Socket] Error:', err.message));
    }
    return _socket;
};

export const getSharedSocket = getSocket;

export const resetSocket = () => {
    if (_socket) {
        _socket.removeAllListeners();
        _socket.disconnect();
        _socket = null;
        _socketToken = null;
    }
};

// ── useInbox ──
export function useInbox() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const me = getStoredUser();
    const toast = useToast();
    const mountedRef = useRef(true);

    const load = useCallback(async () => {
        try {
            const res = await msgSvc.getInbox();
            if (mountedRef.current) setConversations(res.data.conversations || []);
        } catch {
            if (mountedRef.current) setConversations([]);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        load();
        if (!me?.id) return;

        const socket = getSocket();
        socket.emit('join_user_room', me.id);

        const onReceive = (msg) => {
            if (!mountedRef.current) return;
            setConversations(prev => {
                const idx = prev.findIndex(c => c.partnerId === msg.senderId);
                const updated = {
                    partnerId:       msg.senderId,
                    partnerUsername: msg.sender?.username || '',
                    partnerFullname: msg.sender?.fullName || msg.sender?.username || '',
                    partnerAvatar:   msg.sender?.avatar || msg.sender?.anh_dai_dien || null,
                    partnerInitials: msg.sender?.initials || (msg.sender?.fullName || 'U').charAt(0).toUpperCase(),
                    lastContent:     msg.recalled ? null : msg.content,
                    lastRecalled:    msg.recalled || false,
                    lastSenderId:    msg.senderId,
                    lastTime:        msg.createdAt,
                    unreadCount:     idx >= 0 ? (prev[idx].unreadCount || 0) + 1 : 1,
                };
                if (idx >= 0) {
                    const copy = [...prev]; copy.splice(idx, 1);
                    return [updated, ...copy];
                }
                return [updated, ...prev];
            });

            const currentPath = window.location.pathname;
            const isInChat = currentPath.includes('/messages') && currentPath.includes(msg.sender?.username || '');
            if (!isInChat && toast?.showMessageToast) {
                toast.showMessageToast({
                    senderName: msg.sender?.fullName || msg.sender?.username,
                    content:    msg.recalled ? '📦 Tin nhắn đã được thu hồi' : msg.content,
                    avatar:     msg.sender?.avatar || msg.sender?.anh_dai_dien || null,
                    initials:   msg.sender?.initials || (msg.sender?.fullName || 'U').charAt(0).toUpperCase(),
                    username:   msg.sender?.username,
                });
            }
        };

        const onSent = (msg) => {
            if (!mountedRef.current) return;
            setConversations(prev => {
                const idx = prev.findIndex(c => c.partnerId === msg.receiverId);
                const updated = {
                    partnerId:       msg.receiverId,
                    partnerUsername: prev[idx]?.partnerUsername || msg.receiver?.username || '',
                    partnerFullname: prev[idx]?.partnerFullname || msg.receiver?.fullName || '',
                    partnerAvatar:   prev[idx]?.partnerAvatar || msg.receiver?.avatar || null,
                    partnerInitials: prev[idx]?.partnerInitials || msg.receiver?.fullName?.charAt(0).toUpperCase() || msg.receiver?.username?.charAt(0).toUpperCase() || 'U',
                    lastContent:     msg.content,
                    lastRecalled:    false,
                    lastSenderId:    msg.senderId,
                    lastTime:        msg.createdAt,
                    unreadCount:     0,
                };
                if (idx >= 0) {
                    const copy = [...prev]; copy.splice(idx, 1);
                    return [updated, ...copy];
                }
                return [updated, ...prev];
            });
        };

        const onRecalled = ({ messageId }) => {
            if (!mountedRef.current) return;
            // Cập nhật lastContent trong inbox nếu đó là tin cuối
            setConversations(prev => prev.map(c => {
                // Không biết messageId thuộc conversation nào → reload
                return c;
            }));
            load(); // reload inbox để cập nhật lastContent nếu cần
        };

        socket.on('receive_message', onReceive);
        socket.on('message_sent',    onSent);
        socket.on('message_recalled', onRecalled);

        return () => {
            mountedRef.current = false;
            socket.off('receive_message', onReceive);
            socket.off('message_sent',    onSent);
            socket.off('message_recalled', onRecalled);
        };
    }, [load, me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    return { conversations, loading, refresh: load };
}

// ── useChat ──
export function useChat(partnerUsername) {
    const [messages, setMessages]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [sending, setSending]     = useState(false);
    const [isTyping, setIsTyping]   = useState(false);
    const [error, setError]         = useState('');
    const typingTimer               = useRef(null);
    const mountedRef                = useRef(true);
    const me                        = getStoredUser();

    // Load messages
    useEffect(() => {
        mountedRef.current = true;
        if (!partnerUsername) return;
        setLoading(true);
        setMessages([]);
        setError('');

        msgSvc.getConversation(partnerUsername)
            .then(res => {
                if (mountedRef.current) {
                    setMessages(res.data.messages || []);
                    msgSvc.markRead(partnerUsername).catch(() => {});
                }
            })
            .catch(() => { if (mountedRef.current) setMessages([]); })
            .finally(() => { if (mountedRef.current) setLoading(false); });

        return () => { mountedRef.current = false; };
    }, [partnerUsername]);

    // Socket events
    useEffect(() => {
        if (!me?.id) return;
        const socket = getSocket();
        socket.emit('join_user_room', me.id);

        const onReceive = (msg) => {
            if (!mountedRef.current) return;
            if (msg.sender?.username === partnerUsername) {
                setMessages(prev => [...prev, msg]);
                msgSvc.markRead(partnerUsername).catch(() => {});
            }
        };

        const onRecalled = ({ messageId }) => {
            if (!mountedRef.current) return;
            setMessages(prev => prev.map(m =>
                String(m.id) === String(messageId) ? { ...m, recalled: true, content: null } : m
            ));
        };

        const onReaction = ({ messageId, reactions }) => {
            if (!mountedRef.current) return;
            setMessages(prev => prev.map(m =>
                String(m.id) === String(messageId) ? { ...m, reactions } : m
            ));
        };

        const onTyping = ({ fromUserId }) => {
            if (!mountedRef.current) return;
            if (String(fromUserId) !== String(me.id)) {
                setIsTyping(true);
                clearTimeout(typingTimer.current);
                typingTimer.current = setTimeout(() => {
                    if (mountedRef.current) setIsTyping(false);
                }, 3000);
            }
        };

        const onStopTyping = () => {
            clearTimeout(typingTimer.current);
            if (mountedRef.current) setIsTyping(false);
        };

        socket.on('receive_message',     onReceive);
        socket.on('message_recalled',    onRecalled);
        socket.on('message_reaction',    onReaction);
        socket.on('partner_typing',      onTyping);
        socket.on('partner_stopped_typing', onStopTyping);

        return () => {
            socket.off('receive_message',     onReceive);
            socket.off('message_recalled',    onRecalled);
            socket.off('message_reaction',    onReaction);
            socket.off('partner_typing',      onTyping);
            socket.off('partner_stopped_typing', onStopTyping);
            clearTimeout(typingTimer.current);
            mountedRef.current = false;
        };
    }, [me?.id, partnerUsername]);

    // Actions
    const send = useCallback(async (content, type = 'text') => {
        if (!content?.trim() || sending) return;
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const tempMsg = {
            id:        tempId,
            senderId:  String(me?.id),
            content:   content.trim(),
            type:      type,
            recalled:  false,
            reactions: [],
            createdAt: new Date().toISOString(),
            pending:   true,
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
            const res = await msgSvc.sendMessage(partnerUsername, content.trim(), type);
            if (mountedRef.current) {
                setMessages(prev =>
                    prev.map(m => m.id === tempId ? { ...res.data.message, pending: false } : m)
                );
            }
        } catch (e) {
            if (mountedRef.current) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setError(e.response?.data?.message || 'Gửi thất bại, thử lại!');
            }
        } finally {
            if (mountedRef.current) setSending(false);
        }
    }, [partnerUsername, sending, me]);

    const recall = useCallback(async (messageId) => {
        try {
            await msgSvc.recallMessage(messageId);
            setMessages(prev => prev.map(m =>
                String(m.id) === String(messageId) ? { ...m, recalled: true, content: null } : m
            ));
        } catch (e) {
            console.error('Recall error:', e);
        }
    }, []);

    const react = useCallback(async (messageId, emoji) => {
        try {
            const res = await msgSvc.reactMessage(messageId, emoji);
            setMessages(prev => prev.map(m =>
                String(m.id) === String(messageId) ? { ...m, reactions: res.reactions } : m
            ));
        } catch (e) {
            console.error('React error:', e);
        }
    }, []);

    const unreact = useCallback(async (messageId) => {
        try {
            const res = await msgSvc.removeReaction(messageId);
            setMessages(prev => prev.map(m =>
                String(m.id) === String(messageId) ? { ...m, reactions: res.reactions } : m
            ));
        } catch (e) {
            console.error('Unreact error:', e);
        }
    }, []);

    const emitTyping = useCallback((partnerId) => {
        if (!partnerId) return;
        getSocket().emit('typing_start', { toUserId: partnerId, fromUserId: me?.id });
    }, [me?.id]);

    const emitStopTyping = useCallback((partnerId) => {
        if (!partnerId) return;
        getSocket().emit('typing_stop', { toUserId: partnerId, fromUserId: me?.id });
    }, [me?.id]);

    return {
        messages, loading, sending, isTyping, error,
        send, recall, react, unreact,
        emitTyping, emitStopTyping,
        setMessages,
    };
}

// ── useUnreadMessageCount ──
export function useUnreadMessageCount() {
    const [unreadCount, setUnreadCount] = useState(0);
    const me = getStoredUser();
    const mountedRef = useRef(true);

    const loadCount = useCallback(async () => {
        try {
            const count = await msgSvc.getUnreadCount();
            if (mountedRef.current) setUnreadCount(count || 0);
        } catch {}
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        if (!me?.id) return;
        loadCount();

        const socket = getSocket();
        const onReceive = (msg) => {
            if (!mountedRef.current) return;
            if (String(msg.senderId) !== String(me.id)) setUnreadCount(prev => prev + 1);
        };
        const onRead = () => loadCount();

        socket.on('receive_message', onReceive);
        socket.on('messages_read',   onRead);

        return () => {
            mountedRef.current = false;
            socket.off('receive_message', onReceive);
            socket.off('messages_read',   onRead);
        };
    }, [me?.id, loadCount]);

    const decreaseCount = useCallback(() => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    return { unreadCount, decreaseCount, refreshCount: loadCount };
}