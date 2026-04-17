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
        getMe()
            .then(res => {
                setUser(res.user);
                setIsAuthenticated(true);
            })
            .catch(() => {
                clearAuth();
                setUser(null);
                setIsAuthenticated(false);
            })
            .finally(() => setLoading(false));
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