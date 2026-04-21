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
  try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {}
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
 
/** VolumeControl — TikTok-style, shown on hover */
export default function VolumeControl({ volume, muted, onVolumeChange, onToggleMute, className = '' }) {
  const displayVolume = muted ? 0 : volume;
 
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-full ${className}`}
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mute button */}
      <button
        onClick={onToggleMute}
        className="border-none bg-transparent text-white cursor-pointer flex items-center p-0"
        style={{ fontSize: 16 }}
      >
        {muted || volume === 0 ? <MuteIcon /> : volume < 0.5 ? <VolumeLowIcon /> : <VolumeHighIcon />}
      </button>
 
      {/* Slider */}
      <div className="relative flex items-center" style={{ width: 72 }}>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ width: `${displayVolume * 100}%`, height: 3, background: 'white', transition: 'width .1s' }}
        />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.25)' }}
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={displayVolume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="absolute w-full opacity-0 cursor-pointer"
          style={{ height: 16 }}
        />
      </div>
 
      {/* Percentage */}
      <span className="text-white font-body" style={{ fontSize: 11, minWidth: 28, textAlign: 'right' }}>
        {Math.round(displayVolume * 100)}%
      </span>
    </div>
  );
}