import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout/PageLayout';
import UserDropdown from '../components/layout/UserDropdown';
import { useExplore } from '../hooks/useExplore';
import { formatCount } from '../utils/formatters';
import api from '../api/api';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons/CommonIcons';

/* ── Danh mục tab cứng (giống TikTok) ── */
const CATEGORY_TABS = [
  { id: 'all',        label: 'Tất cả' },
  { id: 'music',      label: 'Ca hát & Khiêu vũ' },
  { id: 'giaitri',    label: 'Giải Trí' },
  { id: 'sports',     label: 'Thể Thao' },
  { id: 'anime',      label: 'Truyện tranh & hoạt hình' },
  { id: 'love',       label: 'Mối quan hệ' },
  { id: 'show',       label: 'Chương trình' },
  { id: 'lipsync',    label: 'Hát nhép' },
  { id: 'lifestyle',  label: 'Đời Sống' },
  { id: 'comedy',     label: 'Hài hước' },
  { id: 'food',       label: 'Ẩm Thực' },
  { id: 'travel',     label: 'Du Lịch' },
  { id: 'beauty',     label: 'Làm Đẹp' },
  { id: 'gaming',     label: 'Game' },
];

/* ── Màu gradient nền cho thumbnail không có ảnh ── */
const THUMB_GRADIENTS = [
  ['#1a0520', '#3d0b3d'],
  ['#050f1a', '#0b2d3d'],
  ['#0a1505', '#1a3d0b'],
  ['#1a0505', '#3d1a0b'],
  ['#05051a', '#0b0b3d'],
  ['#0f0a00', '#2d1e00'],
  ['#001a1a', '#003d3d'],
  ['#1a0014', '#3d0033'],
];

