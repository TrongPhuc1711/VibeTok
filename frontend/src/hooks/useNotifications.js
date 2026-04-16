import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markAsRead, markAllAsRead, getMockNotifications } from '../services/notificationService';
import { getStoredUser } from '../utils/helpers';

// ✅ FIX: Import socket singleton từ useMessages thay vì tạo instance mới
// Tránh duplicate WebSocket connections
import { getSharedSocket } from './useMessages';

export function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const me = getStoredUser();

    const load = useCallback(async () => {
        try {
            const res = await getNotifications();
            const list = res.data.notifications || [];
            setNotifications(list);
            setUnreadCount(list.filter(n => !n.read).length);
        } catch {
            const mock = getMockNotifications();
            setNotifications(mock);
            setUnreadCount(mock.filter(n => !n.read).length);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!me?.id) return;

        const socket = getSharedSocket();
        socket.emit('join_user_room', me.id);

        const onNewNotification = (notif) => {
            setNotifications(prev => {
                if (prev.some(n => n.id === notif.id)) return prev;
                return [notif, ...prev];
            });
            setUnreadCount(prev => prev + 1);
        };

        socket.on('receive_new_notification', onNewNotification);

        return () => {
            socket.off('receive_new_notification', onNewNotification);
        };
    }, [me?.id]);

    const handleMarkRead = useCallback(async (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        try { await markAsRead(id); } catch { /* silent */ }
    }, []);

    const handleMarkAllRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        try { await markAllAsRead(); } catch { /* silent */ }
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        markRead: handleMarkRead,
        markAllRead: handleMarkAllRead,
        refresh: load,
    };
}