import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredUser, isLoggedIn, clearAuth, setStoredUser } from '../utils/helpers';
import { getMe } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => getStoredUser());
    const [isAuthenticated, setIsAuthenticated] = useState(() => isLoggedIn());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoggedIn()) {
            setLoading(false);
            return;
        }
        // AbortController: cancel request khi unmount (F5 spam)
        const controller = new AbortController();
        getMe()
            .then(res => {
                if (controller.signal.aborted) return;
                setUser(res.user);
                setIsAuthenticated(true);
            })
            .catch(() => {
                if (controller.signal.aborted) return;
                const storedUser = getStoredUser();
                // Nếu vẫn còn token + user trong localStorage → giữ session
                if (isLoggedIn() && storedUser) {
                    setUser(storedUser);
                    setIsAuthenticated(true);
                } else {
                    clearAuth();
                    setUser(null);
                    setIsAuthenticated(false);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    const login = useCallback((userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        clearAuth();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    const updateUser = useCallback((updates) => {
        setUser(prev => {
            const updated = { ...prev, ...updates };
            setStoredUser(updated);
            return updated;
        });
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);