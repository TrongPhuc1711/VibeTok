import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout/PageLayout';
import UserDropdown from '../components/layout/UserDropdown';
import { formatCount } from '../utils/formatters';
import api from '../api/api';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons/CommonIcons';

/* ── Danh mục tab với từ khóa tìm kiếm tương ứng ── */
const CATEGORY_TABS = [
  { id: 'all',       label: 'Tất cả',                keywords: []                                          },
  { id: 'music',     label: 'Ca hát & Khiêu vũ',     keywords: ['dance','nhảy','ca','hát','music','nhạc']  },
  { id: 'giaitri',   label: 'Giải Trí',               keywords: ['funny','hài','vui','giải trí','entertainment'] },
  { id: 'sports',    label: 'Thể Thao',               keywords: ['sport','thểthao','bóng','gym','fitness']  },
  { id: 'anime',     label: 'Truyện tranh & Hoạt hình',keywords: ['anime','manga','cartoon','hoạthình']     },
  { id: 'love',      label: 'Mối quan hệ',            keywords: ['love','tình','yêu','couple']              },
  { id: 'show',      label: 'Chương trình',            keywords: ['show','gameshow','reality']               },
  { id: 'lipsync',   label: 'Hát nhép',               keywords: ['lipsync','cover','nhép']                  },
  { id: 'lifestyle', label: 'Đời Sống',               keywords: ['lifestyle','sống','daily','vlog']         },
  { id: 'comedy',    label: 'Hài hước',               keywords: ['comedy','hài','joke','funny','cười']      },
  { id: 'food',      label: 'Ẩm Thực',                keywords: ['food','ăn','ẩmthực','cooking','nấu']      },
  { id: 'travel',    label: 'Du Lịch',                keywords: ['travel','dulịch','trip','phượt','tour']   },
  { id: 'beauty',    label: 'Làm Đẹp',               keywords: ['beauty','makeup','skincare','làmđẹp']     },
  { id: 'gaming',    label: 'Game',                   keywords: ['game','gaming','esport','stream']          },
];

const THUMB_GRADIENTS = [
  ['#1a0520','#3d0b3d'],['#050f1a','#0b2d3d'],['#0a1505','#1a3d0b'],
  ['#1a0505','#3d1a0b'],['#05051a','#0b0b3d'],['#0f0a00','#2d1e00'],
  ['#001a1a','#003d3d'],['#1a0014','#3d0033'],
];

/* ── Hàm lọc video theo danh mục ── */
function filterVideosByCategory(videos, category) {
  if (category.id === 'all' || category.keywords.length === 0) return videos;
  return videos.filter(v => {
    const text = (v.caption || '').toLowerCase();
    return category.keywords.some(kw => text.includes(kw.toLowerCase()));
  });
}

