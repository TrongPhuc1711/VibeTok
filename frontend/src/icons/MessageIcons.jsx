

export function SendIcon({ active = false, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none"
      stroke={active ? '#fff' : '#555'} strokeWidth="1.3"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 1L6 8M13 1L9 13L6 8L1 5L13 1Z" />
    </svg>
  );
}

export function ChatBubbleIcon({ size = 32, color = '#444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.3" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

export function BackChevronIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M10 13L5 8L10 3" />
    </svg>
  );
}

/* ─── Search ─── */

export function SearchSmIcon({ size = 13, color = '#444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none"
      stroke={color} strokeWidth="1.2" strokeLinecap="round">
      <circle cx="5.5" cy="5.5" r="4.5" />
      <path d="M9 9l3 3" />
    </svg>
  );
}

export function CloseIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 2l10 10M12 2L2 12" />
    </svg>
  );
}

export function ChevronUpIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 9l4-4 4 4" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5l4 4 4-4" />
    </svg>
  );
}

/* ─── Recall / Unsend ─── */

export function UnsendIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l6-3 6 3-6 3-6-3z" />
      <path d="M2 4v7l6 3v-7" />
      <path d="M14 4v4" />
      <path d="M11 11l2 2 2-2" />
      <path d="M13 13V9" />
    </svg>
  );
}

export function RecalledIcon({ size = 14, color = '#555' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <path d="M2 8C2 4.69 4.69 2 8 2C10.09 2 11.93 3.04 13.07 4.63" />
      <path d="M14 8C14 11.31 11.31 14 8 14C5.91 14 4.07 12.96 2.93 11.37" />
      <path d="M13 2v3h-3" />
      <path d="M3 14v-3h3" />
    </svg>
  );
}

/* ─── Copy / More ─── */

export function CopyIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" />
    </svg>
  );
}

export function DotsHorizontalIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="13" cy="8" r="1.5" />
    </svg>
  );
}

/* ─── Emoji / React ─── */

export function EmojiSmileIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke={color} strokeWidth="1.3" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.5 9.5C5.5 9.5 6.5 11 8 11C9.5 11 10.5 9.5 10.5 9.5" />
      <circle cx="5.5" cy="6.5" r="0.7" fill={color} />
      <circle cx="10.5" cy="6.5" r="0.7" fill={color} />
    </svg>
  );
}

/* ─── Voice Call ─── */

export function PhoneIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 11.17l-2.5-.29-1.17 1.17a10.87 10.87 0 01-4.88-4.88L7.12 6 6.83 3.5H4.33A10.5 10.5 0 0014.5 13.67V11.17z" />
    </svg>
  );
}

export function PhoneCallIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 1C15.76 1 18 3.24 18 6M13 4C14.1 4 15 4.9 15 6" />
      <path d="M18 14.5v2.17a1.5 1.5 0 01-1.63 1.5C8.46 17.46 2.54 11.54 1.83 3.63A1.5 1.5 0 013.33 2h2.17a1.5 1.5 0 011.5 1.33c.1.9.32 1.78.64 2.62a1.5 1.5 0 01-.34 1.58l-.91.91A12.05 12.05 0 0013 15.15l.92-.92a1.5 1.5 0 011.58-.33c.84.32 1.72.54 2.62.64A1.5 1.5 0 0118 16z" />
    </svg>
  );
}

export function PhoneOffIcon({ size = 20, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Phone */}
      <path d="M22 16.92v2a2 2 0 0 1-2.18 2 
           19.86 19.86 0 0 1-8.63-3.07 
           19.5 19.5 0 0 1-6-6 
           19.86 19.86 0 0 1-3.07-8.67 
           A2 2 0 0 1 4.11 2h2 
           a2 2 0 0 1 2 1.72 
           12.84 12.84 0 0 0 .7 2.81 
           2 2 0 0 1-.45 2.11L7.09 9.91 
           a16 16 0 0 0 6 6l1.27-1.27 
           a2 2 0 0 1 2.11-.45 
           12.84 12.84 0 0 0 2.81.7 
           A2 2 0 0 1 22 16.92z"
      />
      
    </svg>
  );
}

