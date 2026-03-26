import express from 'express';
import { register, login } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js'; // 1. Import middleware vào

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// 2. Route được bảo vệ (Chỉ người đã đăng nhập mới gọi được)
router.get('/me', verifyToken, (req, res) => {
    // req.user được lấy ra từ middleware ở Bước 1
    res.json({
        message: "Chào mừng bạn trở lại!",
        user: req.user 
    });
});

export default router;