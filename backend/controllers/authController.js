import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// ĐĂNG KÝ (REGISTER)
export const register = async (req, res) => {
    try {
        const { ten_dang_nhap, email, mat_khau, ten_hien_thi } = req.body;

        // 1. RÀO CHẮN: Kiểm tra dữ liệu đầu vào (Ngăn lỗi 500 do thiếu dữ liệu)
        if (!email || !mat_khau || !ten_hien_thi || !ten_dang_nhap) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin (email, mật khẩu, tên hiển thị, tên đăng nhập)!' });
        }

        // 2. Kiểm tra xem email hoặc tên đăng nhập đã tồn tại chưa
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ? OR ten_dang_nhap = ?',
            [email, ten_dang_nhap]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email hoặc Tên đăng nhập đã được sử dụng!' });
        }

        // 3. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(mat_khau, salt);

        // 4. Lưu người dùng mới vào database
        const [result] = await pool.query(
            'INSERT INTO users (ten_dang_nhap, email, mat_khau, ten_hien_thi) VALUES (?, ?, ?, ?)',
            [ten_dang_nhap, email, hashedPassword, ten_hien_thi]
        );

        res.status(201).json({ 
            message: 'Đăng ký tài khoản thành công!', 
            userId: result.insertId 
        });

    } catch (error) {
        console.error('Lỗi API Đăng ký:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng ký', error: error.message });
    }
};

// ĐĂNG NHẬP (LOGIN)
export const login = async (req, res) => {
    try {
        const { email, mat_khau } = req.body;

        // 1. RÀO CHẮN: Kiểm tra dữ liệu
        if (!email || !mat_khau) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu!' });
        }

        // 2. Tìm người dùng theo email
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ message: 'Email không tồn tại trong hệ thống!' });
        }

        const user = users[0];

        // 3. So sánh mật khẩu
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không chính xác!' });
        }

        // 4. Tạo JWT Token
        const token = jwt.sign(
            { id: user.id, ten_dang_nhap: user.ten_dang_nhap, vai_tro: user.vai_tro },
            process.env.JWT_SECRET || 'vibetok_secret_key_default',
            { expiresIn: '7d' } // Token sống được 7 ngày
        );

        // 5. Trả về token và thông tin user
        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user.id,
                ten_dang_nhap: user.ten_dang_nhap,
                ten_hien_thi: user.ten_hien_thi,
                anh_dai_dien: user.anh_dai_dien,
                vai_tro: user.vai_tro
            }
        });

    } catch (error) {
        console.error('Lỗi API Đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập', error: error.message });
    }
};