export function PhoneIncomingIcon({ size = 20, color = '#4ade80' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 14.5v2.17a1.5 1.5 0 01-1.63 1.5C8.46 17.46 2.54 11.54 1.83 3.63A1.5 1.5 0 013.33 2h2.17a1.5 1.5 0 011.5 1.33c.1.9.32 1.78.64 2.62a1.5 1.5 0 01-.34 1.58l-.91.91A12.05 12.05 0 0013 15.15l.92-.92a1.5 1.5 0 011.58-.33c.84.32 1.72.54 2.62.64A1.5 1.5 0 0118 16z" />
      <path d="M15 1l-4 4 4 4" />
      <path d="M11 5h8" />
    </svg>
  );
}

export function PhoneDeclineIcon({ size = 20, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 14.5v2.17a1.5 1.5 0 01-1.63 1.5C8.46 17.46 2.54 11.54 1.83 3.63A1.5 1.5 0 013.33 2h2.17a1.5 1.5 0 011.5 1.33c.1.9.32 1.78.64 2.62a1.5 1.5 0 01-.34 1.58l-.91.91A12.05 12.05 0 0013 15.15l.92-.92a1.5 1.5 0 011.58-.33c.84.32 1.72.54 2.62.64A1.5 1.5 0 0118 16z" />
    </svg>
  );
}

/* ─── Video Call ─── */

export function VideoIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="12" height="10" rx="2" />
      <path d="M13 8l6-3v10l-6-3V8z" />
    </svg>
  );
}

export function VideoOffIcon({ size = 20, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 11l3 1.5V7L16 9M1 5h8a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z" />
      <path d="M2 2l16 16" />
    </svg>
  );
}

export function VideoCallIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="12" height="10" rx="2" />
      <path d="M13 8l6-3v10l-6-3V8z" />
      <path d="M4 10h4M6 8v4" />
    </svg>
  );
}

/* ─── Mic ─── */

export function MicIcon({ size = 20, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="7" y="1" width="6" height="10" rx="3" />
      <path d="M3 9a7 7 0 0014 0" />
      <path d="M10 16v3M7 19h6" />
    </svg>
  );
}

export function MicOffIcon({ size = 20, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.40135 12.5C9.63354 12.9014 9.95606 13.244 10.3411 13.5M9.17071 4C9.58254 2.83481 10.6938 2 12 2C13.6569 2 15 3.34315 15 5L15 10.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11C6 14.3137 8.68629 17 12 17C12.4675 17 12.9225 16.9465 13.3592 16.8454M18 11C18 11.854 17.8216 12.6663 17.5 13.4017" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="18" x2="12" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="21" x2="14" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="2.4137" y1="2.03821" x2="19.0382" y2="19.5863" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Speaker / Volume ─── */

export function SpeakerIcon({ size = 20, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 7h4l5-4v14l-5-4H2V7z" />
      <path d="M15 5c2 1.5 2 5.5 0 8M18 3c3 3 3 11 0 14" />
    </svg>
  );
}

/* ─── Image Upload ─── */

export function ImageIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none"
      stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <rect x="1.5" y="3" width="15" height="12" rx="2" />
      <circle cx="6.5" cy="7.5" r="1.5" />
      <path d="M1.5 13l4-4 3 3 2.5-2.5 4 4.5" />
    </svg>
  );
}

/* ─── Info / More Info ─── */

export function InfoIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7v5M8 5v.5" />
    </svg>
  );
}

/* ─── Check / Read status ─── */

export function CheckIcon({ size = 12, color = '#555' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 6L5 9.5L10.5 3" />
    </svg>
  );
}

export function DoubleCheckIcon({ size = 14, color = '#555' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 12" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 6l4 4L11 2" />
    </svg>
  );
}

export function CallIncomingArrowIcon({ className = '', size = 10, color = '#4ade80' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="7" x2="7" y2="17"></line>
      <polyline points="17 17 7 17 7 7"></polyline>
    </svg>
  );
}

export function CallOutgoingArrowIcon({ className = '', size = 10, color = '#888' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7"></line>
      <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
  );
}
