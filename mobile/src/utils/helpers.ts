/**
 * Auth & storage helpers — dùng AsyncStorage thay cho localStorage.
 * API giống hệt web để dễ đồng bộ logic.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, USER_KEY } from '../constants';

// ── Token ──

export const getToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const setToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// ── User ──

export interface StoredUser {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  anh_dai_dien?: string;
  vai_tro?: string;
  tieu_su?: string;
  initials: string;
  [key: string]: unknown;
}

export const getStoredUser = async (): Promise<StoredUser | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = async (user: StoredUser): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_KEY);
};

// ── Combined ──

export const isLoggedIn = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return !!token;
};

export const clearAuth = async (): Promise<void> => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

// ── String helpers ──

export const buildInitials = (name: string = ''): string => {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('') || 'U'
  );
};
