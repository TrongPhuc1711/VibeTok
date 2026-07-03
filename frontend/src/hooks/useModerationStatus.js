import { useEffect, useRef } from 'react';
import { getSharedSocket } from './useMessages';
import { getStoredUser, isLoggedIn } from '../utils/helpers';
import { useToast } from '../components/ui/Toast';

/**
 * Hook lắng nghe kết quả kiểm duyệt video qua Socket.io
 * Sử dụng ở App level để nhận thông báo ở mọi trang
 */
export function useModerationStatus() {
    const toast = useToast();
    const me = getStoredUser();
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        if (!isLoggedIn() || !me?.id) return;

        const socket = getSharedSocket();

        const onModerationResult = ({ videoId, status, reason, categories }) => {
            if (!mountedRef.current) return;

            console.log('[Moderation] Nhận kết quả kiểm duyệt:', { videoId, status, reason });

            if (status === 'approved') {
                toast.showSuccess(
                    '✅ Video đã được phê duyệt!',
                    'Video của bạn đã xuất hiện trên feed và có thể được mọi người xem.'
                );
            } else if (status === 'rejected') {
                const categoryLabels = {
                    violence: '🔴 Bạo lực',
                    sexual: '🔴 Nội dung khiêu dâm',
                    drugs: '🔴 Ma túy/Chất cấm',
                    'self-harm': '🔴 Tự gây thương tích',
                    self_harm: '🔴 Tự gây thương tích',
                    hate_speech: '🔴 Phát ngôn thù ghét',
                    child_safety: '🔴 Nguy hại trẻ em',
                };
                const catText = (categories || [])
                    .map(c => categoryLabels[c] || c)
                    .join(', ');

                toast.showError(
                    '⚠️ Video bị từ chối',
                    `${reason || 'Vi phạm chính sách cộng đồng'}${catText ? `\n\nVi phạm: ${catText}` : ''}`
                );
            }
        };

        socket.on('video_moderation_result', onModerationResult);

        return () => {
            mountedRef.current = false;
            socket.off('video_moderation_result', onModerationResult);
        };
    }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
