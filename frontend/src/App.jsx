import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getStoredUser } from './utils/helpers';
import { ROUTES } from './utils/constants';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
// App pages
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage/UploadPage';
import MessagesPage from './pages/MessagesPage';
import NotFoundPage from './pages/NotFoundPage';
import VideoDetailPage from './pages/VideoDetailPage';

// Admin
import AdminRoutes from './pages/Admin/AdminRoutes';

// Component bắt lỗi giao diện
import ErrorBoundary from './components/common/ErrorBoundary';

/*  Route guards  */
function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to={ROUTES.LOGIN} replace />;
}

// PublicRoute chỉ dùng cho trang auth (login/register)
// Nếu đã đăng nhập thì redirect về home
function AuthRoute({ children }) {
  return isLoggedIn() ? <Navigate to={ROUTES.HOME} replace /> : children;
}

// BỘ BẢO VỆ CHO ADMIN
function AdminRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to={ROUTES.LOGIN} replace />;

  const user = getStoredUser();
  const isAdmin = user?.vai_tro === 'admin';

  if (!isAdmin) return <Navigate to={ROUTES.HOME} replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      {/* AuthProvider bọc toàn bộ app để sidebar reactive khi login/logout */}
      <AuthProvider>
        <BrowserRouter>
          <ToastProvider>
            <ErrorBoundary>
              <Routes>
                {/* Auth — chỉ hiện khi chưa đăng nhập */}
                <Route path={ROUTES.LOGIN} element={<AuthRoute><LoginPage /></AuthRoute>} />
                <Route path={ROUTES.REGISTER} element={<AuthRoute><RegisterPage /></AuthRoute>} />
                <Route path='/change-password' element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
                <Route path='/forgot-password' element={<ForgotPasswordPage />} />

                {/* Admin */}
                <Route path="/admin/*" element={
                  <AdminRoute>
                    <AdminRoutes />
                  </AdminRoute>
                } />

                {/* App — công khai, không cần đăng nhập để xem */}
                <Route path={ROUTES.HOME} element={<HomePage />} />
                <Route path={ROUTES.EXPLORE} element={<ExplorePage />} />
                <Route path={ROUTES.UPLOAD} element={<PrivateRoute><UploadPage /></PrivateRoute>} />
                {/* Profile: đăng nhập mới xem profile của chính mình, còn xem người khác thì public */}
                <Route path={ROUTES.PROFILE} element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path={ROUTES.FOLLOWING} element={<PrivateRoute><HomePage feedType="following"/></PrivateRoute>} />
                <Route path="/video/:id" element={<VideoDetailPage />} />

                {/* Messages */}
                <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
                <Route path="/messages/:username" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </ToastProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}