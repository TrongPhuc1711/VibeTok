import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileVideoFeedModal from '../components/profile/ProfileVideoFeedModal';
import PageLayout from '../components/layout/PageLayout/PageLayout';
import UserDropdown from '../components/layout/UserDropdown';
import { formatCount } from '../utils/formatters';
import api from '../api/api';
import { globalSearch } from '../services/exploreService';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons/CommonIcons';

const CATEGORY_TABS = [
  { id: 'all', label: 'Tất cả', keywords: [] },
  { id: 'music', label: 'Ca hát & Khiêu vũ', keywords: ['dance', 'nhảy', 'ca', 'hát', 'music', 'nhạc'] },
  { id: 'giaitri', label: 'Giải Trí', keywords: ['funny', 'hài', 'vui', 'giải trí', 'entertainment'] },
  { id: 'sports', label: 'Thể Thao', keywords: ['sport', 'thểthao', 'bóng', 'gym', 'fitness'] },
  { id: 'anime', label: 'Truyện tranh', keywords: ['anime', 'manga', 'cartoon', 'hoạthình'] },
  { id: 'love', label: 'Mối quan hệ', keywords: ['love', 'tình', 'yêu', 'couple'] },
  { id: 'show', label: 'Chương trình', keywords: ['show', 'gameshow', 'reality'] },
  { id: 'lipsync', label: 'Hát nhép', keywords: ['lipsync', 'cover', 'nhép'] },
  { id: 'lifestyle', label: 'Đời Sống', keywords: ['lifestyle', 'sống', 'daily', 'vlog'] },
  { id: 'comedy', label: 'Hài hước', keywords: ['comedy', 'hài', 'joke', 'funny', 'cười'] },
  { id: 'food', label: 'Ẩm Thực', keywords: ['food', 'ăn', 'ẩmthực', 'cooking', 'nấu'] },
  { id: 'travel', label: 'Du Lịch', keywords: ['travel', 'dulịch', 'trip', 'phượt', 'tour'] },
  { id: 'beauty', label: 'Làm Đẹp', keywords: ['beauty', 'makeup', 'skincare', 'làmđẹp'] },
  { id: 'gaming', label: 'Game', keywords: ['game', 'gaming', 'esport', 'stream'] },
];

const THUMB_GRADIENTS = [
  ['#1a0520', '#3d0b3d'], ['#050f1a', '#0b2d3d'], ['#0a1505', '#1a3d0b'],
  ['#1a0505', '#3d1a0b'], ['#05051a', '#0b0b3d'], ['#0f0a00', '#2d1e00'],
  ['#001a1a', '#003d3d'], ['#1a0014', '#3d0033'],
];

function filterVideosByCategory(videos, category) {
  if (category.id === 'all' || category.keywords.length === 0) return videos;
  return videos.filter(v => {
    const text = (v.caption || '').toLowerCase();
    return category.keywords.some(kw => text.includes(kw.toLowerCase()));
  });
}

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
      <span className="text-[#aaa] text-[10px] md:text-[11px] font-body truncate hover:text-white transition-colors">
        {user.username || 'vibetok'}
      </span>
    </div>
  );
}

function VideoGrid({ videos, loading, onVideoClick }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-0.5 md:gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="rounded-sm md:rounded-lg animate-pulse bg-[#1a1a26]"
              style={{ aspectRatio: '9/16' }} />
            <div className="flex items-center gap-1 mt-1 px-0.5">
              <div className="w-[15px] h-[15px] rounded-full bg-[#1a1a26] animate-pulse flex-shrink-0" />
              <div className="h-2 w-16 rounded bg-[#1a1a26] animate-pulse" />
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
        <p className="text-sm font-body text-center px-4">Không tìm thấy video nào trong danh mục này</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-0.5 md:gap-1">
      {videos.map((v, i) => (
        <div key={v.id ?? i}>
          <VideoThumbnail video={v} style={{ aspectRatio: '9/16', width: '100%' }} onClick={() => v.id && onVideoClick?.(i)} />
          <VideoCredit video={v} />
        </div>
      ))}
    </div>
  );
}

/* ── Search Result Components ── */

