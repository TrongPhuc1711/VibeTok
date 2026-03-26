import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';


//ĐĂNG KÝ (REGISTER)
export const register = async (req, res) => {
    // Lấy dữ liệu từ Frontend gửi lên
    const { ten_dang_nhap, email, mat_khau, ten_hien_thi } = req.body;

    try {
        // Kiểm tra xem email hoặc tên đăng nhập đã tồn tại chưa
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR ten_dang_nhap = ?',
            [email, ten_dang_nhap]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email hoặc Tên đăng nhập đã được sử dụng!' });
        }

        // Mã hóa mật khẩu (Băm mật khẩu để bảo mật dữ liệu người dùng)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(mat_khau, salt);

        // Lưu người dùng mới vào database
        const [result] = await pool.query(
            'INSERT INTO users (ten_dang_nhap, email, mat_khau, ten_hien_thi) VALUES (?, ?, ?, ?)',
            [ten_dang_nhap, email, hashedPassword, ten_hien_thi || ten_dang_nhap]
        );

        res.status(201).json({ 
            message: 'Đăng ký tài khoản thành công!', 
            userId: result.insertId 
        });

    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};


// ĐĂNG NHẬP (LOGIN)
export const login = async (req, res) => {
    const { email, mat_khau } = req.body;

    try {
        // Tìm người dùng theo email
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ message: 'Email không tồn tại!' });
        }

        const user = users[0];

        // So sánh mật khẩu người dùng nhập vào với mật khẩu đã băm trong DB
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng!' });
        }

        // Tạo JWT Token để xác thực các request sau này
        const token = jwt.sign(
            { id: user.id, ten_dang_nhap: user.ten_dang_nhap, vai_tro: user.vai_tro },
            process.env.JWT_SECRET || 'vibetok_secret_key_default',
            { expiresIn: '7d' } // Token có hiệu lực 7 ngày
        );

        // Trả về token và thông tin cơ bản (không trả về mật khẩu)
        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user.id,
                ten_dang_nhap: user.ten_dang_nhap,
                ten_hien_thi: user.ten_hien_thi,
                anh_dai_dien: user.anh_dai_dien
            }
        });

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};