/* ── VideoThumbnail card ── */
function VideoThumbnail({ video, style = {} }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);

  const idx = (parseInt(String(video.id).slice(-2) || '0', 16) || 0) % THUMB_GRADIENTS.length;
  const [g1, g2] = THUMB_GRADIENTS[idx];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovered]);

  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer group"
      style={{ ...style, background: `linear-gradient(160deg, ${g1}, ${g2})` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {}}
    >
      {/* Thumbnail image */}
      {video.thumbnail && (
        <img
          src={video.thumbnail}
          alt={video.caption}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Video preview on hover */}
      {video.videoUrl && (
        <video
          ref={videoRef}
          src={video.videoUrl}
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
      )}

      {/* Decorative noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
        }}
      />

      {/* Caption chip (top overlay, only on hover) */}
      {video.caption && hovered && (
        <div
          className="absolute top-0 left-0 right-0 p-2 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
        >
          <p className="text-white text-[11px] font-body leading-tight line-clamp-2">
            {video.caption}
          </p>
        </div>
      )}

      {/* Bottom info: likes */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 flex items-center gap-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="text-white text-[12px] font-semibold font-body drop-shadow">
          {formatCount(video.likes ?? 0)}
        </span>
      </div>

      {/* Play overlay */}
      {!hovered && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Username row dưới thumbnail ── */
function VideoCredit({ video }) {
  const navigate = useNavigate();
  const user = video.user ?? {};

  return (
    <div
      className="flex items-center gap-1.5 mt-1.5 px-0.5 cursor-pointer"
      onClick={(e) => { e.stopPropagation(); if (user.username) navigate(`/profile/${user.username}`); }}
    >
      {/* Tiny avatar */}
      <div
        className="w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white overflow-hidden"
        style={{ background: `hsl(${(user.username?.charCodeAt(0) || 0) * 47 % 360}, 60%, 40%)` }}
      >
        {user.anh_dai_dien
          ? <img src={user.anh_dai_dien} alt="" className="w-full h-full object-cover" />
          : (user.initials?.[0] || user.username?.[0]?.toUpperCase() || 'U')}
      </div>
      <span className="text-[#aaa] text-[11px] font-body truncate hover:text-white transition-colors">
        {user.username || 'vibetok'}
      </span>
    </div>
  );
}

/* ── Masonry-style grid builder ── */
function VideoGrid({ videos, loading }) {
  if (loading) {
    return (
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div
              className="rounded-lg animate-pulse bg-[#1a1a26]"
              style={{ aspectRatio: i % 5 === 0 ? '9/18' : '9/16' }}
            />
            <div className="flex items-center gap-1.5 mt-1.5 px-0.5">
              <div className="w-[18px] h-[18px] rounded-full bg-[#1a1a26] animate-pulse flex-shrink-0" />
              <div className="h-2.5 w-20 rounded bg-[#1a1a26] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#444]">
        <span className="text-4xl">🎬</span>
        <p className="text-sm font-body">Không tìm thấy video nào</p>
      </div>
    );
  }

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
      {videos.map((v, i) => {
        // Vary heights slightly: every 7th video is taller
        const isTall = i % 7 === 0 || i % 11 === 0;
        const aspectRatio = isTall ? '9/18' : '9/16';
        return (
          <div key={v.id ?? i}>
            <VideoThumbnail
              video={v}
              style={{ aspectRatio, width: '100%' }}
            />
            <VideoCredit video={v} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Search bar ── */
function SearchBar({ value, onChange, onSubmit, onClear }) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 bg-[#1a1a26] border border-[#2a2a3e] rounded-lg px-3.5 py-2 w-[240px]">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#555" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="5.5" cy="5.5" r="4.5" />
        <path d="M9 9l3 3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm kiếm..."
        className="flex-1 bg-transparent border-none outline-none text-white text-[12px] font-body placeholder:text-[#444]"
      />
      {value && (
        <button type="button" onClick={onClear} className="bg-transparent border-none text-[#555] cursor-pointer hover:text-white text-base leading-none">×</button>
      )}
    </form>
  );
}

/* ── Main Page ── */
export default function ExplorePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabsRef = useRef(null);

  /* Fetch videos from feed or search */
  const fetchVideos = async (category, q = '') => {
    setLoading(true);
    try {
      let res;
      if (q.trim()) {
        res = await api.get('/videos/search', { params: { q, limit: 24 } });
        setVideos(res.data.videos || []);
      } else {
        res = await api.get('/videos/feed', { params: { type: 'forYou', page: 1, limit: 24 } });
        setVideos(res.data.videos || []);
      }
    } catch {
      // Fallback mock thumbnails
      setVideos(Array.from({ length: 12 }).map((_, i) => ({
        id: `mock_${i}`,
        caption: ['#viral #trending 🔥', '#dance #challenge', '#funny 😂', '#food #yummy', '#travel ✈️'][i % 5],
        likes: Math.floor(Math.random() * 900000) + 1000,
        views: Math.floor(Math.random() * 5000000),
        comments: Math.floor(Math.random() * 50000),
        thumbnail: null,
        videoUrl: null,
        user: {
          username: ['lop12a8nq', 'yenthichan', 'user834861', 'giaovienc3', 'tienle.spxe', 'thutrdtmg6w'][i % 6],
          initials: 'VT',
          anh_dai_dien: null,
        },
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(activeTab);
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVideos(activeTab, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchVideos(activeTab, '');
  };

  /* Scroll tabs with arrow keys / drag */
  const scrollTabs = (dir) => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  return (
    <PageLayout>
      {/* ── Top bar: category tabs + controls ── */}
      <div
        className="flex items-center border-b border-[#1a1a26] shrink-0 bg-base"
        style={{ height: 52 }}
      >
        {/* Left arrow (hidden when not overflowing, JS-free trick via CSS) */}
        <button
          onClick={() => scrollTabs(-1)}
          className="shrink-0 w-8 h-full flex items-center justify-center bg-transparent border-none cursor-pointer text-[#555] hover:text-white transition-colors"
        >
          <ArrowLeftIcon/>
        </button>

        {/* Scrollable category tabs */}
        <div
          ref={tabsRef}
          className="flex-1 flex items-center overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="shrink-0 px-4 h-full flex items-center border-none bg-transparent cursor-pointer transition-all whitespace-nowrap relative font-body text-[13px]"
              style={{
                color: activeTab === tab.id ? '#fff' : '#777',
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-[2px] bg-white rounded-t"
                />
              )}
            </button>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scrollTabs(1)}
          className="shrink-0 w-8 h-full flex items-center justify-center bg-transparent border-none cursor-pointer text-[#555] hover:text-white transition-colors"
        >
            
          <ArrowRightIcon/>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-[#2a2a3e] shrink-0 mx-2" />

        {/* Search + user controls */}
        <div className="flex items-center gap-2 pr-3 shrink-0">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearch}
            onClear={handleClearSearch}
          />

          {/* User dropdown */}
          <UserDropdown />
        </div>
      </div>

      {/* ── Main content: video grid ── */}
      <div className="flex-1 overflow-auto bg-base">
        <div className="p-3">
          <VideoGrid videos={videos} loading={loading} />

          {/* Load more hint */}
          {!loading && videos.length >= 12 && (
            <div className="flex justify-center py-8">
              <button
                onClick={() => fetchVideos(activeTab, searchQuery)}
                className="text-[#555] text-[12px] font-body hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
                Xem thêm
              </button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}