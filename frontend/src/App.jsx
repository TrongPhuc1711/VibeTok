import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getStoredUser } from './utils/helpers';
import { ROUTES } from './utils/constants';
import { ToastProvider } from './components/ui/Toast';
import { PetVibeTok } from './components/notification';
// Auth
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage';
import ChangePasswordPage from './pages/Auth/ChangePasswordPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
// App pages
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage/UploadPage';
import MessagesPage from './pages/MessagesPage';

// Admin
import AdminRoutes from './pages/Admin/AdminRoutes';

// Component bắt lỗi giao diện
import ErrorBoundary from './components/common/ErrorBoundary';

/*  Route guards  */
function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to={ROUTES.LOGIN} replace />;
}

function PublicRoute({ children }) {
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
    <BrowserRouter>
      <ToastProvider>
        <ErrorBoundary>
          <Routes>
            {/* Auth */}
            <Route path={ROUTES.LOGIN} element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path={ROUTES.REGISTER} element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path='/change-password' element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
            <Route path='/forgot-password' element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

            {/* Admin */}
            <Route path="/admin/*" element={
              <AdminRoute>
                <AdminRoutes />
              </AdminRoute>
            } />

            {/* App */}
            <Route path={ROUTES.HOME} element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path={ROUTES.EXPLORE} element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
            <Route path={ROUTES.UPLOAD} element={<PrivateRoute><UploadPage /></PrivateRoute>} />
            <Route path={ROUTES.PROFILE} element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/profile/:username" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path={ROUTES.FOLLOWING} element={<PrivateRoute><HomePage /></PrivateRoute>} />
            

            {/* Messages */}
            <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
            <Route path="/messages/:username" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />

           
            {/* Fallback */}
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </ErrorBoundary>
        {isLoggedIn() && <PetVibeTok />}
      </ToastProvider>
    </BrowserRouter>
  );
}