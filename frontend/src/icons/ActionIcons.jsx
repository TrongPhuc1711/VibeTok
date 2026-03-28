/*
 ActionIcons — icons dùng trong VideoCard, CommentPanel
 */

export function HeartIcon({ filled = false }) {
    return (
      <svg
        width="24" height="24" viewBox="0 0 24 24"
        fill={filled ? '#ff2d78' : 'none'}
        stroke={filled ? '#ff2d78' : 'rgba(255,255,255,.8)'}
        strokeWidth="1.5"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  
  export function CommentIcon() {
    return (
      <svg
        width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.5"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    );
  }
  
  export function ShareIcon() {
    return (
      <svg
        width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.5" strokeLinecap="round"
      >
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
      </svg>
    );
  }
  
  export function BookmarkIcon({ filled = false }) {
    return (
      <svg
        width="24" height="24" viewBox="0 0 24 24"
        fill={filled ? '#ff2d78' : 'none'}
        stroke={filled ? '#ff2d78' : 'rgba(255,255,255,.8)'}
        strokeWidth="1.5"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    );
  }
  
  export function PlayIcon({ color = 'rgba(255,255,255,.8)', size = 24 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M5 3l14 9-14 9V3z" />
      </svg>
    );
  }
  
  export function SendIcon({ active = false }) {
    return (
      <svg
        width="14" height="14" viewBox="0 0 14 14"
        fill="none"
        stroke={active ? '#fff' : '#555'}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 1L6 8M13 1L9 13L6 8L1 5L13 1Z" />
      </svg>
    );
  }
  
  export function MusicIcon() {
    return (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#888" strokeWidth="1.2">
        <path d="M5 10V3l7-1.5V8.5" />
        <circle cx="3" cy="10" r="2" />
        <circle cx="10" cy="8.5" r="2" />
      </svg>
    );
  }