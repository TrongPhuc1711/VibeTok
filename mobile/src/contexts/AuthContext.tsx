/**
 * AuthContext — quản lý trạng thái xác thực toàn app.
 * Logic giống hệt frontend/src/contexts/AuthContext.jsx
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  getStoredUser,
  setStoredUser as persistUser,
  clearAuth,
  isLoggedIn,
} from '../utils/helpers';
import { getMe } from '../services/authService';
import type { StoredUser } from '../utils/helpers';

interface AuthState {
  user: StoredUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: StoredUser) => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<StoredUser>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // Khôi phục session khi app khởi động
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        setLoading(false);
        return;
      }

      try {
        const { user: freshUser } = await getMe();
        if (cancelled) return;
        setUser(freshUser);
        setIsAuth(true);
      } catch {
        if (cancelled) return;
        // Nếu getMe thất bại nhưng vẫn còn token → dùng cached user
        const cached = await getStoredUser();
        const stillLoggedIn = await isLoggedIn();
        if (stillLoggedIn && cached) {
          setUser(cached);
          setIsAuth(true);
        } else {
          await clearAuth();
          setUser(null);
          setIsAuth(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((userData: StoredUser) => {
    setUser(userData);
    setIsAuth(true);
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
    setIsAuth(false);
  }, []);

  const updateUser = useCallback((updates: Partial<StoredUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      persistUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: isAuth,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
