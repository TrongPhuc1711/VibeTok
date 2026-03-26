import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';

// Cấu hình dotenv
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Route kiểm tra trạng thái Server
app.get('/', (req, res) => {
    res.send('🚀 VibeTok Backend đang hoạt động!');
});

// 2. Route kiểm tra kết nối Database thực tế
app.get('/api/check-db', async (req, res) => {
    try {
        // Truy vấn bảng categories (sử dụng tên cột tiếng Việt từ script của bạn)
        const [rows] = await pool.query('SELECT * FROM categories');
        res.json({
            status: "success",
            message: "Đã kết nối tới database vibeток!",
            data_count: rows.length,
            categories: rows
        });
    } catch (error) {
        console.error('Lỗi truy vấn:', error.message);
        res.status(500).json({
            status: "error",
            message: "Không thể lấy dữ liệu từ database",
            error: error.message
        });
    }
});

app.use('/api/auth', authRoutes);
// Khởi tạo cổng
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    ################################################
    Server đang chạy tại: http://localhost:${PORT}
    ################################################
    `);
});