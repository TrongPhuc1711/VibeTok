import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoVolume } from '../video/VolumnControl';
import { SearchIcon } from '../../icons/NavIcons';
import { VolumeHighIcon, MuteIcon } from '../../icons/VolumeIcons';

export default function MobileTopBar({ feedType = 'forYou', onFeedTypeChange }) {
  const navigate = useNavigate();
  const { muted, toggleMute } = useVideoVolume();

  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)',
        paddingBottom: 16,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
      }}
    >
      {/* Left icon: Volume Toggle */}
      <button
        onClick={toggleMute}
        className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      >
        <VolumeIcon muted={muted} />
      </button>

      {/* Center tabs */}
      <div className="flex items-center gap-5">
        <TabButton
          label="Đang Follow"
          active={feedType === 'following'}
          onClick={() => onFeedTypeChange?.('following')}
        />
        <TabButton
          label="Dành Cho Bạn"
          active={feedType === 'forYou'}
          onClick={() => onFeedTypeChange?.('forYou')}
        />
      </div>

      {/* Right icon: Search */}
      <button
        onClick={() => navigate('/explore')}
        className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label="Tìm kiếm"
      >
        <SearchIcon size={20} color="rgba(255,255,255,0.85)" />
      </button>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative bg-transparent border-none cursor-pointer py-1"
      style={{
        WebkitTapHighlightColor: 'transparent',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 16,
        fontWeight: active ? 700 : 500,
        color: active ? '#fff' : 'rgba(255,255,255,0.55)',
        transition: 'all 0.2s ease',
        letterSpacing: '-0.01em',
      }}
    >
      {label}
      {active && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 24,
            height: 2.5,
            background: '#fff',
          }}
        />
      )}
    </button>
  );
}


/* ── Icons ── */
function VolumeIcon({ muted }) {
  return muted ? (
    <MuteIcon size={20} color="rgba(255,255,255,0.85)" />
  ) : (
    <VolumeHighIcon size={20} color="rgba(255,255,255,0.85)" />
  );
}
