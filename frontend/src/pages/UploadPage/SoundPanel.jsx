import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllTracks } from '../../services/musicService';
import { formatDuration } from '../../utils/formatters';
import { getStoredUser } from '../../utils/helpers';

import { PlaySmallIcon, StopSmallIcon, SoundPanelSearchIcon, VolumeMixerIcon, OriginalBadgeIcon, MixerChevronIcon } from '../../icons/CommonIcons';

// ─── Waveform animated bars ───────────────────────────────────────────────────
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
      className={`rounded-full border-2 border-zinc-800 relative shrink-0 overflow-hidden ${spinning ? 'animate-[vinylSpin_3s_linear_infinite]' : ''}`}
      style={{
        width: size,
        height: size,
        background: src
          ? `url(${src}) center/cover`
          : 'conic-gradient(from 0deg, #1a1a2e, #2a1a3e, #1a2a3e, #1a1a2e)',
      }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#0a0a0f] border-[1.5px] border-zinc-600" />
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
          <span className="text-base">{icon}</span>
          <span className="text-text-secondary text-xs font-body font-medium">{label}</span>
        </div>
        <span 
          className="text-xs font-bold font-body min-w-[34px] text-right"
          style={{ color }}
        >
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="relative h-5 flex items-center group">
        <div className="absolute left-0 right-0 h-1 bg-white/10 rounded-sm" />
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
      className={`flex items-center gap-3 py-[11px] px-4 cursor-pointer transition-colors hover:bg-white/5 border-l-2 ${selected ? 'bg-primary/20 border-primary' : 'border-transparent'}`}
    >
      <VinylDisc src={track.cover} spinning={previewing} size={40} />

      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-body m-0 leading-snug truncate ${selected ? 'text-primary font-semibold' : 'text-zinc-200 font-normal'}`}>
          {track.title}
        </p>
        <p className="text-text-secondary text-[11px] font-body m-0 mt-0.5 truncate">
          {track.artist} · {formatDuration(track.duration)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {previewing || selected ? (
          <WaveBars active color="#ff2d78" barCount={4} />
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onPreview(track); }}
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${track.audioUrl ? 'bg-white/10 hover:bg-white/20 cursor-pointer text-white/50 hover:text-white' : 'bg-white/5 cursor-not-allowed text-white/20'}`}
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
    <div className="w-[340px] border-l border-zinc-800 bg-[#0d0d18] flex flex-col overflow-hidden shrink-0">
      {/* ── Header ── */}
      <div className="px-4 pt-4 border-b border-[#1a1a2a]">
        <p className="text-white text-sm font-bold font-body m-0 mb-3">Âm thanh</p>
        <div className="flex">
          {[
            { key: 'original', label: 'Âm thanh gốc' },
            { key: 'library',  label: 'Thư viện nhạc' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-1 border-b-2 text-[11px] font-body transition-colors ${
                tab === t.key 
                  ? 'border-primary text-primary font-bold' 
                  : 'border-transparent text-text-subtle font-normal hover:text-text-secondary'
              }`}
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
            <div className="bg-gradient-to-br from-primary/10 to-brand-purple/10 border border-primary/20 rounded-2xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div 
                    className={`w-[52px] h-[52px] rounded-full border-2 border-primary/40 flex items-center justify-center text-lg font-bold text-white overflow-hidden ${
                      useOriginalSound && videoFile ? 'animate-[vinylSpin_3s_linear_infinite]' : ''
                    }`}
                    style={{
                      background: originalSound.avatar 
                        ? `url(${originalSound.avatar}) center/cover` 
                        : 'linear-gradient(135deg, #ff2d78, #ff6b35)'
                    }}
                  >
                    {!originalSound.avatar && originalSound.initials}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-black/70" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-primary border-2 border-[#0d0d18] flex items-center justify-center">
                    <OriginalBadgeIcon />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] font-semibold font-body m-0 truncate">
                    Âm thanh gốc - {originalSound.artist}
                  </p>
                  <p className="text-zinc-400 text-[11px] font-body m-0 mt-1 truncate">
                    @{me?.username || 'bạn'} · Trích từ video
                  </p>
                </div>

                {videoFile && (
                  <button
                    onClick={handlePreviewOriginal}
                    className={`w-8 h-8 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
                      previewingId === 'original' 
                        ? 'bg-primary/30 border-primary text-primary' 
                        : 'bg-white/10 border-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
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
                <span className="text-zinc-400 text-xs font-body">
                  {videoFile ? 'Dùng âm thanh từ video' : 'Chưa có video'}
                </span>
                <button
                  onClick={handleToggleOriginal}
                  disabled={!videoFile}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${
                    useOriginalSound && videoFile ? 'bg-primary' : 'bg-zinc-800'
                  } ${!videoFile ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`absolute top-[2px] bottom-[2px] w-[18px] rounded-full bg-white shadow transition-all ${
                    useOriginalSound && videoFile ? 'left-[20px]' : 'left-[2px]'
                  }`} />
                </button>
              </div>
            </div>

            {!videoFile && (
              <p className="text-text-subtle text-[11px] font-body text-center mt-2 leading-relaxed">
                Chọn video để sử dụng âm thanh gốc
              </p>
            )}
          </div>

          {selectedMusic && (
            <div className="mx-4 mb-4 bg-brand-purple/10 border border-brand-purple/20 rounded-xl p-3">
              <p className="text-brand-purple text-[10px] font-bold font-body m-0 mb-2 tracking-wide uppercase">
                Nhạc nền đã chọn
              </p>
              <div className="flex items-center gap-2.5">
                <VinylDisc src={selectedMusic.cover} spinning size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold font-body m-0 truncate">{selectedMusic.title}</p>
                  <p className="text-zinc-400 text-[11px] font-body m-0 mt-0.5 truncate">{selectedMusic.artist}</p>
                </div>
                <button
                  onClick={() => { onMusicSelect(null); setShowVolumeMixer(false); }}
                  className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-none rounded-md px-2 py-1 text-[11px] font-body cursor-pointer transition-colors"
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
          <div className="p-3 border-b border-[#1a1a2a]">
            <div className="flex items-center gap-2 bg-[#111120] rounded-lg px-3 py-2 border border-zinc-800 focus-within:border-primary/50 transition-colors">
              <SoundPanelSearchIcon />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm bài hát..."
                className="flex-1 bg-transparent border-none outline-none text-white text-xs font-body"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-white text-lg leading-none shrink-0">&times;</button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-zinc-800/50 shrink-0" />
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <div className="h-2.5 w-[70%] rounded-full bg-zinc-800/50" />
                      <div className="h-2 w-[45%] rounded-full bg-zinc-800/30" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-zinc-500 text-[13px] font-body">
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
      <div className="border-t border-[#1a1a2a] bg-[#0a0a12]">
        <button
          onClick={() => setShowVolumeMixer(v => !v)}
          className="w-full px-4 py-3 bg-transparent border-none flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <VolumeMixerIcon active={hasBoth} />
            <span className={`text-xs font-semibold font-body transition-colors ${hasBoth ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
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
              // icon="📹"
              value={originalVolume}
              onChange={onOriginalVolumeChange}
              color="#06b6d4"
            />
            <VolumeSlider
              label="Nhạc nền"
              // icon="🎵"
              value={musicVolume}
              onChange={onMusicVolumeChange}
              color="#ff2d78"
            />

            <div className="flex items-end gap-[3px] h-8 mt-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`v-${i}`} className="flex-1 rounded-[2px]" style={{
                  background: '#06b6d4',
                  height: Math.max(3, originalVolume * 32 * (0.4 + Math.sin(i) * 0.4 + Math.random() * 0.2)),
                  opacity: originalVolume,
                  transition: 'height 0.2s, opacity 0.2s',
                }} />
              ))}
              <div className="w-[1px] h-full bg-zinc-800 mx-0.5" />
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`m-${i}`} className="flex-1 rounded-[2px]" style={{
                  background: '#ff2d78',
                  height: Math.max(3, musicVolume * 32 * (0.5 + Math.cos(i * 0.8) * 0.3 + Math.random() * 0.2)),
                  opacity: musicVolume,
                  transition: 'height 0.2s, opacity 0.2s',
                }} />
              ))}
            </div>

            <p className="text-zinc-500 text-[10px] font-body text-center m-0 mt-1">
              Nghe thử qua video preview bên trái
            </p>
          </div>
        )}
      </div>
    </div>
  );
}