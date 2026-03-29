import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/helpers';
import DashboardPage  from './Dashboard/DashboardPage';
import AnalyticsPage  from './AnalyticsPage';
import UserManager from './UserManager';
import ModerationPage from './ModerationPage';

/* AdminGuard — chỉ cho phép user có vai_tro === 'admin'
 Nếu không phải admin → redirect về /login
 */
function AdminGuard({ children }) {
    const user = getStoredUser();

    // Chưa đăng nhập → về login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Đã đăng nhập nhưng không phải admin → về trang chủ
    if (user.vai_tro !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default function AdminRoutes() {
    return (
        <AdminGuard>
            <Routes>
                <Route path="/"           element={<DashboardPage />}  />
                <Route path="/analytics"  element={<AnalyticsPage />}  />
                <Route path="/users"      element={<UserManager />} />
                <Route path="/videos"     element={<ModerationPage />} />
                <Route path="/reports"    element={<ModerationPage />} />
                <Route path="/moderation" element={<ModerationPage />} />
                <Route path="/settings"   element={<DashboardPage />}  />
                <Route path="*"           element={<Navigate to="/admin" replace />} />
            </Routes>
        </AdminGuard>
    );
}