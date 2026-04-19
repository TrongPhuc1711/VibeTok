import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from '../../../icons/NavIcons';
import { globalSearch } from '../../../services/exploreService';
import { formatCount } from '../../../utils/formatters';

/* ── Close (X) Icon ── */
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" />
    </svg>
  );
}

/* ── Trending search icon ── */
function TrendingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#555" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="6" cy="6" r="4.5" />
      <path d="M9.5 9.5L13 13" />
    </svg>
  );
}

/* ── User suggestion item ── */
function UserSuggestion({ user, onClick }) {
  const initials = (user.fullName || user.username || 'U').charAt(0).toUpperCase();
  return (
    <button
      onClick={() => onClick(user)}
      className="flex items-center gap-3 w-full px-4 py-2.5 bg-transparent border-none cursor-pointer transition-colors hover:bg-white/5 text-left group"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden"
        style={{
          background: user.anh_dai_dien
            ? 'transparent'
            : `hsl(${(user.username?.charCodeAt(0) || 0) * 47 % 360}, 55%, 45%)`,
        }}
      >
        {user.anh_dai_dien ? (
          <img src={user.anh_dai_dien} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-[13px] font-semibold font-body m-0 truncate group-hover:text-[#ff2d78] transition-colors">
          {user.username}
        </p>
        <p className="text-[#555] text-[11px] font-body m-0 truncate">
          {user.fullName || user.username}
          {user.followers > 0 && ` · ${formatCount(user.followers)} followers`}
        </p>
      </div>
    </button>
  );
}

/* ── Content/Video suggestion item ── */
function ContentSuggestion({ video, onClick }) {
  return (
    <button
      onClick={() => onClick(video)}
      className="flex items-center gap-3 w-full px-4 py-2.5 bg-transparent border-none cursor-pointer transition-colors hover:bg-white/5 text-left group"
    >
      <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#1a1a26] shrink-0 flex items-center justify-center">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#555" strokeWidth="1.2">
            <path d="M5 2L12 7L5 12V2Z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#ccc] text-[13px] font-body m-0 truncate group-hover:text-white transition-colors">
          {video.caption || 'Video'}
        </p>
        <p className="text-[#444] text-[11px] font-body m-0 truncate">
          {video.user?.username && `@${video.user.username}`}
          {video.likes > 0 && ` · ${formatCount(video.likes)} likes`}
        </p>
      </div>
    </button>
  );
}

/* ── Keyword suggestion item ── */
function KeywordSuggestion({ text, onClick }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="flex items-center gap-3 w-full px-4 py-2.5 bg-transparent border-none cursor-pointer transition-colors hover:bg-white/5 text-left group"
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent shrink-0">
        <TrendingIcon />
      </div>
      <span className="text-[#ccc] text-[13px] font-body group-hover:text-white transition-colors truncate">
        {text}
      </span>
    </button>
  );
}

/* ── Skeleton loading ── */
function SuggestionSkeleton() {
  return (
    <div className="px-4 py-2.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-[#1a1a26] animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-28 rounded bg-[#1a1a26] animate-pulse" />
        <div className="h-2.5 w-20 rounded bg-[#1a1a26] animate-pulse" />
      </div>
    </div>
  );
}


export default function SearchPanel({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ videos: [], users: [], hashtags: [] });
  const [loading, setLoading] = useState(false);
  const searchTimerRef = useRef(null);

  // Auto-focus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Debounced search
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults({ videos: [], users: [], hashtags: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await globalSearch({ q: q.trim(), limit: 8 });
      setResults(res.data);
    } catch {
      setResults({ videos: [], users: [], hashtags: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setResults({ videos: [], users: [], hashtags: [] });
      return;
    }
    searchTimerRef.current = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(searchTimerRef.current);
  }, [query, doSearch]);

  const handleUserClick = (user) => {
    onClose();
    navigate(`/profile/${user.username}`);
  };

  const handleVideoClick = (video) => {
    onClose();
    navigate(`/video/${video.id}`);
  };

  const handleKeywordClick = (text) => {
    onClose();
    navigate(`/explore?q=${encodeURIComponent(text)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const hasQuery = query.trim().length > 0;
  const hasUsers = results.users?.length > 0;
  const hasVideos = results.videos?.length > 0;
  const hasHashtags = results.hashtags?.length > 0;
  const hasResults = hasUsers || hasVideos || hasHashtags;

  return (
    <div
      className="flex flex-col h-screen bg-base border-r border-border overflow-hidden"
      style={{ width: 340 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-[14px] border-b border-border shrink-0">
        <span className="text-white text-[17px] font-bold font-body flex-1">Tìm kiếm</span>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-full hover:bg-white/10 transition-colors"
        >
          <CloseIcon />
        </button>
      </div>

      {/* ── Search Input ── */}
      <form onSubmit={handleSubmit} className="px-3 py-2.5 shrink-0">
        <div className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 transition-colors border ${
          hasQuery ? 'bg-[#1a1a26] border-[#ff2d78]/30' : 'bg-elevated border-transparent'
        }`}>
          <SearchIcon color={hasQuery ? '#ff2d78' : '#555'} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tài khoản và video..."
            className="bg-transparent border-none outline-none text-white text-sm font-body w-full placeholder:text-text-faint"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shrink-0 w-5 h-5 rounded-full bg-[#333] flex items-center justify-center border-none cursor-pointer hover:bg-[#444] transition-colors"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1L7 7M7 1L1 7" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* ── Suggestions list ── */}
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#222 transparent' }}>
        {/* Loading state */}
        {loading && hasQuery && (
          <div>
            <SuggestionSkeleton />
            <SuggestionSkeleton />
            <SuggestionSkeleton />
            <SuggestionSkeleton />
          </div>
        )}

        {/* Results when typing */}
        {!loading && hasQuery && hasResults && (
          <div>
            {/* Keyword suggestions from hashtags */}
            {hasHashtags && results.hashtags.slice(0, 5).map((h) => (
              <KeywordSuggestion
                key={`h-${h.id || h.tag}`}
                text={h.tag}
                onClick={handleKeywordClick}
              />
            ))}

            {/* Video captions as keyword suggestions */}
            {hasVideos && results.videos.slice(0, 3).map((v) => (
              v.caption && (
                <KeywordSuggestion
                  key={`vc-${v.id}`}
                  text={v.caption.length > 50 ? v.caption.slice(0, 50) + '...' : v.caption}
                  onClick={() => handleVideoClick(v)}
                />
              )
            ))}

            {/* Users section */}
            {hasUsers && (
              <>
                <div className="px-4 pt-3 pb-1.5">
                  <span className="text-[#555] text-[11px] font-semibold font-body uppercase tracking-wider">
                    Tài khoản
                  </span>
                </div>
                {results.users.slice(0, 5).map((u) => (
                  <UserSuggestion key={u.id} user={u} onClick={handleUserClick} />
                ))}
              </>
            )}

            {/* Video content section */}
            {hasVideos && (
              <>
                <div className="px-4 pt-3 pb-1.5">
                  <span className="text-[#555] text-[11px] font-semibold font-body uppercase tracking-wider">
                    Nội dung
                  </span>
                </div>
                {results.videos.slice(0, 4).map((v) => (
                  <ContentSuggestion key={v.id} video={v} onClick={handleVideoClick} />
                ))}
              </>
            )}

            {/* View all results link */}
            <button
              onClick={() => handleKeywordClick(query)}
              className="flex items-center gap-3 w-full px-4 py-3 mt-1 bg-transparent border-none border-t border-t-[#1a1a26] cursor-pointer transition-colors hover:bg-white/5 text-left"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#ff2d78]/10 shrink-0">
                <SearchIcon color="#ff2d78" />
              </div>
              <span className="text-[#ff2d78] text-[13px] font-semibold font-body">
                Xem tất cả kết quả cho "{query}"
              </span>
            </button>
          </div>
        )}

        {/* No results */}
        {!loading && hasQuery && !hasResults && (
          <div className="flex flex-col items-center justify-center py-16 gap-2.5 text-[#444]">
            <p className="text-[13px] font-body text-center px-6">
              Không tìm thấy kết quả cho "<span className="text-white">{query}</span>"
            </p>
            <p className="text-[11px] font-body text-[#333]">Thử từ khóa khác</p>
          </div>
        )}

        {/* Empty state — no query yet */}
        {!hasQuery && (
          <div className="px-4 pt-2">
            <p className="text-[#444] text-[12px] font-body text-center py-10">
              Nhập từ khóa để tìm kiếm tài khoản, video...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
