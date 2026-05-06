export function ImageIcon() {
  return (
    <svg
      width="28" height="28" viewBox="0 0 28 28"
      fill="none" stroke="#ff2d78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="3" y="5" width="22" height="18" rx="3" />
      <circle cx="10" cy="12" r="2.5" />
      <path d="M25 19l-5.5-6-4 4.5-3-2.5L3 21" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 20, color = '#fff' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, color = '#fff' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function TrashIcon({ size = 14 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16"
      fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
    >
      <path d="M2 4h12M5.5 4V2.5h5V4M6 7v5M10 7v5" />
      <path d="M3.5 4l.7 9.5a1 1 0 001 .9h5.6a1 1 0 001-.9L12.5 4" />
    </svg>
  );
}

export function PlusIcon({ size = 20, color = '#ff2d78' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20"
      fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function PauseCircleIcon({ size = 24 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M10 8v8M14 8v8" />
    </svg>
  );
}

export function PlayCircleIcon({ size = 24 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DragHandleIcon({ size = 14 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 14 14"
      fill="currentColor" opacity="0.4"
    >
      <circle cx="5" cy="3" r="1.2" />
      <circle cx="9" cy="3" r="1.2" />
      <circle cx="5" cy="7" r="1.2" />
      <circle cx="9" cy="7" r="1.2" />
      <circle cx="5" cy="11" r="1.2" />
      <circle cx="9" cy="11" r="1.2" />
    </svg>
  );
}
