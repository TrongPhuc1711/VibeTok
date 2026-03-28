import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './utils/helpers';
import { ROUTES } from './utils/constants';

// Auth pages
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// App pages
import HomePage    from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import UploadPage  from './pages/UploadPage/UploadPage';

/* ── Route guards */
function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to={ROUTES.LOGIN} replace />;
}
function PublicRoute({ children }) {
  return isLoggedIn() ? <Navigate to={ROUTES.HOME} replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các tuyến đường Công khai: Chỉ truy cập được khi CHƯA đăng nhập */}
        <Route path={ROUTES.LOGIN} element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />
        <Route path={ROUTES.REGISTER} element={
          <PublicRoute><RegisterPage /></PublicRoute>
        } />

        {/* Các tuyến đường Riêng tư: Bắt buộc phải đăng nhập */}
        <Route path={ROUTES.HOME} element={
          <PrivateRoute><HomePage /></PrivateRoute>
        } />
        <Route path={ROUTES.EXPLORE} element={
          <PrivateRoute><ExplorePage /></PrivateRoute>
        } />
        <Route path={ROUTES.UPLOAD} element={
          <PrivateRoute><UploadPage /></PrivateRoute>
        } />
        <Route path={ROUTES.PROFILE} element={
          <PrivateRoute><ProfilePage /></PrivateRoute>
        } />
        <Route path="/profile/:username" element={
          <PrivateRoute><ProfilePage /></PrivateRoute>
        } />
        <Route path={ROUTES.FOLLOWING} element={
          <PrivateRoute><HomePage /></PrivateRoute>
        } />
        <Route path={ROUTES.LIVE} element={
          <PrivateRoute><HomePage /></PrivateRoute>
        } />

        {/* Chuyển hướng mặc định */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}