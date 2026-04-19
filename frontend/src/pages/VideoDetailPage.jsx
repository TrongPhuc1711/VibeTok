import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout/PageLayout';
import VideoDetailOverlay from '../components/video/VideoDetailOverlay/VideoDetailOverlay';

/*
VideoDetailPage — trang xem video theo URL /video/:id
Dùng lại VideoDetailOverlay nhưng render như trang đầy đủ
 */
export default function VideoDetailPage() {
    const { id }   = useParams();
    const navigate = useNavigate();

    const handleClose = () => {
        // Nếu có lịch sử trình duyệt (user đến từ trang nội bộ), quay lại
        // Nếu mở link trực tiếp (tab mới), không có history → về trang chủ
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/', { replace: true });
        }
    };

    return (
        <PageLayout noPadding>
            <VideoDetailOverlay
                videoId={id}
                onClose={handleClose}
            />
        </PageLayout>
    );
}