import jwt from 'jsonwebtoken';

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
        req.user = verified; // { id, ten_dang_nhap, vai_tro, iat, exp }
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
    if (req.user.vai_tro !== 'admin') {
        return res.status(403).json({ message: 'Không có quyền truy cập!' });
    }
    next();
};