function UserResultCard({ user }) {
  const navigate = useNavigate();
  const initials = user.initials || (user.fullName || user.username || 'U').charAt(0).toUpperCase();

  return (
    <button
      onClick={() => navigate(`/profile/${user.username}`)}
      className="flex items-center gap-3 px-4 py-3 bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl hover:border-[#ff2d78]/30 transition-all cursor-pointer w-full text-left group"
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden"
        style={{ background: user.anh_dai_dien ? 'transparent' : `hsl(${(user.username?.charCodeAt(0) || 0) * 47 % 360}, 55%, 45%)` }}>
        {user.anh_dai_dien
          ? <img src={user.anh_dai_dien} alt="" className="w-full h-full object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-[13px] font-semibold font-body leading-tight m-0 truncate group-hover:text-[#ff2d78] transition-colors">
          {user.fullName || user.username}
        </p>
        <p className="text-[#555] text-[11px] font-body m-0">@{user.username}</p>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-body text-[#555] shrink-0">
        <span>{formatCount(user.followers ?? 0)} followers</span>
        {user.isCreator && (
          <span className="px-1.5 py-0.5 rounded bg-[#ff2d78]/15 text-[#ff2d78] text-[9px] font-semibold">Creator</span>
        )}
      </div>
    </button>
  );
}

function HashtagResultCard({ hashtag }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/explore?q=${encodeURIComponent(hashtag.tag)}`)}
      className="flex items-center gap-3 px-4 py-3 bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl hover:border-[#7c3aed]/30 transition-all cursor-pointer group"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#06b6d4]/20 flex items-center justify-center shrink-0">
        <span className="text-lg">#</span>
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-white text-[13px] font-semibold font-body m-0 group-hover:text-[#7c3aed] transition-colors">
          {hashtag.tag}
        </p>
        <p className="text-[#555] text-[11px] font-body m-0">{formatCount(hashtag.videos ?? 0)} video</p>
      </div>
    </button>
  );
}

function SearchResults({ results, loading, query }) {
  const { videos = [], users = [], hashtags = [] } = results;
  const hasResults = videos.length > 0 || users.length > 0 || hashtags.length > 0;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Users skeleton */}
        <div>
          <div className="h-3 w-28 rounded bg-[#1a1a26] animate-pulse mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-[#1a1a26] animate-pulse" />
            ))}
          </div>
        </div>
        {/* Videos skeleton */}
        <div>
          <div className="h-3 w-20 rounded bg-[#1a1a26] animate-pulse mb-3" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-0.5 md:gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-sm md:rounded-lg animate-pulse bg-[#1a1a26]" style={{ aspectRatio: '9/16' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#444]">
        <span className="text-4xl">🔍</span>
        <p className="text-sm font-body text-center px-4">
          Không tìm thấy kết quả cho "<span className="text-white">{query}</span>"
        </p>
        <p className="text-[12px] font-body text-[#333]">Hãy thử tìm kiếm với từ khóa khác</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Users */}
      {users.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white text-[13px] font-semibold font-body">Tài khoản</span>
            <span className="text-[#555] text-[11px] font-body">{users.length}</span>
          </div>
          <div className="space-y-2">
            {users.map(u => <UserResultCard key={u.id} user={u} />)}
          </div>
        </div>
      )}

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white text-[13px] font-semibold font-body">Hashtag</span>
            <span className="text-[#555] text-[11px] font-body">{hashtags.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {hashtags.map(h => <HashtagResultCard key={h.id} hashtag={h} />)}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white text-[13px] font-semibold font-body">Video</span>
            <span className="text-[#555] text-[11px] font-body">{videos.length}</span>
          </div>
          <VideoGrid videos={videos} loading={false} onVideoClick={(idx) => openVideoFeed(videos, idx)} />
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [allVideos, setAllVideos] = useState([]);
  const [displayVideos, setDisplayVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryCount, setCategoryCount] = useState({});
  const [searchResults, setSearchResults] = useState({ videos: [], users: [], hashtags: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  // Video feed modal state
  const [feedModalOpen, setFeedModalOpen] = useState(false);
  const [feedModalVideos, setFeedModalVideos] = useState([]);
  const [feedModalIndex, setFeedModalIndex] = useState(0);

  const openVideoFeed = useCallback((videos, index) => {
    setFeedModalVideos(videos);
    setFeedModalIndex(index);
    setFeedModalOpen(true);
  }, []);
  const tabsRef = useRef(null);
  const searchTimerRef = useRef(null);

  const fetchAllVideos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/videos/feed', { params: { type: 'forYou', page: 1, limit: 50 } });
      const videos = res.data.videos || [];
      setAllVideos(videos);
      const counts = { all: videos.length };
      CATEGORY_TABS.forEach(cat => {
        if (cat.id !== 'all') counts[cat.id] = filterVideosByCategory(videos, cat).length;
      });
      setCategoryCount(counts);
      return videos;
    } catch {
      setAllVideos([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllVideos(); }, []);

  // Category filtering (khi không tìm kiếm)
  useEffect(() => {
    if (isSearchMode) return;
    const category = CATEGORY_TABS.find(t => t.id === activeTab) || CATEGORY_TABS[0];
    setDisplayVideos(filterVideosByCategory(allVideos, category));
  }, [activeTab, allVideos, isSearchMode]);

  // Debounced search
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setIsSearchMode(false);
      setSearchResults({ videos: [], users: [], hashtags: [] });
      return;
    }
    setIsSearchMode(true);
    setSearchLoading(true);
    try {
      const res = await globalSearch({ q: q.trim(), limit: 20 });
      setSearchResults(res.data);
    } catch {
      setSearchResults({ videos: [], users: [], hashtags: [] });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setSearchResults({ videos: [], users: [], hashtags: [] });
      return;
    }
    searchTimerRef.current = setTimeout(() => doSearch(searchQuery), 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery, doSearch]);

  const scrollTabs = dir => tabsRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setSearchResults({ videos: [], users: [], hashtags: [] });
  };

  return (
    <PageLayout>
      {/* ── Top bar ── */}
      <div className="flex items-center border-b border-[#1a1a26] shrink-0 bg-base" style={{ height: 48 }}>

        {/* Mobile: left arrow hidden, desktop: show */}
        <button onClick={() => scrollTabs(-1)}
          className="hidden md:flex shrink-0 w-8 h-full items-center justify-center bg-transparent border-none cursor-pointer text-[#555] hover:text-white transition-colors">
          <ArrowLeftIcon />
        </button>

        {/* Tabs */}
        <div ref={tabsRef} className="flex-1 flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CATEGORY_TABS.map(tab => {
            const count = categoryCount[tab.id];
            return (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); handleClearSearch(); }}
                className="shrink-0 px-3 md:px-4 h-full flex items-center gap-1 border-none bg-transparent cursor-pointer transition-all whitespace-nowrap relative font-body"
                style={{
                  fontSize: 12,
                  color: !isSearchMode && activeTab === tab.id ? '#fff' : '#777',
                  fontWeight: !isSearchMode && activeTab === tab.id ? 600 : 400,
                }}
              >
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className="text-[8px] px-1 py-px rounded-full font-bold hidden md:inline"
                    style={{
                      background: !isSearchMode && activeTab === tab.id ? 'rgba(255,45,120,0.2)' : 'rgba(255,255,255,0.08)',
                      color: !isSearchMode && activeTab === tab.id ? '#ff2d78' : '#555',
                    }}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
                {!isSearchMode && activeTab === tab.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-white rounded-t" />
                )}
              </button>
            );
          })}
        </div>

        <button onClick={() => scrollTabs(1)}
          className="hidden md:flex shrink-0 w-8 h-full items-center justify-center bg-transparent border-none cursor-pointer text-[#555] hover:text-white transition-colors">
          <ArrowRightIcon />
        </button>

        <div className="w-px h-5 bg-[#2a2a3e] shrink-0 mx-1 md:mx-2" />

        {/* Mobile: search icon toggle; Desktop: full search */}
        <div className="flex items-center gap-2 pr-2 md:pr-3 shrink-0">
          {/* Mobile search toggle */}
          <button
            onClick={() => setShowSearch(s => !s)}
            className="md:hidden w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-[#888]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="6.5" cy="6.5" r="5" />
              <path d="M11 11l3 3" />
            </svg>
          </button>

          {/* Desktop search */}
          <div className={`hidden md:flex items-center gap-2 border rounded-lg px-3 py-1.5 w-[220px] transition-colors ${
            isSearchMode ? 'bg-[#1a1a26] border-[#ff2d78]/30' : 'bg-[#1a1a26] border-[#2a2a3e]'
          }`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={isSearchMode ? '#ff2d78' : '#555'} strokeWidth="1.2" strokeLinecap="round">
              <circle cx="5" cy="5" r="4" /><path d="M8.5 8.5l2.5 2.5" />
            </svg>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm người dùng, hashtag, video..."
              className="bg-transparent border-none outline-none text-white text-[11px] font-body w-full placeholder:text-[#444]" />
            {searchQuery && (
              <button onClick={handleClearSearch}
                className="bg-transparent border-none text-[#555] hover:text-white cursor-pointer text-sm transition-colors">×</button>
            )}
          </div>

          {/* Desktop user dropdown */}
          <div className="hidden md:block">
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Mobile search bar (expandable) */}
      {showSearch && (
        <div className="md:hidden px-3 py-2 border-b border-[#1a1a26] bg-base shrink-0">
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-colors ${
            isSearchMode ? 'bg-[#1a1a26] border-[#ff2d78]/30' : 'bg-[#1a1a26] border-[#2a2a3e]'
          }`}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={isSearchMode ? '#ff2d78' : '#555'} strokeWidth="1.2" strokeLinecap="round">
              <circle cx="5.5" cy="5.5" r="4.5" /><path d="M9 9l3 3" />
            </svg>
            <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm người dùng, hashtag, video..."
              className="flex-1 bg-transparent border-none outline-none text-white text-[13px] font-body placeholder:text-[#444]" />
            {searchQuery && (
              <button onClick={handleClearSearch} className="bg-transparent border-none text-[#555] cursor-pointer text-lg">×</button>
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto bg-base">
        <div className="p-1 md:p-3">
          {isSearchMode ? (
            <>
              <div className="mb-3 px-1 flex items-center gap-2">
                <span className="text-[#888] text-[12px] font-body">Kết quả cho</span>
                <span className="text-white text-[12px] font-semibold font-body">"{searchQuery}"</span>
              </div>
              <SearchResults results={searchResults} loading={searchLoading} query={searchQuery} />
            </>
          ) : (
            <VideoGrid videos={displayVideos} loading={loading} onVideoClick={(idx) => openVideoFeed(displayVideos, idx)} />
          )}
        </div>
      </div>

      {/* Video Feed Modal */}
      {feedModalOpen && feedModalVideos.length > 0 && (
        <ProfileVideoFeedModal
          videos={feedModalVideos}
          initialIndex={feedModalIndex}
          onClose={() => setFeedModalOpen(false)}
        />
      )}
    </PageLayout>
  );
}