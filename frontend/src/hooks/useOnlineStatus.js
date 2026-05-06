import { useState, useEffect, useCallback, useRef } from 'react';
import { getSharedSocket } from './useMessages';
import { getStoredUser } from '../utils/helpers';

/**
 * Hook theo dõi trạng thái online/offline của danh sách user.
 * @param {string[]} userIds - Mảng userId cần theo dõi
 * @returns {{ onlineMap, isOnline, getLastSeen, formatLastSeen }}
 */
export function useOnlineStatus(userIds = []) {
    // Map<userId, { online: boolean, lastSeen: string|null }>
    const [statusMap, setStatusMap] = useState({});
    // Tick counter để refresh relative time mỗi 60s
    const [, setTick] = useState(0);
    const me = getStoredUser();
    const mountedRef = useRef(true);
    const requestedRef = useRef(false);

    // Lấy trạng thái ban đầu qua socket acknowledgment
    useEffect(() => {
        mountedRef.current = true;
        requestedRef.current = false;

        if (!me?.id || userIds.length === 0) return;

        const socket = getSharedSocket();
        if (!socket) return;

        // Chờ socket connected rồi mới request
        const requestStatus = () => {
            if (requestedRef.current) return;
            requestedRef.current = true;
            
            socket.emit('get_online_users', userIds, (result) => {
                if (mountedRef.current && result) {
                    setStatusMap(prev => ({ ...prev, ...result }));
                }
            });
        };

        if (socket.connected) {
            requestStatus();
        } else {
            socket.once('connect', requestStatus);
        }

        return () => {
            mountedRef.current = false;
            socket.off('connect', requestStatus);
        };
    }, [me?.id, JSON.stringify(userIds)]); // eslint-disable-line react-hooks/exhaustive-deps

    // Lắng nghe real-time status changes
    useEffect(() => {
        if (!me?.id) return;
        const socket = getSharedSocket();
        if (!socket) return;

        const onUserOnline = ({ userId }) => {
            if (!mountedRef.current) return;
            setStatusMap(prev => ({
                ...prev,
                [String(userId)]: { online: true, lastSeen: null },
            }));
        };

        const onUserOffline = ({ userId, lastSeen }) => {
            if (!mountedRef.current) return;
            setStatusMap(prev => ({
                ...prev,
                [String(userId)]: { online: false, lastSeen },
            }));
        };

        socket.on('user_online', onUserOnline);
        socket.on('user_offline', onUserOffline);

        return () => {
            socket.off('user_online', onUserOnline);
            socket.off('user_offline', onUserOffline);
        };
    }, [me?.id]);

    // Refresh relative time mỗi 60 giây
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 60_000);
        return () => clearInterval(interval);
    }, []);

    // Helper: kiểm tra user có online không
    const isOnline = useCallback((userId) => {
        return statusMap[String(userId)]?.online || false;
    }, [statusMap]);

    // Helper: lấy lastSeen
    const getLastSeen = useCallback((userId) => {
        return statusMap[String(userId)]?.lastSeen || null;
    }, [statusMap]);

    // Helper: format lastSeen thành text hiển thị
    const formatLastSeen = useCallback((userId) => {
        const uid = String(userId);
        const status = statusMap[uid];

        if (!status) return '';
        if (status.online) return 'Đang hoạt động';

        if (!status.lastSeen) return 'Ngoại tuyến';

        const diff = Math.floor((Date.now() - new Date(status.lastSeen).getTime()) / 1000);
        if (diff < 60) return 'Hoạt động vừa xong';
        if (diff < 3600) return `Hoạt động ${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `Hoạt động ${Math.floor(diff / 3600)} giờ trước`;
        if (diff < 2592000) return `Hoạt động ${Math.floor(diff / 86400)} ngày trước`;
        return 'Ngoại tuyến';
    }, [statusMap]);

    return { statusMap, isOnline, getLastSeen, formatLastSeen };
}
