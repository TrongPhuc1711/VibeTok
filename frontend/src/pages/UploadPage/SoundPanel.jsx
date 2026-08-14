import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllTracks } from '../../services/musicService';
import { formatDuration } from '../../utils/formatters';
import { getStoredUser } from '../../utils/helpers';

import { PlaySmallIcon, StopSmallIcon, SoundPanelSearchIcon, VolumeMixerIcon, OriginalBadgeIcon, MixerChevronIcon } from '../../icons/CommonIcons';
 
function WaveBars({ active = false, color = '#ff2d78', barCount = 5 }) {
  return (
    <div className="flex items-center gap-[2px] h-[18px]">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="w-[2.5px] rounded-[2px]"
          style={{
            background: color,
            animation: active
              ? `soundWave 0.7s ease-in-out ${i * 0.12}s infinite alternate`
              : 'none',
            height: active ? undefined : 4,
          }}
        />
      ))}
      <style>{`
        @keyframes soundWave {
          from { height: 3px; opacity: 0.5; }
          to   { height: 18px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Vinyl disc (spinning record) ─────────────────────────────────────────────
function VinylDisc({ src, spinning = false, size = 42 }) {
  return (
    <div
      className={`rounded-full border relative shrink-0 overflow-hidden ${spinning ? 'animate-[vinylSpin_3s_linear_infinite]' : ''}`}
      style={{
        width: size,
        height: size,
        borderColor: 'var(--color-border)',
        background: src
          ? `url(${src}) center/cover`
          : 'conic-gradient(from 0deg, #1a1a2e, #2a1a3e, #1a2a3e, #1a1a2e)',
      }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border"
        style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)' }}
      />
      <style>{`@keyframes vinylSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Volume Slider ─────────────────────────────────────────────────────────────
function VolumeSlider({ label, icon, value, onChange, color = '#ff2d78' }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span className="text-xs font-body font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        </div>
        <span 
          className="text-xs font-bold font-body min-w-[34px] text-right"
          style={{ color }}
        >
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="relative h-5 flex items-center group">
        <div className="absolute left-0 right-0 h-1 rounded-sm" style={{ background: 'var(--color-border2)' }} />
        <div 
          className="absolute left-0 h-1 rounded-sm transition-[width] duration-75"
          style={{ width: `${value * 100}%`, background: color }} 
        />
        <div 
          className="absolute w-4 h-4 rounded-full bg-white transition-[left] duration-75 pointer-events-none z-10"
          style={{ 
            left: `calc(max(0px, min(100%, ${value * 100}%)) - 8px)`,
            boxShadow: `0 0 8px ${color}80`,
            border: `2px solid ${color}`
          }} 
        />
        <input
          type="range" min="0" max="1" step="0.01"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer h-full w-full z-20"
        />
      </div>
    </div>
  );
}

