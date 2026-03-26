import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // Lấy token từ header "Authorization" (Thường có dạng: Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            message: 'Quyền truy cập bị từ chối! Bạn cần đăng nhập.' 
        });
    }

    try {
        // Giải mã và kiểm tra token
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'vibetok_secret_key_default');
        
        // Gắn thông tin người dùng đã giải mã vào đối tượng req để các Controller phía sau sử dụng
        req.user = verified; 

        next(); // Token hợp lệ, cho phép đi tiếp đến Controller thực tế!
    } catch (error) {
        return res.status(403).json({ 
            message: 'Token không hợp lệ hoặc đã hết hạn!' 
        });
    }
};