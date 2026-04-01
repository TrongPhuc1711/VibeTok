import { useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, markAsRead, markAllAsRead, getMockNotifications } from '../services/notificationService';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const intervalRef = useRef(null);

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
    // Poll mỗi 30s để giả lập real-time (thay bằng WebSocket nếu backend hỗ trợ)
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  const handleMarkRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    await markAsRead(id);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllAsRead();
  }, []);

  // Giả lập nhận thông báo mới (demo)
  const simulateNewNotification = useCallback(() => {
    const newNotif = {
      id: `n_${Date.now()}`,
      type: ['like', 'follow', 'comment'][Math.floor(Math.random() * 3)],
      read: false,
      createdAt: new Date().toISOString(),
      actor: {
        id: 'u_new', username: 'user_moi', fullName: 'Người Dùng Mới',
        initials: 'ND', anh_dai_dien: null, color: '#ff2d78',
      },
      meta: { videoId: 'v1', caption: 'Video của bạn' },
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  return {
    notifications, unreadCount, loading,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
    simulateNewNotification,
    refresh: load,
  };
}