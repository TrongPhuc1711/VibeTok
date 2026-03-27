/**
 * NavIcons — icons dùng trong Sidebar navigation
 * Mỗi icon nhận prop `active` để đổi màu
 */

const c = (active) => (active ? '#ff2d78' : '#666');

export function HomeIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2">
      <path d="M1 6L7 1L13 6V13H9V9H5V13H1V6Z" />
    </svg>
  );
}

export function CompassIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2">
      <circle cx="7" cy="7" r="6" />
      <path d="M9.5 4.5L8 8L4.5 9.5L6 6Z" />
    </svg>
  );
}

export function UsersIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2">
      <circle cx="5" cy="4" r="2.5" />
      <path d="M1 13C1 10.79 2.79 9 5 9C7.21 9 9 10.79 9 13" />
      <circle cx="10" cy="4" r="2" />
      <path d="M12 13C12 11.34 11.1 9.9 9.8 9.27" />
    </svg>
  );
}

export function LiveIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2">
      <circle cx="7" cy="7" r="2" fill={c(active)} />
      <path d="M3.5 10.5C2.2 9.2 1.5 7.7 1.5 7C1.5 4.5 4 2 7 2C10 2 12.5 4.5 12.5 7C12.5 7.7 11.8 9.2 10.5 10.5" />
    </svg>
  );
}

export function UploadIcon({ active }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14"
      fill="none" stroke={c(active)} strokeWidth="1.2" strokeLinecap="round"
    >
      <path d="M7 9V1M4 4L7 1L10 4" />
      <path d="M1 11V13H13V11" />
    </svg>
  );
}

export function UserIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2">
      <circle cx="7" cy="4" r="3" />
      <path d="M1 13C1 10.24 3.69 8 7 8C10.31 8 13 10.24 13 13" />
    </svg>
  );
}

export function SearchIcon({ color = '#555', size = 14 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 14 14" fill="none"
      stroke={color} strokeWidth="1.2"
    >
      <circle cx="6" cy="6" r="4.5" />
      <path d="M9.5 9.5L13 13" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ size = 13 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 13 13" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
    >
      <path d="M6.5 1V12M1 6.5H12" />
    </svg>
  );
}

export function ChevronIcon({ open = false, size = 12 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 12 12" fill="none"
      stroke="#555" strokeWidth="1.3" strokeLinecap="round"
      className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M2 4.5L6 8L10 4.5" />
    </svg>
  );
}