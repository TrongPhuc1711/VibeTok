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

    return (
        <PageLayout noPadding>
            <VideoDetailOverlay
                videoId={id}
                onClose={() => navigate(-1)}
            />
        </PageLayout>
    );
}