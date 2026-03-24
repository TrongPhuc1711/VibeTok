//format hiển thị

/* 1200 → "1.2K",  1_200_000 → "1.2M" */
export const formatCount = (n) => {
    if (n == null || isNaN(n)) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };
  
  /* 125 giây → "2:05" */
  export const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  /* timestamp → "2 giờ trước" */
  export const formatTimeAgo = (timestamp) => {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60)       return 'Vừa xong';
    if (diff < 3600)     return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400)    return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000)  return `${Math.floor(diff / 86400)} ngày trước`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
    return `${Math.floor(diff / 31536000)} năm trước`;
  };
  
  /* Cắt chuỗi, thêm "…" nếu quá dài */
  export const truncate = (str, max = 100) =>
    !str ? '' : str.length > max ? str.slice(0, max) + '…' : str;
  
  /* Trích hashtag từ caption */
  export const parseHashtags = (text = '') =>
    text.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g) ?? [];
  
  /* Caption không có hashtag */
  export const stripHashtags = (text = '') =>
    text.replace(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g, '').trim();
  
  /* "nguyenvibe" → "@nguyenvibe" */
  export const normalizeUsername = (u = '') =>
    u.startsWith('@') ? u : `@${u}`;
  
  /* Bytes → "1.2 MB" */
  export const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };
  
  /* Date object → "dd/mm/yyyy" */
  export const formatDateVN = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d)) return '';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };
  
  /* Initials từ fullName: "Nguyen Vibe" → "NV" */
  export const getInitials = (name = '') =>
    name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');