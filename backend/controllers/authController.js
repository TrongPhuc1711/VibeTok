import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set in environment! Using default (UNSAFE FOR PRODUCTION)');
}
const getJwtSecret = () => JWT_SECRET || 'vibetok_secret_key_default';

// Simple in-memory rate limiter for OTP requests
const otpRateLimit = new Map(); // email -> { count, resetAt }
const OTP_MAX_PER_HOUR = 3;

const checkOtpRateLimit = (email) => {
    const now = Date.now();
    const entry = otpRateLimit.get(email);
    if (!entry || entry.resetAt < now) {
        otpRateLimit.set(email, { count: 1, resetAt: now + 3600_000 });
        return true;
    }
    if (entry.count >= OTP_MAX_PER_HOUR) return false;
    entry.count++;
    return true;
};

// Helper: build initials from display name
const buildInitials = (name = '') =>
    name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';

// ĐĂNG KÝ
export const register = async (req, res) => {
    try {
        const { ten_dang_nhap, email, mat_khau, ten_hien_thi } = req.body;

        if (!email || !mat_khau || !ten_hien_thi || !ten_dang_nhap) {
            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ thông tin!'
            });
        }

        // Basic validation
        if (mat_khau.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu tối thiểu 8 ký tự!' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Email không hợp lệ!' });
        }
        if (!/^[a-zA-Z0-9_.]{3,30}$/.test(ten_dang_nhap)) {
            return res.status(400).json({ message: 'Tên đăng nhập 3-30 ký tự, chỉ dùng a-z, 0-9, _ .' });
        }

        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ? OR ten_dang_nhap = ?',
            [email.toLowerCase(), ten_dang_nhap]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email hoặc Tên đăng nhập đã được sử dụng!' });
        }

        const salt = await bcrypt.genSalt(12); // 12 rounds for better security
        const hashedPassword = await bcrypt.hash(mat_khau, salt);

        const [result] = await pool.query(
            'INSERT INTO users (ten_dang_nhap, email, mat_khau, ten_hien_thi) VALUES (?, ?, ?, ?)',
            [ten_dang_nhap, email.toLowerCase(), hashedPassword, ten_hien_thi]
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

        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND hoat_dong = 1',
            [email.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }

        const token = jwt.sign(
            { id: user.id, ten_dang_nhap: user.ten_dang_nhap, vai_tro: user.vai_tro },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        const fullName = user.ten_hien_thi || '';
        const initials = buildInitials(fullName);

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

// LẤY THÔNG TIN BẢN THÂN
export const getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, ten_dang_nhap, ten_hien_thi, email, anh_dai_dien, vai_tro, created_at FROM users WHERE id = ? AND hoat_dong = 1',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        const u = users[0];
        const fullName = u.ten_hien_thi || '';

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
                initials:      buildInitials(fullName),
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

        const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND hoat_dong = 1', [req.user.id]);
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

        const salt = await bcrypt.genSalt(12);
        const hashedNew = await bcrypt.hash(mat_khau_moi, salt);

        await pool.query('UPDATE users SET mat_khau = ? WHERE id = ?', [hashedNew, req.user.id]);

        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Lỗi API changePassword:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// YÊU CẦU GỬI MÃ OTP
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Vui lòng nhập email!' });

        const normalizedEmail = email.toLowerCase().trim();

        // Rate limit: max 3 OTP requests per hour per email
        if (!checkOtpRateLimit(normalizedEmail)) {
            return res.status(429).json({
                message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 giờ.'
            });
        }

        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND hoat_dong = 1',
            [normalizedEmail]
        );

        // Always return success to prevent email enumeration
        if (users.length === 0) {
            return res.json({ message: 'Nếu email tồn tại, mã OTP sẽ được gửi đến!' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60000);

        try {
            const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': process.env.BREVO_API_KEY
                },
                body: JSON.stringify({
                    sender: {
                        name: 'VibeTok Support',
                        email: process.env.BREVO_SENDER_EMAIL
                    },
                    to: [{ email: normalizedEmail }],
                    subject: 'Mã OTP Đặt Lại Mật Khẩu - VibeTok',
                    htmlContent: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto;">
                            <h2 style="color: #ff2d78;">Đặt Lại Mật Khẩu - VibeTok</h2>
                            <p>Mã OTP của bạn:</p>
                            <h1 style="color: #ff2d78; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
                            <p>Mã có hiệu lực trong <strong>10 phút</strong>.</p>
                            <p style="color: #666; font-size: 12px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
                        </div>
                    `
                })
            });

            if (!brevoResponse.ok) {
                const errorData = await brevoResponse.json();
                console.error('❌ Brevo error:', errorData);
                throw new Error('Gửi mail thất bại từ phía Brevo');
            }

            // Save OTP only after successful email send
            await pool.query('DELETE FROM password_resets WHERE email = ?', [normalizedEmail]);
            await pool.query(
                'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)',
                [normalizedEmail, otp, otpExpires]
            );

            res.json({ message: 'Mã OTP đã được gửi đến email của bạn!' });
        } catch (emailError) {
            console.error('❌ Lỗi gửi email:', emailError.message);
            return res.status(500).json({ message: 'Không thể gửi email. Vui lòng thử lại sau.' });
        }

    } catch (error) {
        console.error('❌ Lỗi API forgotPassword:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ĐẶT LẠI MẬT KHẨU VỚI OTP
export const resetPasswordWithOTP = async (req, res) => {
    try {
        const { email, otp, mat_khau_moi } = req.body;

        if (!email || !otp || !mat_khau_moi) {
            return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin!' });
        }

        if (mat_khau_moi.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 8 ký tự!' });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'Mã OTP không hợp lệ!' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const [resetRequests] = await pool.query(
            'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW()',
            [normalizedEmail, otp]
        );

        if (resetRequests.length === 0) {
            return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn!' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedNew = await bcrypt.hash(mat_khau_moi, salt);

        await pool.query(
            'UPDATE users SET mat_khau = ? WHERE email = ? AND hoat_dong = 1',
            [hashedNew, normalizedEmail]
        );

        // Clean up used OTP
        await pool.query('DELETE FROM password_resets WHERE email = ?', [normalizedEmail]);

        // Clean up rate limit entry
        otpRateLimit.delete(normalizedEmail);

        res.json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập.' });

    } catch (error) {
        console.error('Lỗi API resetPasswordWithOTP:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};