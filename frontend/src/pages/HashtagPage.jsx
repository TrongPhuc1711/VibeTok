import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileVideoFeedModal from '../components/profile/ProfileVideoFeedModal';
import PageLayout from '../components/layout/PageLayout/PageLayout';
import { formatCount } from '../utils/formatters';
import { getHashtagInfo, getVideosByHashtag } from '../services/exploreService';
import { useTheme } from '../contexts/ThemeContext';

/* ── Gradient palette for video thumbnails ── */
const THUMB_GRADIENTS = [
  ['#1a0520', '#3d0b3d'], ['#050f1a', '#0b2d3d'], ['#0a1505', '#1a3d0b'],
  ['#1a0505', '#3d1a0b'], ['#05051a', '#0b0b3d'], ['#0f0a00', '#2d1e00'],
  ['#001a1a', '#003d3d'], ['#1a0014', '#3d0033'],
];

/* ── Video Thumbnail ── */
function VideoThumbnail({ video, style = {}, onClick }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);
  const idx = (parseInt(String(video.id).slice(-2) || '0', 16) || 0) % THUMB_GRADIENTS.length;
  const [g1, g2] = THUMB_GRADIENTS[idx];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) v.play().catch(() => {});
    else { v.pause(); v.currentTime = 0; }
  }, [hovered]);

  return (
    <div
      className="relative rounded-sm md:rounded-lg overflow-hidden cursor-pointer group"
      style={{ ...style, background: `linear-gradient(160deg, ${g1}, ${g2})` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {video.thumbnail && (
        <img src={video.thumbnail} alt={video.caption}
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => { e.target.style.display = 'none'; }} />
      )}
      {video.videoUrl && (
        <video ref={videoRef} src={video.videoUrl} muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }} />
      )}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 md:px-2 md:pb-2 flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="text-white text-[10px] md:text-[12px] font-semibold font-body drop-shadow">
          {formatCount(video.likes ?? 0)}
        </span>
      </div>
    </div>
  );
}

/* ── Video Credit ── */
function VideoCredit({ video }) {
  const navigate = useNavigate();
  const user = video.user ?? {};
  return (
    <div className="flex items-center gap-1 mt-1 px-0.5 cursor-pointer"
      onClick={() => user.username && navigate(`/profile/${user.username}`)}>
      <div className="w-[15px] h-[15px] md:w-[18px] md:h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[6px] md:text-[7px] font-bold text-white overflow-hidden"
        style={{ background: `hsl(${(user.username?.charCodeAt(0) || 0) * 47 % 360}, 60%, 40%)` }}>
        {user.anh_dai_dien
          ? <img src={user.anh_dai_dien} alt="" className="w-full h-full object-cover" />
          : (user.initials?.[0] || user.username?.[0]?.toUpperCase() || 'U')}
      </div>
      <span className="text-[10px] md:text-[11px] font-body truncate hover:text-white transition-colors"
        style={{ color: 'var(--vt-text-hint)' }}>
        {user.username || 'vibetok'}
      </span>
    </div>
  );
}

