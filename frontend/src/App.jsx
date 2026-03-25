import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './utils/helpers';

// pages/auth
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// pages
import HomePage    from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import UploadPage  from './pages/UploadPage';

// Route guards
function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}
function PublicRoute({ children }) {
  return isLoggedIn() ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* App */}
        <Route path="/"                  element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/explore"           element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
        <Route path="/upload"            element={<PrivateRoute><UploadPage /></PrivateRoute>} />
        <Route path="/profile"           element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/:username" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/following"         element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/live"              element={<PrivateRoute><HomePage /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}