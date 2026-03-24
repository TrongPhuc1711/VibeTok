import { useState, useEffect, useCallback } from 'react';
import { getMe, logout as logoutApi } from '../services/authService';
import { isLoggedIn, clearAuth, getStoredUser } from '../utils/helpers';

export function useAuth() {
    const [user, setUser] = useState(getStoredUser);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn);

    useEffect(() => {
        if (!isLoggedIn()) { setLoading(false); return; }
        getMe()
            .then(res => { setUser(res.data.user); setIsAuthenticated(true); })
            .catch(() => { clearAuth(); setUser(null); setIsAuthenticated(false); })
            .finally(() => setLoading(false));
    }, []);

    const logout = useCallback(async () => {
        await logoutApi();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    const updateUser = useCallback((updates) => {
        setUser(prev => ({ ...prev, ...updates }));
    }, []);

    return { user, loading, isAuthenticated, logout, setUser, updateUser };
}