import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const getJwtSecret = () =>
    process.env.JWT_SECRET || 'vibetok_secret_key_default';

// Middleware: requires authentication
export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Cần đăng nhập!' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Cần đăng nhập!' });
    }

    try {
        const verified = jwt.verify(token, getJwtSecret());
        req.user = verified; // { id, username, role, iat, exp }

        // Kiểm tra vô hiệu hóa tạm thời (temp ban)
        // Chỉ check cho non-admin để tránh query thừa
        if (verified.role !== 'admin') {
            const [rows] = await pool.query(
                'SELECT is_active, banned_until, ban_reason FROM users WHERE id = ?',
                [verified.id]
            );
            if (rows.length > 0) {
                const user = rows[0];
                if (!user.is_active) {
                    return res.status(403).json({
                        message: 'Tài khoản của bạn đã bị vô hiệu hóa vĩnh viễn. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
                        banned: true,
                        permanentBan: true
                    });
                }
                if (user.banned_until && new Date(user.banned_until) > new Date()) {
                    const remainMs = new Date(user.banned_until).getTime() - Date.now();
                    const totalMins = Math.ceil(remainMs / 60000);
                    const days = Math.floor(totalMins / (24 * 60));
                    const hours = Math.floor((totalMins % (24 * 60)) / 60);
                    const mins = totalMins % 60;

                    const parts = [];
                    if (days > 0) parts.push(`${days} ngày`);
                    if (hours > 0) parts.push(`${hours} giờ`);
                    if (mins > 0 || parts.length === 0) parts.push(`${mins || 1} phút`);
                    const remainLabel = parts.join(' ');

                    return res.status(403).json({
                        message: `Tài khoản của bạn đã bị vô hiệu hóa tạm thời. Còn lại: ${remainLabel}.${user.ban_reason ? ` Lý do: ${user.ban_reason}` : ''}`,
                        banned: true,
                        tempBan: true,
                        bannedUntil: user.banned_until,
                    });
                }
            }
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Token không hợp lệ!' });
        }
        return res.status(403).json({ message: 'Xác thực thất bại!' });
    }
};

// Middleware: optional auth — doesn't require login but reads token if present
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const verified = jwt.verify(token, getJwtSecret());
        req.user = verified;
    } catch {
        // Invalid/expired token in optional auth: just ignore it
        req.user = null;
    }

    next();
};

// Middleware: requires admin role
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Cần đăng nhập!' });
    }
    const role = req.user.role || req.user.vai_tro;
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Không có quyền truy cập!' });
    }
    next();
};