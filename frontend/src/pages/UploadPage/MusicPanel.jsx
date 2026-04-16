import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllTracks } from '../../services/musicService';
import { formatDuration } from '../../utils/formatters';
import AudioWaves from './AudioWaves';
import { MusicNoteIcon, MusicSearchIcon } from '../../icons/CommonIcons';

export default function MusicPanel({ selectedTrackId, onSelect }) {
  const [tracks,    setTracks]    = useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [previewId, setPreviewId] = useState(null);

  const audioRef   = useRef(null);
  const location   = useLocation();

  // ✅ FIX: Hàm dừng audio dùng chung, gọi được ở nhiều nơi
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setPreviewId(null);
  }, []);

  useEffect(() => {
    getAllTracks({ limit: 30 })
      .then(r => setTracks(r.data.tracks || []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  // ✅ FIX: Dừng audio khi component unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // ✅ FIX: Dừng audio khi route thay đổi (user navigate đi trang khác)
  useEffect(() => {
    stopAudio();
  }, [location.pathname, stopAudio]);

  // ✅ FIX: Dừng audio khi tab bị ẩn (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopAudio();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stopAudio]);

  const filtered = tracks.filter(
    t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase()),
  );

  const handlePreview = (e, track) => {
    e.stopPropagation();
    if (!track.audioUrl) return;

    if (previewId === track.id) {
      // Đang phát → dừng
      stopAudio();
      return;
    }

    // Dừng track cũ trước
    stopAudio();

    // Phát track mới
    const audio = new Audio(track.audioUrl);
    audio.volume = 0.6;
    audio.play().catch(() => {});
    audio.onended = () => {
      setPreviewId(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setPreviewId(null);
      audioRef.current = null;
    };
    audioRef.current = audio;
    setPreviewId(track.id);
  };

  const handleSelect = (track) => {
    // Dừng preview khi chọn
    stopAudio();
    onSelect(track);
  };

  return (
    <div className="w-[320px] border-l border-border flex flex-col overflow-hidden shrink-0">
      {/* Header + search */}
      <div className="p-4 border-b border-border">
        <h3 className="text-[#ddd] text-sm font-semibold font-body mb-3">Chọn nhạc nền</h3>
        <div className="bg-elevated border border-border2 rounded-lg flex items-center gap-2.5 px-3 py-2">
          <MusicSearchIcon />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm âm nhạc..."
            className="flex-1 bg-transparent border-none outline-none text-white text-[13px] font-body placeholder:text-text-faint"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="bg-transparent border-none text-[#555] cursor-pointer hover:text-white text-base"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-border2 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-2.5 bg-border2 rounded w-3/4" />
                  <div className="h-2 bg-border2/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-text-faint text-sm py-8 font-body">
            {search ? 'Không tìm thấy bài hát' : 'Chưa có nhạc trong DB'}
          </p>
        ) : (
          filtered.map(track => {
            const selected     = selectedTrackId === track.id;
            const isPreviewing = previewId === track.id;
            const hasAudio     = !!track.audioUrl;

            return (
              <div
                key={track.id}
                onClick={() => handleSelect(track)}
                className={`
                  flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors border-l-2
                  ${selected
                    ? 'bg-primary/8 border-primary'
                    : 'bg-transparent border-transparent hover:bg-white/5'
                  }
                `}
              >
                {/* Icon / play state */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 relative group
                    ${selected ? 'bg-brand-gradient' : 'bg-gradient-to-br from-border to-border2'}`}
                  onClick={hasAudio ? (e) => handlePreview(e, track) : undefined}
                  title={hasAudio ? (isPreviewing ? 'Dừng preview' : 'Nghe thử') : 'Không có file audio'}
                >
                  {isPreviewing ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="rgba(255,255,255,.9)">
                      <rect x="2" y="2" width="4" height="10" rx="1" />
                      <rect x="8" y="2" width="4" height="10" rx="1" />
                    </svg>
                  ) : (
                    <MusicNoteIcon active={selected} />
                  )}

                  {hasAudio && !isPreviewing && (
                    <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                        <path d="M3 2l7 4-7 4V2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-body m-0 truncate ${selected ? 'text-primary font-semibold' : 'text-[#ddd]'}`}>
                    {track.title}
                  </p>
                  <p className="text-text-faint text-xs font-body m-0">{track.artist}</p>
                </div>

                {isPreviewing ? (
                  <AudioWaves />
                ) : selected ? (
                  <AudioWaves />
                ) : (
                  <span className="text-text-subtle text-xs font-body shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer note */}
      <div className="px-4 py-2.5 border-t border-border">
        {previewId ? (
          <div className="flex items-center justify-between">
            <p className="text-text-subtle text-[11px] font-body">
              Đang phát preview...
            </p>
            <button
              onClick={stopAudio}
              className="text-[11px] font-body text-primary bg-transparent border-none cursor-pointer hover:underline"
            >
              Dừng
            </button>
          </div>
        ) : (
          <p className="text-text-subtle text-[11px] font-body text-center">
            Click vào icon ▶ để nghe thử · Click vào track để chọn
          </p>
        )}
      </div>
    </div>
  );
}