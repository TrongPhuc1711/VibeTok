import { delay, ok, fail, mockUsers } from './mockData';
import { setToken, setStoredUser, clearAuth } from '../utils/helpers';

const safe = ({ password: _, ...u }) => u;

/* POST /api/auth/login */
export const login = async ({ email, password }) => {
    await delay(700);
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) fail(401, 'Email hoặc mật khẩu không đúng');

    const token = `mock_${user.id}_${Date.now()}`;
    setToken(token);
    setStoredUser(safe(user));
    return ok({ user: safe(user), token });
};

/* POST /api/auth/register */
export const register = async ({ fullName, email, password, birthDate }) => {
    await delay(900);
    if (mockUsers.find(u => u.email === email)) fail(409, 'Email đã được sử dụng');

    const user = {
        id: `u_${Date.now()}`, fullName, email, username: email.split('@')[0],
        initials: fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        bio: '', birthDate, isCreator: false,
        followers: 0, following: 0, likes: 0, videos: 0,
        createdAt: new Date().toISOString(),
    };
    mockUsers.push({ ...user, password });

    const token = `mock_${user.id}_${Date.now()}`;
    setToken(token);
    setStoredUser(user);
    return ok({ user, token });
};

/* POST /api/auth/logout */
export const logout = async () => {
    await delay(200);
    clearAuth();
    return ok({ message: 'Đã đăng xuất' });
};

/* GET /api/auth/me */
export const getMe = async () => {
    await delay(300);
    const { getStoredUser } = await import('../utils/helpers');
    const user = getStoredUser();
    if (!user) fail(401, 'Chưa đăng nhập');
    return ok({ user });
};

/* POST /api/auth/forgot-password */
export const forgotPassword = async ({ email }) => {
    await delay(600);
    if (!mockUsers.find(u => u.email === email)) fail(404, 'Email không tồn tại');
    return ok({ message: `Link đặt lại mật khẩu đã gửi đến ${email}` });
};