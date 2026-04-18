//hằng số dùng toàn app
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

// LocalStorage keys
export const TOKEN_KEY = 'vibetok_token';
export const USER_KEY = 'vibetok_user';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const FEED_PAGE_SIZE = 5;

// Upload limits
export const MAX_VIDEO_SIZE_MB = 500;
export const MAX_CAPTION_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 300;
export const MAX_BIO_LENGTH = 200;

// Video
export const VIDEO_PRIVACY = {
  PUBLIC: 'public',
  FRIENDS: 'friends',
  PRIVATE: 'private',
};

export const VIDEO_PRIVACY_LABELS = {
  [VIDEO_PRIVACY.PUBLIC]: 'Mọi người',
  [VIDEO_PRIVACY.FRIENDS]: 'Bạn bè',
  [VIDEO_PRIVACY.PRIVATE]: 'Chỉ mình tôi',
};

export const DUET_OPTIONS = {
  BOTH: 'both',
  DUET: 'duet',
  STITCH: 'stitch',
  NONE: 'none',
};

export const DUET_LABELS = {
  [DUET_OPTIONS.BOTH]: 'Duet & Stitch',
  [DUET_OPTIONS.DUET]: 'Chỉ Duet',
  [DUET_OPTIONS.STITCH]: 'Chỉ Stitch',
  [DUET_OPTIONS.NONE]: 'Không cho phép',
};

// Feed tabs
export const FEED_TABS = {
  FOR_YOU: 'forYou',
  FOLLOWING: 'following',
  
};

// Navigation routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  EXPLORE: '/explore',
  UPLOAD: '/upload',
  PROFILE: '/profile',
  NOTIFICATION: '/notification',
  FOLLOWING: '/following',
  MESSAGE: '/messages',
  CHANGE_PASSWORD: '/change-password',
  FORGOT_PASSWORD: '/forgot-password'
};

// Categories
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
];

// Age constraints
export const MIN_AGE = 13;
export const MAX_AGE = 120;

// Password rules
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;