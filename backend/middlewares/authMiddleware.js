import jwt from 'jsonwebtoken';

// Middleware bắt buộc đăng nhập
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            message: 'Quyền truy cập bị từ chối! Bạn cần đăng nhập.' 
        });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'vibetok_secret_key_default');
        req.user = verified; 
        next();
    } catch (error) {
        return res.status(403).json({ 
            message: 'Token không hợp lệ hoặc đã hết hạn!' 
        });
    }
};

// Middleware TÙY CHỌN — không bắt buộc đăng nhập
// Dùng cho các route public nhưng muốn biết user hiện tại nếu có token
// (vd: followers/following list để check isFollowing)
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'vibetok_secret_key_default');
        req.user = verified;
    } catch {
        req.user = null;
    }
    next();
};