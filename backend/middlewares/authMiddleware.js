import jwt from 'jsonwebtoken';

// Middleware bắt buộc đăng nhập
export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Cần đăng nhập!' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'vibetok_secret_key_default');
        req.user = verified; // verified chứa: { id, ten_dang_nhap, vai_tro }
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// Middleware TÙY CHỌN — không bắt buộc đăng nhập
// Dùng cho các route public nhưng muốn biết user hiện tại nếu có token
// (vd: followers/following list để check isFollowing, ẩn admin với user thường)
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'vibetok_secret_key_default');
        req.user = verified; // verified chứa: { id, ten_dang_nhap, vai_tro }
    } catch {
        req.user = null;
    }
    next();
};