// ─── Music Track Item ─────────────────────────────────────────────────────────
function TrackItem({ track, selected, previewing, onSelect, onPreview }) {
  return (
    <div
      onClick={() => onSelect(track)}
      className="flex items-center gap-3 py-[11px] px-4 cursor-pointer transition-colors hover:bg-[var(--vt-hover)] border-l-2"
      style={{
        background: selected ? 'rgba(255, 45, 120, 0.12)' : 'transparent',
        borderLeftColor: selected ? 'var(--color-primary, #ff2d78)' : 'transparent',
      }}
    >
      <VinylDisc src={track.cover} spinning={previewing} size={40} />

      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-body m-0 leading-snug truncate"
          style={{
            color: selected ? 'var(--color-primary, #ff2d78)' : 'var(--color-text-primary)',
            fontWeight: selected ? '600' : '500',
          }}
        >
          {track.title}
        </p>
        <p className="text-[11px] font-body m-0 mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
          {track.artist} · {formatDuration(track.duration)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {previewing || selected ? (
          <WaveBars active color="#ff2d78" barCount={4} />
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onPreview(track); }}
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors border-none"
            style={{
              background: 'var(--vt-input)',
              color: track.audioUrl ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
              cursor: track.audioUrl ? 'pointer' : 'not-allowed',
            }}
            title={track.audioUrl ? 'Nghe thử' : 'Không có audio'}
          >
            <PlaySmallIcon />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main SoundPanel Component ────────────────────────────────────────────────
export default function SoundPanel({
  videoFile,
  selectedMusic,
  onMusicSelect,
  originalVolume,
  musicVolume,
  onOriginalVolumeChange,
  onMusicVolumeChange,
  useOriginalSound,
  onUseOriginalSoundChange,
}) {
  const me = getStoredUser();
  const location = useLocation();

  const [tab, setTab] = useState('original');
  const [tracks, setTracks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewingId, setPreviewingId] = useState(null);
  const [showVolumeMixer, setShowVolumeMixer] = useState(false);

  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const originalSound = {
    id: 'original',
    title: 'Âm thanh gốc',
    artist: me?.fullName || me?.username || 'Bạn',
    avatar: me?.anh_dai_dien || null,
    initials: me?.initials || (me?.fullName || 'U').charAt(0).toUpperCase(),
    isOriginal: true,
  };

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current = null;
    }
    setPreviewingId(null);
  }, []);

  useEffect(() => {
    getAllTracks({ limit: 50 })
      .then(r => setTracks(r.data.tracks || []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => stopAudio(), [stopAudio]);
  useEffect(() => stopAudio(), [location.pathname, stopAudio]);
  useEffect(() => {
    const handler = () => { if (document.hidden) stopAudio(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [stopAudio]);

  const handlePreview = useCallback((track) => {
    if (previewingId === track.id) { stopAudio(); return; }
    if (!track.audioUrl) return;
    stopAudio();
    const audio = new Audio(track.audioUrl);
    audio.volume = 0.6;
    audio.play().catch(() => {});
    audio.onended = () => { setPreviewingId(null); audioRef.current = null; };
    audioRef.current = audio;
    setPreviewingId(track.id);
  }, [previewingId, stopAudio]);

  const handlePreviewOriginal = useCallback(() => {
    if (!videoFile) return;
    if (previewingId === 'original') { stopAudio(); return; }
    stopAudio();
    const url = URL.createObjectURL(videoFile);
    const vid = document.createElement('video');
    vid.src = url;
    vid.volume = 0.6;
    vid.play().catch(() => {});
    vid.onended = () => { setPreviewingId(null); videoRef.current = null; URL.revokeObjectURL(url); };
    videoRef.current = vid;
    setPreviewingId('original');
  }, [videoFile, previewingId, stopAudio]);

  const handleSelectMusic = (track) => {
    stopAudio();
    onMusicSelect(track);
    setShowVolumeMixer(true);
    if (useOriginalSound) setShowVolumeMixer(true);
  };

  const handleToggleOriginal = () => {
    onUseOriginalSoundChange(!useOriginalSound);
    if (!useOriginalSound && selectedMusic) setShowVolumeMixer(true);
  };

  const filtered = tracks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.artist.toLowerCase().includes(search.toLowerCase())
  );

  const hasMusic = !!selectedMusic;
  const hasOriginal = useOriginalSound && !!videoFile;
  const hasBoth = hasMusic && hasOriginal;

  return (
    <div
      className="w-full flex flex-col overflow-hidden shrink-0"
      style={{
        background: 'var(--vt-card)',
        borderLeft: '1px solid var(--color-border)',
      }}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm font-bold font-body m-0 mb-3" style={{ color: 'var(--color-text-primary)' }}>Âm thanh</p>
        <div className="flex">
          {[
            { key: 'original', label: 'Âm thanh gốc' },
            { key: 'library',  label: 'Thư viện nhạc' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 py-2 px-1 border-b-2 text-[11px] font-body transition-colors cursor-pointer bg-transparent"
              style={{
                borderBottomColor: tab === t.key ? 'var(--color-primary, #ff2d78)' : 'transparent',
                color: tab === t.key ? 'var(--color-primary, #ff2d78)' : 'var(--color-text-muted)',
                fontWeight: tab === t.key ? '700' : '400',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Original Sound ── */}
      {tab === 'original' && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4">
            <div
              className="border rounded-2xl p-3.5"
              style={{
                background: 'rgba(255, 45, 120, 0.05)',
                borderColor: 'rgba(255, 45, 120, 0.2)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div 
                    className={`w-[52px] h-[52px] rounded-full border-2 flex items-center justify-center text-lg font-bold text-white overflow-hidden ${
                      useOriginalSound && videoFile ? 'animate-[vinylSpin_3s_linear_infinite]' : ''
                    }`}
                    style={{
                      borderColor: 'rgba(255, 45, 120, 0.4)',
                      background: originalSound.avatar 
                        ? `url(${originalSound.avatar}) center/cover` 
                        : 'linear-gradient(135deg, #ff2d78, #ff6b35)'
                    }}
                  >
                    {!originalSound.avatar && originalSound.initials}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-black/70" />
                  </div>
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-primary border-2 flex items-center justify-center"
                    style={{ borderColor: 'var(--vt-card)' }}
                  >
                    <OriginalBadgeIcon />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold font-body m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                    Âm thanh gốc - {originalSound.artist}
                  </p>
                  <p className="text-[11px] font-body m-0 mt-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
                    @{me?.username || 'bạn'} · Trích từ video
                  </p>
                </div>

                {videoFile && (
                  <button
                    onClick={handlePreviewOriginal}
                    className="w-8 h-8 rounded-full border shrink-0 flex items-center justify-center transition-colors cursor-pointer"
                    style={{
                      background: previewingId === 'original' ? 'rgba(255, 45, 120, 0.2)' : 'var(--vt-input)',
                      borderColor: previewingId === 'original' ? 'var(--color-primary, #ff2d78)' : 'var(--color-border)',
                      color: previewingId === 'original' ? '#ff2d78' : 'var(--color-text-secondary)',
                    }}
                    title={previewingId === 'original' ? 'Dừng' : 'Nghe thử'}
                  >
                    {previewingId === 'original' ? <StopSmallIcon /> : <PlaySmallIcon />}
                  </button>
                )}
              </div>

              {useOriginalSound && videoFile && (
                <div className="mt-3 flex items-center gap-[3px] h-6 px-1">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="flex-1 rounded-[2px] bg-primary/50" style={{
                      height: 4 + Math.sin(i * 0.8) * 8 + Math.random() * 6,
                      animation: `soundWave 0.6s ease-in-out ${i * 0.03}s infinite alternate`
                    }} />
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
                  {videoFile ? 'Dùng âm thanh từ video' : 'Chưa có video'}
                </span>
                <button
                  onClick={handleToggleOriginal}
                  disabled={!videoFile}
                  className={`relative w-10 h-5.5 rounded-full transition-colors border-none ${
                    !videoFile ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  style={{
                    background: useOriginalSound && videoFile ? 'var(--color-primary, #ff2d78)' : 'var(--color-border2)',
                  }}
                >
                  <div
                    className={`absolute top-[2px] bottom-[2px] w-[18px] rounded-full bg-white shadow transition-all ${
                      useOriginalSound && videoFile ? 'left-[20px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>
            </div>

            {!videoFile && (
              <p className="text-[11px] font-body text-center mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Chọn video để sử dụng âm thanh gốc
              </p>
            )}
          </div>

          {selectedMusic && (
            <div
              className="mx-4 mb-4 border rounded-xl p-3"
              style={{
                background: 'rgba(124, 58, 237, 0.08)',
                borderColor: 'rgba(124, 58, 237, 0.25)',
              }}
            >
              <p className="text-[10px] font-bold font-body m-0 mb-2 tracking-wide uppercase" style={{ color: '#7c3aed' }}>
                Nhạc nền đã chọn
              </p>
              <div className="flex items-center gap-2.5">
                <VinylDisc src={selectedMusic.cover} spinning size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold font-body m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>{selectedMusic.title}</p>
                  <p className="text-[11px] font-body m-0 mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{selectedMusic.artist}</p>
                </div>
                <button
                  onClick={() => { onMusicSelect(null); setShowVolumeMixer(false); }}
                  className="border-none rounded-md px-2 py-1 text-[11px] font-body cursor-pointer transition-colors"
                  style={{
                    background: 'var(--vt-input)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Music Library ── */}
      {tab === 'library' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 border transition-colors"
              style={{
                background: 'var(--vt-input)',
                borderColor: 'var(--color-border)',
              }}
            >
              <SoundPanelSearchIcon />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm bài hát..."
                className="flex-1 bg-transparent border-none outline-none text-xs font-body"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="hover:opacity-100 text-lg leading-none shrink-0 border-none bg-transparent cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full shrink-0" style={{ background: 'var(--vt-input)' }} />
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <div className="h-2.5 w-[70%] rounded-full" style={{ background: 'var(--vt-input)' }} />
                      <div className="h-2 w-[45%] rounded-full" style={{ background: 'var(--vt-hover)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[13px] font-body" style={{ color: 'var(--color-text-muted)' }}>
                  {search ? `Không tìm thấy "${search}"` : 'Chưa có bài hát nào'}
                </p>
              </div>
            ) : (
              filtered.map(track => (
                <TrackItem
                  key={track.id}
                  track={track}
                  selected={selectedMusic?.id === track.id}
                  previewing={previewingId === track.id}
                  onSelect={handleSelectMusic}
                  onPreview={handlePreview}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Volume Mixer ── */}
      <div
        className="border-t"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--vt-card)',
        }}
      >
        <button
          onClick={() => setShowVolumeMixer(v => !v)}
          className="w-full px-4 py-3 bg-transparent border-none flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <VolumeMixerIcon active={hasBoth} />
            <span
              className="text-xs font-semibold font-body transition-colors"
              style={{ color: hasBoth ? '#ff2d78' : 'var(--color-text-secondary)' }}
            >
              Mixer âm thanh
            </span>
            {hasBoth && (
              <span className="bg-primary/20 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-body tracking-wider">
                Active
              </span>
            )}
          </div>
          <MixerChevronIcon open={showVolumeMixer} />
        </button>

        {showVolumeMixer && (
          <div className="px-4 pb-4 flex flex-col gap-3.5">
            <VolumeSlider
              label="Âm thanh video gốc"
              value={originalVolume}
              onChange={onOriginalVolumeChange}
              color="#06b6d4"
            />
            <VolumeSlider
              label="Nhạc nền"
              value={musicVolume}
              onChange={onMusicVolumeChange}
              color="#ff2d78"
            />

            <div className="flex items-end gap-[3px] h-8 mt-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`v-${i}`} className="flex-1 rounded-[2px]" style={{
                  background: '#06b6d4',
                  height: Math.max(3, originalVolume * 32 * (0.4 + Math.sin(i) * 0.4 + Math.random() * 0.2)),
                  opacity: Math.max(0.2, originalVolume),
                  transition: 'height 0.2s, opacity 0.2s',
                }} />
              ))}
              <div className="w-[1px] h-full mx-0.5" style={{ background: 'var(--color-border)' }} />
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`m-${i}`} className="flex-1 rounded-[2px]" style={{
                  background: '#ff2d78',
                  height: Math.max(3, musicVolume * 32 * (0.5 + Math.cos(i * 0.8) * 0.3 + Math.random() * 0.2)),
                  opacity: Math.max(0.2, musicVolume),
                  transition: 'height 0.2s, opacity 0.2s',
                }} />
              ))}
            </div>

            <p className="text-[10px] font-body text-center m-0 mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Nghe thử qua video preview bên trái
            </p>
          </div>
        )}
      </div>
    </div>
  );
}