/* ── VideoThumbnail ── */
function VideoThumbnail({ video, style = {} }) {
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
      className="relative rounded-lg overflow-hidden cursor-pointer group"
      style={{ ...style, background: `linear-gradient(160deg, ${g1}, ${g2})` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {video.thumbnail && (
        <img
          src={video.thumbnail}
          alt={video.caption}
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}
      {video.videoUrl && (
        <video
          ref={videoRef}
          src={video.videoUrl}
          muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }}
      />
      {video.caption && hovered && (
        <div
          className="absolute top-0 left-0 right-0 p-2 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
        >
          <p className="text-white text-[11px] font-body leading-tight line-clamp-2">{video.caption}</p>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 flex items-center gap-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="text-white text-[12px] font-semibold font-body drop-shadow">
          {formatCount(video.likes ?? 0)}
        </span>
      </div>
      {!hovered && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z"/></svg>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCredit({ video }) {
  const navigate = useNavigate();
  const user = video.user ?? {};
  return (
    <div
      className="flex items-center gap-1.5 mt-1.5 px-0.5 cursor-pointer"
      onClick={() => user.username && navigate(`/profile/${user.username}`)}
    >
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

/* ── VideoGrid ── */
function VideoGrid({ videos, loading }) {
  if (loading) {
    return (
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="rounded-lg animate-pulse bg-[#1a1a26]"
              style={{ aspectRatio: i % 5 === 0 ? '9/18' : '9/16' }} />
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
        <p className="text-sm font-body">Không tìm thấy video nào trong danh mục này</p>
        <p className="text-xs font-body text-[#333]">Thử chọn danh mục khác hoặc xem tất cả</p>
      </div>
    );
  }

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
      {videos.map((v, i) => {
        const isTall = i % 7 === 0 || i % 11 === 0;
        return (
          <div key={v.id ?? i}>
            <VideoThumbnail video={v} style={{ aspectRatio: isTall ? '9/18' : '9/16', width: '100%' }} />
            <VideoCredit video={v} />
          </div>
        );
      })}
    </div>
  );
}

/* ── SearchBar ── */
function SearchBar({ value, onChange, onSubmit, onClear }) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 bg-[#1a1a26] border border-[#2a2a3e] rounded-lg px-3.5 py-2 w-[240px]">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#555" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="5.5" cy="5.5" r="4.5"/><path d="M9 9l3 3"/>
      </svg>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder="Tìm kiếm..."
        className="flex-1 bg-transparent border-none outline-none text-white text-[12px] font-body placeholder:text-[#444]"
      />
      {value && (
        <button type="button" onClick={onClear}
          className="bg-transparent border-none text-[#555] cursor-pointer hover:text-white text-base leading-none">×</button>
      )}
    </form>
  );
}

/* ── Main Page ── */
export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allVideos, setAllVideos] = useState([]);   // toàn bộ videos đã fetch
  const [displayVideos, setDisplayVideos] = useState([]); // videos đang hiển thị
  const [loading, setLoading] = useState(true);
  const [categoryCount, setCategoryCount] = useState({}); // đếm video mỗi danh mục
  const tabsRef = useRef(null);

  /* Fetch tất cả videos 1 lần */
  const fetchAllVideos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/videos/feed', { params: { type: 'forYou', page: 1, limit: 100 } });
      const videos = res.data.videos || [];
      setAllVideos(videos);

      // Đếm video cho từng danh mục
      const counts = { all: videos.length };
      CATEGORY_TABS.forEach(cat => {
        if (cat.id !== 'all') {
          counts[cat.id] = filterVideosByCategory(videos, cat).length;
        }
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

  useEffect(() => {
    fetchAllVideos();
  }, []);

  /* Lọc khi tab hoặc search thay đổi */
  useEffect(() => {
    const category = CATEGORY_TABS.find(t => t.id === activeTab) || CATEGORY_TABS[0];
    let filtered = filterVideosByCategory(allVideos, category);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        (v.caption || '').toLowerCase().includes(q) ||
        (v.user?.username || '').toLowerCase().includes(q)
      );
    }

    setDisplayVideos(filtered);
  }, [activeTab, searchQuery, allVideos]);

  const handleSearchSubmit = e => { e.preventDefault(); };
  const handleClearSearch = () => setSearchQuery('');
  const scrollTabs = dir => tabsRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });

  const activeCategory = CATEGORY_TABS.find(t => t.id === activeTab);

  return (
    <PageLayout>
      {/* ── Top bar ── */}
      <div className="flex items-center border-b border-[#1a1a26] shrink-0 bg-base" style={{ height: 52 }}>
        <button
          onClick={() => scrollTabs(-1)}
          className="shrink-0 w-8 h-full flex items-center justify-center bg-transparent border-none cursor-pointer text-[#555] hover:text-white transition-colors"
        >
          <ArrowLeftIcon />
        </button>

        <div
          ref={tabsRef}
          className="flex-1 flex items-center overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {CATEGORY_TABS.map(tab => {
            const count = categoryCount[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                className="shrink-0 px-4 h-full flex items-center gap-1.5 border-none bg-transparent cursor-pointer transition-all whitespace-nowrap relative font-body text-[13px]"
                style={{
                  color: activeTab === tab.id ? '#fff' : '#777',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                }}
              >
                {tab.label}
                {/* Badge đếm số video */}
                {count !== undefined && count > 0 && (
                  <span
                    className="text-[9px] px-1.5 py-px rounded-full font-bold"
                    style={{
                      background: activeTab === tab.id ? 'rgba(255,45,120,0.2)' : 'rgba(255,255,255,0.08)',
                      color: activeTab === tab.id ? '#ff2d78' : '#555',
                    }}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-white rounded-t" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => scrollTabs(1)}
          className="shrink-0 w-8 h-full flex items-center justify-center bg-transparent border-none cursor-pointer text-[#555] hover:text-white transition-colors"
        >
          <ArrowRightIcon />
        </button>

        <div className="w-px h-6 bg-[#2a2a3e] shrink-0 mx-2" />

        <div className="flex items-center gap-2 pr-3 shrink-0">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
            onClear={handleClearSearch}
          />
          <UserDropdown />
        </div>
      </div>

      {/* ── Subheader: tên danh mục + số lượng ── */}
      {activeTab !== 'all' && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1a1a26] shrink-0 bg-base">
          <span className="text-white text-[13px] font-semibold font-body">
            {activeCategory?.label}
          </span>
          {displayVideos.length > 0 && (
            <span className="text-[#555] text-[11px] font-body">
              {displayVideos.length} video
            </span>
          )}
          {/* Nút xem tất cả */}
          <button
            onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
            className="ml-auto text-[11px] font-body text-[#555] hover:text-white bg-transparent border-none cursor-pointer transition-colors"
          >
            Xem tất cả →
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto bg-base">
        <div className="p-3">
          {/* Header khi có search */}
          {searchQuery && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[#888] text-[13px] font-body">
                Kết quả tìm kiếm cho "{searchQuery}":
              </span>
              <span className="text-white text-[13px] font-semibold font-body">
                {displayVideos.length} video
              </span>
            </div>
          )}

          <VideoGrid videos={displayVideos} loading={loading} />

          {!loading && displayVideos.length > 0 && displayVideos.length >= 12 && (
            <div className="flex justify-center py-8">
              <button
                onClick={fetchAllVideos}
                className="text-[#555] text-[12px] font-body hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
                Tải thêm
              </button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}