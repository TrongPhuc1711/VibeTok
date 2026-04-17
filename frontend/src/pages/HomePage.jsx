import React, { useState, useCallback, useEffect, useRef } from 'react';
import PageLayout from '../components/layout/PageLayout';
import VideoCard from '../components/video/VideoCard/VideoCard';
import VideoCardActions from '../components/video/VideoCard/VideoCardActions';
import CommentPanel from '../components/video/CommentPannel/CommentPanel';
import { BounceDots } from '../components/ui/Spinner';
import { useVideoFeed } from '../hooks/useVideoFeed';

/* ── Hàm helper: dừng TẤT CẢ video đang phát trên trang ── */
const stopAllVideos = () => {
    document.querySelectorAll('video').forEach((v) => {
        if (!v.paused) {
            v.muted = true;   // cắt âm tức thì
            v.pause();
        }
    });
};

/* ── Nav arrow button (desktop only) ── */
function NavArrow({ direction, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="hidden md:flex w-[38px] h-[38px] rounded-full items-center justify-center border-none cursor-pointer transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/20 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: 'white' }}
        >
            {direction === 'up' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            )}
        </button>
    );
}

/* ── Desktop: hook tính kích thước video ── */
function useVideoContainerSize(aspectRatio, showComments) {
    const [size, setSize] = useState({ width: 360, height: 640 });
    useEffect(() => {
        const calculate = () => {
            const SIDEBAR_W = 240;
            const ACTIONS_W = 80;
            const COMMENT_W = showComments ? 420 : 0;
            const NAV_W = 60;
            const PADDING = 48;
            const availW = window.innerWidth - SIDEBAR_W - ACTIONS_W - COMMENT_W - NAV_W - PADDING;
            const availH = window.innerHeight * 0.88;
            let w = availH * aspectRatio;
            let h = availH;
            if (w > availW) { w = availW; h = w / aspectRatio; }
            setSize({ width: Math.max(220, Math.round(w)), height: Math.max(280, Math.round(h)) });
        };
        calculate();
        window.addEventListener('resize', calculate);
        return () => window.removeEventListener('resize', calculate);
    }, [aspectRatio, showComments]);
    return size;
}

