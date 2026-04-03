import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import nodemailer from 'nodemailer';
// ĐĂNG KÝ
export const register = async (req, res) => {
    try {
        const { ten_dang_nhap, email, mat_khau, ten_hien_thi } = req.body;

        if (!email || !mat_khau || !ten_hien_thi || !ten_dang_nhap) {
            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ thông tin (email, mật khẩu, tên hiển thị, tên đăng nhập)!'
            });
        }

        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ? OR ten_dang_nhap = ?',
            [email, ten_dang_nhap]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email hoặc Tên đăng nhập đã được sử dụng!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(mat_khau, salt);

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

// ĐĂNG NHẬP
export const login = async (req, res) => {
    try {
        const { email, mat_khau } = req.body;

        if (!email || !mat_khau) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu!' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(400).json({ message: 'Email không tồn tại trong hệ thống!' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không chính xác!' });
        }

        const token = jwt.sign(
            { id: user.id, ten_dang_nhap: user.ten_dang_nhap, vai_tro: user.vai_tro },
            process.env.JWT_SECRET || 'vibetok_secret_key_default',
            { expiresIn: '7d' }
        );

        //Trả về đầy đủ thông tin, bao gồm cả initials để hiển thị đúng
        const fullName = user.ten_hien_thi || '';
        const initials = fullName
            .trim()
            .split(/\s+/)
            .map(w => w[0]?.toUpperCase() ?? '')
            .slice(0, 2)
            .join('') || 'U';

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id:            String(user.id),
                ten_dang_nhap: user.ten_dang_nhap,
                username:      user.ten_dang_nhap,  
                ten_hien_thi:  user.ten_hien_thi,
                fullName:      user.ten_hien_thi,     
                email:         user.email,
                anh_dai_dien:  user.anh_dai_dien,
                vai_tro:       user.vai_tro,
                initials,                              
            }
        });

    } catch (error) {
        console.error('Lỗi API Đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập', error: error.message });
    }
};

// LẤY THÔNG TIN BẢN THÂN (GET ME)
export const getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, ten_dang_nhap, ten_hien_thi, email, anh_dai_dien, vai_tro, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        const u = users[0];
        const fullName = u.ten_hien_thi || '';
        const initials = fullName
            .trim()
            .split(/\s+/)
            .map(w => w[0]?.toUpperCase() ?? '')
            .slice(0, 2)
            .join('') || 'U';

        res.json({
            message: 'Chào mừng bạn trở lại!',
            user: {
                id:            String(u.id),
                ten_dang_nhap: u.ten_dang_nhap,
                username:      u.ten_dang_nhap,   
                ten_hien_thi:  u.ten_hien_thi,
                fullName:      u.ten_hien_thi,     
                email:         u.email,
                anh_dai_dien:  u.anh_dai_dien,
                vai_tro:       u.vai_tro,
                initials,
                createdAt:     u.created_at,
            }
        });

    } catch (error) {
        console.error('Lỗi API getMe:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ĐỔI MẬT KHẨU
export const changePassword = async (req, res) => {
    try {
        const { mat_khau_cu, mat_khau_moi } = req.body;
 
        if (!mat_khau_cu || !mat_khau_moi) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới!' });
        }
 
        if (mat_khau_moi.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 8 ký tự!' });
        }
 
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }
 
        const user = users[0];
        const isMatch = await bcrypt.compare(mat_khau_cu, user.mat_khau);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
        }
 
        if (mat_khau_cu === mat_khau_moi) {
            return res.status(400).json({ message: 'Mật khẩu mới phải khác mật khẩu hiện tại!' });
        }
 
        const salt = await bcrypt.genSalt(10);
        const hashedNew = await bcrypt.hash(mat_khau_moi, salt);
 
        await pool.query('UPDATE users SET mat_khau = ? WHERE id = ?', [hashedNew, req.user.id]);
 
        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Lỗi API changePassword:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// YÊU CẦU GỬI MÃ OTP QUÊN MẬT KHẨU
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Vui lòng nhập email!' });
        }

        // 1. Kiểm tra xem email có tồn tại trong bảng users không
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Email không tồn tại trong hệ thống!' });
        }

        // 2. Tạo mã OTP 6 số và tính toán thời gian hết hạn (10 phút)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60000); 

        // 3. Dọn dẹp: Xóa các mã OTP cũ của email này (nếu có) để tránh lỗi trùng lặp
        await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);

        // 4. Lưu OTP mới vào bảng password_resets
        await pool.query(
            'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)', 
            [email, otp, otpExpires]
        );

        // 5. Gửi email chứa mã OTP
        const mailOptions = {
            from: `"VibeTok" <${process.env.MAIL_USER}>`,
            to: email,
            subject: 'Mã OTP Đặt Lại Mật Khẩu - VibeTok',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>Đặt Lại Mật Khẩu VibeTok</h2>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP dưới đây:</p>
                    <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
                    <p>Mã này có hiệu lực trong vòng <strong>10 phút</strong>.</p>
                    <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này để bảo vệ tài khoản.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Mã OTP đã được gửi đến email của bạn!' });

    } catch (error) {
        console.error('Lỗi API forgotPassword:', error);
        res.status(500).json({ message: 'Lỗi server khi gửi email', error: error.message });
    }
};

// ĐẶT LẠI MẬT KHẨU VỚI OTP
export const resetPasswordWithOTP = async (req, res) => {
    try {
        const { email, otp, mat_khau_moi } = req.body;

        if (!email || !otp || !mat_khau_moi) {
            return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin (email, otp, mật khẩu mới)!' });
        }

        if (mat_khau_moi.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 8 ký tự!' });
        }

        // 1. Kiểm tra OTP trong bảng password_resets (phải đúng mã và chưa hết hạn)
        // Dùng NOW() của MySQL để so sánh thời gian hiện tại
        const [resetRequests] = await pool.query(
            'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW()', 
            [email, otp]
        );

        if (resetRequests.length === 0) {
            return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn!' });
        }

        // 2. Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedNew = await bcrypt.hash(mat_khau_moi, salt);

        // 3. Cập nhật mật khẩu mới vào bảng users
        await pool.query(
            'UPDATE users SET mat_khau = ? WHERE email = ?',
            [hashedNew, email]
        );

        // 4. Dọn dẹp: Xóa mã OTP đã sử dụng trong bảng password_resets
        await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);

        res.json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập.' });

    } catch (error) {
        console.error('Lỗi API resetPasswordWithOTP:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};