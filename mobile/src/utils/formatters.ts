/**
 * Định dạng hiển thị số lượng và thời gian tương đối.
 */

/**
 * Rút gọn số lớn: 1200 → "1.2K", 1500000 → "1.5M"
 */
export const formatCount = (num: number): string => {
  if (num < 0) return '0';
  if (num < 1_000) return String(num);
  if (num < 1_000_000) {
    const k = num / 1_000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  const m = num / 1_000_000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
};

/**
 * Thời gian tương đối: "Vừa xong", "5 phút trước", "2 giờ trước"...
 */
export const timeAgo = (dateStr: string): string => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3_600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3_600)} giờ trước`;
  if (diffSec < 604_800) return `${Math.floor(diffSec / 86_400)} ngày trước`;
  if (diffSec < 2_592_000) return `${Math.floor(diffSec / 604_800)} tuần trước`;

  // Hiển thị ngày cụ thể nếu > 1 tháng
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

/**
 * Định dạng thời lượng video: 65 → "1:05"
 */
export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
