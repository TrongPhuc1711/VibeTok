// tiện ích chung
import { TOKEN_KEY, USER_KEY } from './constants';

//Auth helpers
export const getToken  = ()        => localStorage.getItem(TOKEN_KEY);
export const setToken  = (token)   => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = ()      => localStorage.removeItem(TOKEN_KEY);

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
};
export const setStoredUser  = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const removeStoredUser = ()   => localStorage.removeItem(USER_KEY);

export const isLoggedIn = () => !!getToken();

export const clearAuth = () => { removeToken(); removeStoredUser(); };

//String helpers
/* Slug hoá chuỗi: "Hoàng Hôn Đà Lạt" → "hoang-hon-da-lat" */
export const slugify = (str = '') =>
  str.normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .toLowerCase()
     .replace(/[^a-z0-9\s-]/g, '')
     .replace(/\s+/g, '-')
     .replace(/-+/g, '-')
     .trim();

/* Viết hoa chữ đầu */
export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1);

// Array helpers 
/* Loại bỏ phần tử trùng theo key */
export const uniqueBy = (arr, key) => {
  const seen = new Set();
  return arr.filter(item => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
};

/* Phân trang mảng */
export const paginate = (arr, page, size) =>
  arr.slice((page - 1) * size, page * size);

//Object helpers 
/* Lọc bỏ key undefined/null */
export const compact = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null && v !== ''));

/* Deep clone đơn giản (không hỗ trợ Date/Set/Map) */
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// Async helpers 
/* Giả lập delay mạng */
export const sleep = (ms = 500) => new Promise(r => setTimeout(r, ms));

/* Debounce */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/* Throttle */
export const throttle = (fn, limit = 300) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn(...args); }
  };
};

//URL helpers 
/* Tạo query string từ object */
export const toQueryString = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
};

/* Parse query string → object */
export const parseQueryString = (search = window.location.search) =>
  Object.fromEntries(new URLSearchParams(search));