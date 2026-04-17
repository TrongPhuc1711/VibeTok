// hooks/useAuth.js
// Dùng AuthContext để có reactive state - sidebar tự update khi login/logout
import { useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
    const ctx = useAuthContext();
    return {
        user: ctx.user,
        loading: ctx.loading,
        isAuthenticated: ctx.isAuthenticated,
        login: ctx.login,
        logout: ctx.logout,
        updateUser: ctx.updateUser,
        // Alias để tương thích code cũ
        setUser: ctx.updateUser,
    };
}