/* ── Mobile: full-screen TikTok-style feed ── */
function MobileFeed({ videos, loading, hasMore, loadMore }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [commentVideoId, setCommentVideoId] = useState(null);
    const touchStartY = useRef(0);
    const touchStartTime = useRef(0);
    const isAnimating = useRef(false);

    const firstVideoId = videos[0]?.id ?? null;
    useEffect(() => {
        setCurrentIdx(0);
        setCommentVideoId(null);
    }, [firstVideoId]);
    const go = useCallback((dir) => {
        if (isAnimating.current) return;
        const next = currentIdx + dir;
        if (dir > 0 && next >= videos.length - 3 && hasMore) loadMore();
        if (next >= 0 && next < videos.length) {
            // ── QUAN TRỌNG: dừng tất cả video TRƯỚC khi đổi index ──
            stopAllVideos();

            isAnimating.current = true;
            setCurrentIdx(next);
            setCommentVideoId(null);
            setTimeout(() => { isAnimating.current = false; }, 400);
        }
    }, [currentIdx, videos.length, hasMore, loadMore]);

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (e) => {
        const dy = touchStartY.current - e.changedTouches[0].clientY;
        const dt = Date.now() - touchStartTime.current;
        if (Math.abs(dy) > 60 && dt < 400) {
            go(dy > 0 ? 1 : -1);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <BounceDots />
            </div>
        );
    }

    const current = videos[currentIdx];
    if (!current) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30 font-body px-6 text-center">
                <span className="text-5xl">🎬</span>
                <p className="text-sm">Không có video nào</p>
            </div>
        );
    }

    return (
        <div
            className="relative w-full flex-1 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ background: '#000' }}
        >
            {/* Full-screen video */}
            <div className="absolute inset-0">
                <VideoCard
                    key={current.id}
                    video={current}
                    isActive
                    hideActions
                    hideTopBar
                    onComment={() => setCommentVideoId(current.id)}
                />
            </div>

            {/* Right-side actions */}
            <div
                className="absolute right-3 flex flex-col items-center gap-4 z-20"
                style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
            >
                <VideoCardActions
                    key={current.id + '-actions'}
                    video={current}
                    inline
                    onComment={() => setCommentVideoId(current.id)}
                />
            </div>

            {commentVideoId && (
                <CommentPanel
                    videoId={commentVideoId}
                    totalComments={current.comments}
                    onClose={() => setCommentVideoId(null)}
                />
            )}

            {/* Video progress dots */}
            {videos.length > 1 && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none z-10"
                    style={{ bottom: 'calc(66px + env(safe-area-inset-bottom))' }}
                >
                    {videos.slice(Math.max(0, currentIdx - 3), Math.min(videos.length, currentIdx + 4)).map((_, i) => {
                        const realIdx = Math.max(0, currentIdx - 3) + i;
                        return (
                            <div key={realIdx} style={{
                                width: realIdx === currentIdx ? 16 : 5,
                                height: 5,
                                borderRadius: 2.5,
                                background: realIdx === currentIdx ? '#ff2d78' : 'rgba(255,255,255,0.3)',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                            }} />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── Main component ── */
export default function HomePage({ feedType = 'forYou' }) {
    const { videos, loading, loadMore, hasMore } = useVideoFeed(feedType);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [commentVideoId, setCommentVideoId] = useState(null);
    const [aspectRatio, setAspectRatio] = useState(9 / 16);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
    const desktopRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setCurrentIdx(0);
        setCommentVideoId(null);
    }, [feedType]);

    const current = videos[currentIdx];
    const showComments = commentVideoId !== null;
    const containerSize = useVideoContainerSize(aspectRatio, showComments);

    const go = useCallback((dir) => {
        const next = currentIdx + dir;
        if (dir > 0 && next >= videos.length - 3 && hasMore) loadMore();
        if (next >= 0 && next < videos.length) {
            // dừng tất cả video TRƯỚC khi đổi index ─
            stopAllVideos();

            setCurrentIdx(next);
            setCommentVideoId(prev => prev !== null ? videos[next]?.id ?? null : null);
            setAspectRatio(9 / 16);
        }
    }, [currentIdx, videos, hasMore, loadMore]);


    useEffect(() => {
        const el = desktopRef.current;
        if (!el) return;
        const handler = (e) => {
            e.preventDefault();
            go(e.deltaY > 0 ? 1 : -1);
        };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, [go]);

    const handleKeyDown = useCallback((e) => {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        if (e.key === 'ArrowDown' || e.key === 'j') go(1);
        if (e.key === 'ArrowUp' || e.key === 'k') go(-1);
    }, [go]);

    const emptyMessage = feedType === 'following'
        ? 'Những người bạn follow chưa đăng video nào'
        : 'Không có video nào. Hãy theo dõi thêm creator!';

    return (
        <PageLayout noPadding>
            {/*  MOBILE layout */}
            {isMobile && (
                <div className="md:hidden flex-1 flex flex-col overflow-hidden h-full">
                    <MobileFeed
                        videos={videos}
                        loading={loading}
                        hasMore={hasMore}
                        loadMore={loadMore}
                    />
                </div>
            )}

            {/*  DESKTOP layout */}
            {!isMobile && (
                <div
                    ref={desktopRef}
                    className="hidden md:flex relative w-full h-full flex-row outline-none select-none overflow-hidden bg-base"
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                >
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center"><BounceDots /></div>
                    ) : current ? (
                        <>
                            <div className="flex-1 relative flex items-center justify-center">
                                <div className="flex items-end relative" style={{ gap: 16 }}>
                                    <div
                                        className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-2xl"
                                        style={{ width: containerSize.width, height: containerSize.height, background: '#000' }}
                                    >
                                        <VideoCard
                                            key={current.id}
                                            video={current}
                                            isActive
                                            hideActions
                                            hideTopBar
                                            onRatio={(r) => setAspectRatio(r)}
                                            onComment={() => setCommentVideoId(current.id)}
                                        />
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col items-center pb-3">
                                        <VideoCardActions
                                            key={current.id + '-actions'}
                                            video={current}
                                            inline
                                            onComment={() => setCommentVideoId(current.id)}
                                        />
                                    </div>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[350]">
                                    <NavArrow direction="up" onClick={() => go(-1)} disabled={currentIdx === 0} />
                                    <NavArrow direction="down" onClick={() => go(1)} disabled={currentIdx === videos.length - 1} />
                                </div>
                            </div>
                            {showComments && (
                                <div
                                    className="w-[420px] h-full bg-[#121212] border-l border-white/10 shrink-0 shadow-2xl z-40"
                                    onWheel={(e) => e.stopPropagation()}
                                >
                                    <CommentPanel
                                        videoId={commentVideoId}
                                        totalComments={current.comments}
                                        onClose={() => setCommentVideoId(null)}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 font-body text-white/25">
                            <p style={{ fontSize: 14 }}>{emptyMessage}</p>
                        </div>
                    )}
                </div>
            )}
        </PageLayout>
    );
}