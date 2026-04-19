import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/*
VideoDetailPage — khi user mở link /video/:id (chia sẻ link)
Thay vì hiển thị 1 video đơn lẻ, redirect về HomePage
và đặt video đó lên đầu feed để user lướt tiếp các video khác
 */
export default function VideoDetailPage() {
    const { id }   = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Chuyển về trang chủ, truyền startVideoId qua location state
        // replace: true để user bấm back không quay lại trang /video/:id
        navigate('/', { replace: true, state: { startVideoId: id } });
    }, [id, navigate]);

    // Hiển thị loading trong lúc redirect
    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0f',
        }}>
            <div style={{
                width: 32,
                height: 32,
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: '#ff2d78',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
        </div>
    );
}