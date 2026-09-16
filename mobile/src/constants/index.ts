/**
 * Hằng số toàn app — tái sử dụng logic từ frontend web.
 *
 * ⚠️  API_BASE_URL: đổi IP thành IP nội bộ máy tính của bạn
 *     khi test trên điện thoại qua Expo Go.
 *     Chạy `ipconfig` (Windows) hoặc `ifconfig` (Mac) để lấy IP.
 */

// ── API ──
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://vibetok.onrender.com/api';

// ── AsyncStorage keys ──
export const TOKEN_KEY = 'vibetok_token';
export const USER_KEY = 'vibetok_user';

// ── Pagination ──
export const DEFAULT_PAGE_SIZE = 10;
export const FEED_PAGE_SIZE = 5;

// ── Upload limits ──
export const MAX_VIDEO_SIZE_MB = 500;
export const MAX_CAPTION_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 300;
export const MAX_BIO_LENGTH = 200;

// ── Video privacy ──
export const VIDEO_PRIVACY = {
  PUBLIC: 'public',
  FRIENDS: 'friends',
  PRIVATE: 'private',
} as const;

export const VIDEO_PRIVACY_LABELS: Record<string, string> = {
  [VIDEO_PRIVACY.PUBLIC]: 'Mọi người',
  [VIDEO_PRIVACY.FRIENDS]: 'Bạn bè',
  [VIDEO_PRIVACY.PRIVATE]: 'Chỉ mình tôi',
};

// ── Feed tabs ──
export const FEED_TABS = {
  FOR_YOU: 'forYou',
  FOLLOWING: 'following',
} as const;

// ── Categories (Explore) ──
export const CATEGORIES = [
  { id: 'all', label: 'Tất cả', value: 'all' },
  { id: 'dance', label: 'Dance', value: 'Dance' },
  { id: 'music', label: 'Music', value: 'Music' },
  { id: 'food', label: 'Food', value: 'Food' },
  { id: 'travel', label: 'Travel', value: 'Travel' },
  { id: 'gaming', label: 'Gaming', value: 'Gaming' },
  { id: 'comedy', label: 'Comedy', value: 'Comedy' },
  { id: 'fashion', label: 'Fashion', value: 'Fashion' },
  { id: 'beauty', label: 'Beauty', value: 'Beauty' },
] as const;

// ── Validation ──
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
