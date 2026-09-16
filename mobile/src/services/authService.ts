/**
 * Auth service — gọi API đăng nhập / đăng ký / getMe.
 * Logic normalize user giống hệt frontend web.
 */

import api from '../api/api';
import { setToken, setStoredUser, clearAuth, buildInitials } from '../utils/helpers';
import type { StoredUser } from '../utils/helpers';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: StoredUser;
  token: string;
}

/**
 * Chuẩn hoá dữ liệu user trả về từ API (field tiếng Việt → field chuẩn).
 */
const normalizeUser = (raw: Record<string, any>): StoredUser => ({
  ...raw,
  id: String(raw.id),
  username: raw.username || raw.ten_dang_nhap,
  fullName: raw.fullName || raw.ten_hien_thi || '',
  initials:
    raw.initials ||
    buildInitials(raw.fullName || raw.ten_hien_thi || ''),
});

// ── POST /api/auth/login ──
export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  try {
    const { data } = await api.post('/auth/login', payload);
    const user = normalizeUser(data.user);

    await setToken(data.token);
    await setStoredUser(user);

    return { user, token: data.token };
  } catch (error: any) {
    const msg =
      error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!';
    const err = new Error(msg) as any;
    err.response = error.response;
    throw err;
  }
};

// ── POST /api/auth/register ──
export const register = async ({ fullName, email, password }: RegisterPayload) => {
  try {
    const payload = {
      email,
      password,
      display_name: fullName,
      username: email.split('@')[0] + Math.floor(Math.random() * 1000),
    };
    const { data } = await api.post('/auth/register', payload);
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!',
    );
  }
};

// ── GET /api/auth/me ──
export const getMe = async (): Promise<{ user: StoredUser }> => {
  try {
    const { data } = await api.get('/auth/me');
    const user = normalizeUser(data.user);
    await setStoredUser(user);
    return { user };
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      await clearAuth();
    }
    throw error;
  }
};

// ── POST /api/auth/forgot-password ──
export const forgotPassword = async (email: string) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

// ── Logout (local only) ──
export const logout = async () => {
  await clearAuth();
  return { message: 'Đã đăng xuất' };
};