/* ── Loading Skeleton ── */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-0.5 md:gap-1">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <div className="rounded-sm md:rounded-lg animate-pulse"
            style={{ aspectRatio: '9/16', background: 'var(--vt-skeleton)' }} />
          <div className="flex items-center gap-1 mt-1 px-0.5">
            <div className="w-[15px] h-[15px] rounded-full animate-pulse flex-shrink-0" style={{ background: 'var(--vt-skeleton)' }} />
            <div className="h-2 w-16 rounded animate-pulse" style={{ background: 'var(--vt-skeleton)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main HashtagPage ── */
export default function HashtagPage() {
  const { tagName } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [hashtag, setHashtag] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);

  // Video feed modal
  const [feedModalOpen, setFeedModalOpen] = useState(false);
  const [feedModalIndex, setFeedModalIndex] = useState(0);

  const scrollRef = useRef(null);

  // Fetch hashtag info + first page of videos
  useEffect(() => {
    if (!tagName) return;
    setLoading(true);
    setError(false);
    setVideos([]);
    setPage(1);
    setHashtag(null);

    Promise.all([
      getHashtagInfo(tagName).catch(() => ({ data: { hashtag: null } })),
      getVideosByHashtag(tagName, { page: 1, limit: 18 }).catch(() => ({ data: { videos: [], hasMore: false, total: 0 } })),
    ]).then(([infoRes, videosRes]) => {
      setHashtag(infoRes.data.hashtag);
      const vids = videosRes.data.videos || [];
      setVideos(vids);
      setHasMore(videosRes.data.hasMore ?? false);
      if (!infoRes.data.hashtag && vids.length === 0) setError(true);
    }).finally(() => setLoading(false));
  }, [tagName]);

  // Load more videos
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getVideosByHashtag(tagName, { page: nextPage, limit: 18 });
      const newVids = res.data.videos || [];
      setVideos(prev => [...prev, ...newVids]);
      setHasMore(res.data.hasMore ?? false);
      setPage(nextPage);
    } catch { /* ignore */ }
    finally { setLoadingMore(false); }
  }, [tagName, page, hasMore, loadingMore]);

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
        loadMore();
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [loadMore]);

  const openVideoFeed = useCallback((index) => {
    setFeedModalIndex(index);
    setFeedModalOpen(true);
  }, []);

  const handleShare = () => {
    const url = `${window.location.origin}/tag/${tagName}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <PageLayout>
      <div ref={scrollRef} className="flex-1 overflow-auto bg-base">

        {/* ── Header ── */}
        <div
          className="relative overflow-hidden"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.08) 50%, rgba(255,45,120,0.1) 100%)'
              : 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.05) 50%, rgba(255,45,120,0.06) 100%)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {/* Decorative blur circles */}
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #ff2d78 0%, transparent 70%)' }} />

          <div className="relative z-10 flex items-center gap-4 md:gap-6 px-4 md:px-8 py-6 md:py-8">
            {/* Hash icon */}
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))'
                  : 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))',
                border: `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)'}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <span className="text-3xl md:text-4xl font-display font-extrabold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                #
              </span>
            </div>

            {/* Tag info */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <>
                  <div className="h-7 w-48 rounded-lg animate-pulse mb-2" style={{ background: 'var(--vt-skeleton)' }} />
                  <div className="h-4 w-32 rounded animate-pulse" style={{ background: 'var(--vt-skeleton)' }} />
                </>
              ) : (
                <>
                  <h1
                    className="text-2xl md:text-3xl font-display font-extrabold m-0 mb-1 truncate"
                    style={{ color: 'var(--vt-text-bright)' }}
                  >
                    #{tagName}
                  </h1>
                  <p className="text-sm md:text-base font-body m-0"
                    style={{ color: 'var(--vt-text-hint)' }}>
                    <span className="font-semibold" style={{ color: 'var(--vt-text-caption)' }}>
                      {formatCount(hashtag?.videos ?? videos.length)}
                    </span>
                    {' '}bài đăng
                  </p>

                  {/* Related hashtags chips */}
                  {hashtag?.relatedTags?.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {hashtag.relatedTags.slice(0, 10).map(rt => (
                        <button
                          key={rt.id}
                          onClick={() => navigate(`/tag/${rt.tag.replace('#', '')}`)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-body font-medium border-none cursor-pointer transition-all hover:scale-105 active:scale-95"
                          style={{
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                            color: 'var(--vt-text-caption)',
                          }}
                        >
                          {rt.tag} <span style={{ color: 'var(--vt-text-disabled)', marginLeft: 2 }}>{formatCount(rt.videos)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Share button */}
            {!loading && (
              <button
                onClick={handleShare}
                className="shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  color: 'var(--vt-text-hint)',
                }}
                title="Chia sẻ"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/*  Video Grid  */}
        <div className="p-1 md:p-3">
          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            /* Error / Not Found */
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                }}
              >
                <span className="text-4xl opacity-40">#</span>
              </div>
              <p className="text-sm font-body text-center px-4" style={{ color: 'var(--vt-text-ghost)' }}>
                Không tìm thấy hashtag <span style={{ color: 'var(--vt-text-hint)' }}>#{tagName}</span>
              </p>
              <button
                onClick={() => navigate('/explore')}
                className="text-[13px] font-body font-semibold px-5 py-2 rounded-full border-none cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  color: '#fff',
                }}
              >
                Khám phá
              </button>
            </div>
          ) : videos.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--vt-text-ghost)' }}>
              <p className="text-sm font-body text-center px-4">
                Chưa có video nào cho hashtag <span style={{ color: 'var(--vt-text-hint)' }}>#{tagName}</span>
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-0.5 md:gap-1">
                {videos.map((v, i) => (
                  <div key={v.id ?? i}>
                    <VideoThumbnail
                      video={v}
                      style={{ aspectRatio: '9/16', width: '100%' }}
                      onClick={() => openVideoFeed(i)}
                    />
                    <VideoCredit video={v} />
                  </div>
                ))}
              </div>

              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <div className="flex items-center gap-2" style={{ color: 'var(--vt-text-disabled)' }}>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px] font-body">Đang tải thêm...</span>
                  </div>
                </div>
              )}

              {/* End of list */}
              {!hasMore && videos.length > 0 && !loadingMore && (
                <div className="flex justify-center py-6">
                  <span className="text-[11px] font-body" style={{ color: 'var(--vt-text-ghost)' }}>
                    Đã hiển thị tất cả {formatCount(videos.length)} video
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Video Feed Modal */}
      {feedModalOpen && videos.length > 0 && (
        <ProfileVideoFeedModal
          videos={videos}
          initialIndex={feedModalIndex}
          onClose={() => setFeedModalOpen(false)}
        />
      )}
    </PageLayout>
  );
}
