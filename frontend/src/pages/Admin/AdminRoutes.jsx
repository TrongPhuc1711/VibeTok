import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/helpers';
import DashboardPage from './DashboardPage';
import AnalyticsPage from './AnalyticsPage';
import UserManagerPage from './UserManagerPage';
import ModerationPage from './ModerationPage';

/* AdminGuard — chỉ cho phép user có vai_tro === 'admin' */
function AdminGuard({ children }) {
    const user = getStoredUser();
    if (!user) return <Navigate to="/login" replace />;
    if (user.vai_tro !== 'admin') return <Navigate to="/" replace />;
    return children;
}

export default function AdminRoutes() {
    return (
        <AdminGuard>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/users" element={<UserManagerPage />} />
                <Route path="/videos" element={<ModerationPage />} />
                <Route path="/moderation" element={<ModerationPage />} />
                <Route path="/settings" element={<DashboardPage />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </AdminGuard>
    );
}