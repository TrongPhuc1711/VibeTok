const s = (active) => (active ? '#ff2d78' : '#555');

export function DashIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={s(active)} strokeWidth="1.4">
      <rect x="1" y="1" width="7" height="7" rx="1.5"/>
      <rect x="10" y="1" width="7" height="7" rx="1.5"/>
      <rect x="1" y="10" width="7" height="7" rx="1.5"/>
      <rect x="10" y="10" width="7" height="7" rx="1.5"/>
    </svg>
  );
}

export function ChartLineIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={s(active)} strokeWidth="1.4" strokeLinecap="round">
      <path d="M1 17L6 10L10 13L14 6L17 9"/>
      <path d="M1 17h16"/>
    </svg>
  );
}

export function UsersAdminIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={s(active)} strokeWidth="1.4" strokeLinecap="round">
      <circle cx="7" cy="5" r="3"/>
      <path d="M1 17C1 13.69 3.69 11 7 11C10.31 11 13 13.69 13 17"/>
      <circle cx="14" cy="5" r="2"/>
      <path d="M16 17C16 14.79 15.1 12.9 13.8 12.1"/>
    </svg>
  );
}

export function VideoAdminIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={s(active)} strokeWidth="1.4">
      <rect x="1" y="3" width="11" height="12" rx="2"/>
      <path d="M12 7.5l5-3v9l-5-3V7.5z"/>
    </svg>
  );
}

export function FlagAdminIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={s(active)} strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 17V1M3 1l12 5-12 5"/>
    </svg>
  );
}

export function ShieldAdminIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={s(active)} strokeWidth="1.4" strokeLinecap="round">
      <path d="M9 1L2 4v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V4L9 1z"/>
      <path d="M6 9l2 2 4-4"/>
    </svg>
  );
}

export function SettingsAdminIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={s(active)} strokeWidth="1.4">
      <circle cx="9" cy="9" r="3"/>
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M3.22 14.78l1.42-1.42M13.36 4.64l1.42-1.42"/>
    </svg>
  );
}

export function BellAdminIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#666" strokeWidth="1.3" strokeLinecap="round">
      <path d="M7.5 1.5a4 4 0 014 4v3l1.5 1.5H2L3.5 8.5v-3a4 4 0 014-4z"/>
      <path d="M6 12a1.5 1.5 0 003 0"/>
    </svg>
  );
}

export function SearchAdminIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="5.5" cy="5.5" r="4.5"/>
      <path d="M9 9l3 3"/>
    </svg>
  );
}

export function ExportAdminIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M2 10h8M6 1v7M3.5 5L6 7.5 8.5 5"/>
    </svg>
  );
}

export function PlusAdminIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 1v10M1 6h10"/>
    </svg>
  );
}

export function PlayAdminIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="rgba(255,255,255,.8)">
      <path d="M4 2.5l9 5.5-9 5.5V2.5z"/>
    </svg>
  );
}

export function MusicAdminIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={s(active)} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 15V4l10-2v11"/>
      <circle cx="4.5" cy="15" r="2.5"/>
      <circle cx="14.5" cy="13" r="2.5"/>
    </svg>
  );
}