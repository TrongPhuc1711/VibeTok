/**
 * CommonIcons — icons dùng rải rác trong app
 */

export function EyeIcon() {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M1 8C1 8 3.5 3 8 3s7 5 7 5-2.5 5-7 5S1 8 1 8z" />
        <circle cx="8" cy="8" r="2" />
      </svg>
    );
  }
  
  export function EyeOffIcon() {
    return (
      <svg
        width="16" height="16" viewBox="0 0 16 16"
        fill="none" stroke="currentColor"
        strokeWidth="1.2" strokeLinecap="round"
      >
        <path d="M2 2l12 12M6.5 6.7C6.2 7 6 7.5 6 8c0 1.1.9 2 2 2 .5 0 1-.2 1.3-.5" />
        <path d="M4.3 4.3C2.7 5.3 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.7-1.1M7 3.1C7.3 3 7.7 3 8 3c4.5 0 7 5 7 5s-.7 1.3-2 2.5" />
      </svg>
    );
  }
  
  export function EmailIcon() {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#666" strokeWidth="1.2">
        <path d="M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" />
        <path d="M2 4l6 5 6-5" />
      </svg>
    );
  }
  
  export function LockIcon({ color = '#666' }) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.2">
        <rect x="3" y="7" width="10" height="8" rx="1" />
        <path d="M5 7V5a3 3 0 016 0v2" />
        <circle cx="8" cy="11" r="1" fill={color} />
      </svg>
    );
  }
  
  export function BackIcon() {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 13L5 8L10 3" />
      </svg>
    );
  }
  
  export function ShareSmIcon() {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#888" strokeWidth="1.2">
        <path d="M10 2a2 2 0 100 4 2 2 0 000-4zM4 5a2 2 0 100 4 2 2 0 000-4zM10 8a2 2 0 100 4 2 2 0 000-4z" />
        <path d="M6 6.5L8.5 5M6 7.5L8.5 9" strokeLinecap="round" />
      </svg>
    );
  }
  
  export function LocIcon() {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#666" strokeWidth="1.2">
        <path d="M8 1C5.79 1 4 2.79 4 5C4 8.25 8 15 8 15C8 15 12 8.25 12 5C12 2.79 10.21 1 8 1ZM8 6.5C7.17 6.5 6.5 5.83 6.5 5C6.5 4.17 7.17 3.5 8 3.5C8.83 3.5 9.5 4.17 9.5 5C9.5 5.83 8.83 6.5 8 6.5Z" />
      </svg>
    );
  }
  
  export function SearchLgIcon() {
    return (
      <svg
        width="18" height="18" viewBox="0 0 18 18"
        fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M13 13l4 4" />
      </svg>
    );
  }
  
  export function ProfileMenuIcon() {
    return (
      <svg
        width="15" height="15" viewBox="0 0 15 15"
        fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
      >
        <circle cx="7.5" cy="4.5" r="2.5" />
        <path d="M1.5 13.5C1.5 10.74 4.24 8.5 7.5 8.5C10.76 8.5 13.5 10.74 13.5 13.5" />
      </svg>
    );
  }
  
  export function LockMenuIcon() {
    return (
      <svg
        width="15" height="15" viewBox="0 0 15 15"
        fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
      >
        <rect x="2.5" y="6.5" width="10" height="8" rx="1.5" />
        <path d="M4.5 6.5V4.5a3 3 0 016 0v2" />
        <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
      </svg>
    );
  }
  
  export function LogoutMenuIcon() {
    return (
      <svg
        width="15" height="15" viewBox="0 0 15 15"
        fill="none" stroke="currentColor"
        strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M5.5 13H3a1 1 0 01-1-1V3a1 1 0 011-1h2.5" />
        <path d="M10 10.5L13 7.5L10 4.5" />
        <path d="M13 7.5H5.5" />
      </svg>
    );
  }
  
  export function UploadVideoIcon() {
    return (
      <svg
        width="28" height="28" viewBox="0 0 28 28"
        fill="none" stroke="#ff2d78" strokeWidth="1.8" strokeLinecap="round"
      >
        <path d="M14 18V6M9 11l5-5 5 5" />
        <path d="M4 22v2h20v-2" />
      </svg>
    );
  }
  
  export function MusicNoteIcon({ active = false }) {
    return (
      <svg
        width="16" height="16" viewBox="0 0 16 16"
        fill="none" stroke={active ? '#fff' : '#555'} strokeWidth="1.3" strokeLinecap="round"
      >
        <path d="M6 12V4l8-2v8" />
        <circle cx="4" cy="12" r="2" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    );
  }
  
  export function MusicSearchIcon() {
    return (
      <svg
        width="13" height="13" viewBox="0 0 13 13"
        fill="none" stroke="#555" strokeWidth="1.2" strokeLinecap="round"
      >
        <circle cx="6" cy="6" r="5" />
        <path d="M10 10l2.5 2.5" />
      </svg>
    );
  }
  
  export function ChevDownIcon() {
    return (
      <svg
        width="12" height="12" viewBox="0 0 12 12"
        fill="none" stroke="#555" strokeWidth="1.2" strokeLinecap="round"
      >
        <path d="M3 4.5L6 7.5L9 4.5" />
      </svg>
    );
  }
  
  export function VideoSearchIcon() {
    return (
      <svg
        width="20" height="20" viewBox="0 0 20 20"
        fill="none" stroke="rgba(255,255,255,.8)"
        strokeWidth="1.5" strokeLinecap="round"
      >
        <circle cx="8.5" cy="8.5" r="6" />
        <path d="M14 14l4 4" />
      </svg>
    );
  }
  
  export function VideoPlaySmIcon() {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,.8)">
        <path d="M4 3l13 7-13 7V3z" />
      </svg>
    );
  }
  
  export function VideoPauseIcon() {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)">
        <rect x="4" y="3" width="4" height="14" rx="1" />
        <rect x="12" y="3" width="4" height="14" rx="1" />
      </svg>
    );
  }
  
  export function VolumeIcon() {
    return (
      <svg
        width="16" height="16" viewBox="0 0 16 16"
        fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.2"
      >
        <path d="M3 6H1v4h2l4 3V3L3 6z" />
        <path d="M11 5c1 .8 1.5 1.8 1.5 3s-.5 2.2-1.5 3" />
      </svg>
    );
  }
  
  export function MuteIcon() {
    return (
      <svg
        width="16" height="16" viewBox="0 0 16 16"
        fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.2"
      >
        <path d="M3 6H1v4h2l4 3V3L3 6z" />
        <path d="M13 5l-4 4M9 5l4 4" />
      </svg>
    );
  }
  
  export function SpinIcon() {
    return (
      <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle
          cx="7" cy="7" r="5.5"
          stroke="currentColor" strokeWidth="1.5"
          strokeDasharray="20" strokeDashoffset="10"
          strokeLinecap="round"
        />
      </svg>
    );
  }