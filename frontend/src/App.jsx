import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getStoredUser } from './utils/helpers';
import { ROUTES }     from './utils/constants';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// App pages
import HomePage    from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import UploadPage  from './pages/UploadPage/UploadPage';

// Admin
import AdminRoutes from './pages/Admin/AdminRoutes';

// Component bắt lỗi giao diện
import ErrorBoundary from './components/common/ErrorBoundary';

/*  Route guards  */
function PrivateRoute({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập từ helpers khi component mount
    setAuth(isLoggedIn());
    setIsReady(true);
  }, []);

  // Nếu chưa kiểm tra xong, hiển thị màn hình chờ (tránh bị redirect nhầm)
  if (!isReady) return null; 

  return auth ? children : <Navigate to={ROUTES.LOGIN} replace />;
}

function PublicRoute({ children }) {
  return isLoggedIn() ? <Navigate to={ROUTES.HOME} replace /> : children;
}

// BỘ BẢO VỆ CHO ADMIN
function AdminRoute({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    const loggedIn = isLoggedIn();
    // Logic kiểm tra admin của bạn
    const checkAdmin = loggedIn && user && user.email === 'admin@vibetok.vn';
    
    setIsAdmin(checkAdmin);
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return isAdmin ? children : <Navigate to={ROUTES.HOME} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Auth */}
          <Route path={ROUTES.LOGIN}    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path={ROUTES.REGISTER} element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Admin — đã được bảo vệ bởi AdminRoute */}
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminRoutes />
            </AdminRoute>
          } />

          {/* App */}
          <Route path={ROUTES.HOME}        element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path={ROUTES.EXPLORE}     element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
          <Route path={ROUTES.UPLOAD}      element={<PrivateRoute><UploadPage /></PrivateRoute>} />
          <Route path={ROUTES.PROFILE}     element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/profile/:username" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path={ROUTES.FOLLOWING}   element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path={ROUTES.LIVE}        element={<PrivateRoute><HomePage /></PrivateRoute>} />

          {/* Fallback (Khi người dùng gõ link bậy bạ) */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}