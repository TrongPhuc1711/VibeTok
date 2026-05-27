import React, { useState, useCallback, useEffect } from 'react';
import {MuteIcon, VolumeHighIcon , VolumeLowIcon} from '../../../icons/VolumeIcons';
const STORAGE_KEY = 'vibetok_volume';
 
const getStoredVolume = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v !== null ? parseFloat(v) : 0.7;
  } catch {
    return 0.7;
  }
};
 
const saveVolume = (v) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(v));
  } catch (_e) {
    return;
  }
};

export function useVideoVolume() {
  const [volume, setVolumeState] = useState(getStoredVolume);
  const [muted, setMuted] = useState(false);
 
  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    setMuted(clamped === 0);
    saveVolume(clamped);
  }, []);
 
  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m;
      if (!next && volume === 0) {
        setVolumeState(0.7);
        saveVolume(0.7);
      }
      return next;
    });
  }, [volume]);
 
  const applyToVideo = useCallback((videoEl) => {
    if (!videoEl) return;
    videoEl.volume = volume;
    videoEl.muted = muted;
  }, [volume, muted]);
 
  return { volume, muted, setVolume, toggleMute, applyToVideo };
}
 
/** VolumeControl — Click to expand, drag with a visible circular knob */
export default function VolumeControl({ volume, muted, onVolumeChange, onToggleMute, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const displayVolume = muted ? 0 : volume;

  return (
    <div
      className={`flex items-center rounded-full transition-all duration-300 overflow-hidden ${className}`}
      style={{
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(8px)',
        padding: '6px 8px',
        width: expanded ? '176px' : '32px',
        height: '32px',
        boxSizing: 'border-box',
        cursor: 'pointer'
      }}
      onMouseLeave={() => setExpanded(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (!expanded) setExpanded(true);
      }}
    >
      {/* Mute / Volume icon button */}
      <button
        onClick={(e) => {
          if (expanded) {
            e.stopPropagation();
            onToggleMute();
          }
        }}
        className="border-none bg-transparent text-white cursor-pointer flex items-center justify-center w-4 h-4 flex-shrink-0 p-0"
      >
        {muted || volume === 0 ? <MuteIcon /> : volume < 0.5 ? <VolumeLowIcon /> : <VolumeHighIcon />}
      </button>

      {/* Slider section (visible only when expanded) */}
      <div
        className={`flex items-center gap-2 transition-opacity duration-200 ml-2 flex-shrink-0 ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ width: expanded ? 'auto' : 0 }}
      >
        {/* Slider bar */}
        <div className="relative flex items-center" style={{ width: 80 }}>
          {/* Active filled track */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{ width: `${displayVolume * 100}%`, height: 3, background: 'white', transition: 'width .1s' }}
          />
          {/* Inactive background track */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.25)' }}
          />
          {/* Circular handle knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow pointer-events-none"
            style={{ left: `calc(${displayVolume * 100}% - 5px)`, transition: 'left .1s' }}
          />
          {/* Invisible interactive input range */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={displayVolume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="absolute w-full opacity-0 cursor-pointer"
            style={{ height: 16 }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Percentage text */}
        <span className="text-white font-body select-none" style={{ fontSize: 10, minWidth: 26, textAlign: 'right' }}>
          {Math.round(displayVolume * 100)}%
        </span>
      </div>
    </div>
  );
}