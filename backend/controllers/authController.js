import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sendOTPEmail } from '../utils/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set in environment! Using default (UNSAFE FOR PRODUCTION)');
}
const getJwtSecret = () => JWT_SECRET || 'vibetok_secret_key_default';

// Simple in-memory rate limiter for OTP requests
const otpRateLimit = new Map(); // email -> { count, resetAt }
const OTP_MAX_PER_HOUR = 10;

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
        const email = req.body.email;
        const password = req.body.password || req.body.mat_khau;
        const display_name = req.body.display_name || req.body.ten_hien_thi;
        const username = req.body.username || req.body.ten_dang_nhap;

        if (!email || !password || !display_name || !username) {
            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ thông tin!'
            });
        }

        // Basic validation
        if (password.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu tối thiểu 8 ký tự!' });
        }
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/.test(email)) {
            return res.status(400).json({ message: 'Email không hợp lệ!' });
        }
        if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username)) {
            return res.status(400).json({ message: 'Tên đăng nhập 3-30 ký tự, chỉ dùng a-z, 0-9, _ .' });
        }

        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email.toLowerCase(), username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email hoặc Tên đăng nhập đã được sử dụng!' });
        }

        const salt = await bcrypt.genSalt(12); // 12 rounds for better security
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)',
            [username, email.toLowerCase(), hashedPassword, display_name]
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
        const email = req.body.email;
        const password = req.body.password || req.body.mat_khau;

        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu!' });
        }

        // Tìm user không cần check is_active để phân biệt banned vs sai thông tin
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }

        const user = users[0];

        // User đăng nhập qua Google không có mật khẩu
        if (!user.password) {
            return res.status(400).json({ message: 'Tài khoản này sử dụng đăng nhập mạng xã hội (Google/Facebook). Vui lòng đăng nhập bằng Google hoặc Facebook!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }

        // Kiểm tra tài khoản bị ban SAU KHI xác thực mật khẩu đúng
        if (!user.is_active) {
            return res.status(403).json({
                message: 'Tài khoản của bạn đã bị vô hiệu hóa vĩnh viễn. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
                banned: true,
                permanentBan: true
            });
        }

        // Kiểm tra vô hiệu hóa tạm thời (temp ban)
        if (user.banned_until) {
            const bannedUntil = new Date(user.banned_until);
            if (bannedUntil > new Date()) {
                const remainMs = bannedUntil.getTime() - Date.now();
                const totalMins = Math.ceil(remainMs / 60000);
                const days = Math.floor(totalMins / (24 * 60));
                const hours = Math.floor((totalMins % (24 * 60)) / 60);
                const mins = totalMins % 60;

                const parts = [];
                if (days > 0) parts.push(`${days} ngày`);
                if (hours > 0) parts.push(`${hours} giờ`);
                if (mins > 0 || parts.length === 0) parts.push(`${mins || 1} phút`);
                const remainLabel = parts.join(' ');

                return res.status(403).json({
                    message: `Tài khoản của bạn đã bị vô hiệu hóa tạm thời. Còn lại: ${remainLabel}.${user.ban_reason ? ` Lý do: ${user.ban_reason}` : ''}`,
                    banned: true,
                    tempBan: true,
                    bannedUntil: user.banned_until,
                });
            } else {
                // Hết hạn → tự động mở khóa
                await pool.query(
                    'UPDATE users SET banned_until = NULL, ban_reason = NULL WHERE id = ?',
                    [user.id]
                );
            }
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        const fullName = user.display_name || '';
        const initials = buildInitials(fullName);

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id:            String(user.id),
                username:      user.username,
                fullName:      user.display_name,
                email:         user.email,
                anh_dai_dien:  user.avatar_url,
                vai_tro:       user.role,
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
            'SELECT id, username, display_name, email, avatar_url, role, created_at FROM users WHERE id = ? AND is_active = 1',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        const u = users[0];
        const fullName = u.display_name || '';

        res.json({
            message: 'Chào mừng bạn trở lại!',
            user: {
                id:            String(u.id),
                username:      u.username,
                fullName:      u.display_name,
                email:         u.email,
                anh_dai_dien:  u.avatar_url,
                vai_tro:       u.role,
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
        const current_password = req.body.current_password || req.body.mat_khau_cu;
        const new_password = req.body.new_password || req.body.mat_khau_moi;

        if (!current_password || !new_password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới!' });
        }

        if (new_password.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 8 ký tự!' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND is_active = 1', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        const user = users[0];

        // User Google không có mật khẩu -> không cần đổi
        if (!user.password) {
            return res.status(400).json({ message: 'Tài khoản của bạn sử dụng đăng nhập mạng xã hội (Google/Facebook), không cần mật khẩu.' });
        }

        const isMatch = await bcrypt.compare(current_password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
        }

        if (current_password === new_password) {
            return res.status(400).json({ message: 'Mật khẩu mới phải khác mật khẩu hiện tại!' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedNew = await bcrypt.hash(new_password, salt);

        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNew, req.user.id]);

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

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/.test(email)) {
            return res.status(400).json({ message: 'Email không đúng định dạng!' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Rate limit: max 10 OTP requests per hour per email
        if (!checkOtpRateLimit(normalizedEmail)) {
            return res.status(429).json({
                message: 'Quá nhiều yêu cầu gửi mã OTP. Vui lòng thử lại sau 1 giờ.'
            });
        }

        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Email này chưa được đăng ký tài khoản trong hệ thống!' });
        }

        const user = users[0];
        if (!user.password) {
            return res.status(400).json({ message: 'Tài khoản này đăng nhập bằng mạng xã hội (Google/Facebook), không có mật khẩu để đặt lại!' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60000);

        try {
            await sendOTPEmail(normalizedEmail, otp);

            // Save OTP only after successful email send
            await pool.query('DELETE FROM password_resets WHERE email = ?', [normalizedEmail]);
            await pool.query(
                'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)',
                [normalizedEmail, otp, otpExpires]
            );

            res.json({ message: 'Mã OTP đã được gửi đến email của bạn!' });
        } catch (emailError) {
            console.error('❌ Lỗi gửi email:', emailError.message);
            return res.status(500).json({ message: `Không thể gửi email: ${emailError.message || 'Vui lòng thử lại sau.'}` });
        }

    } catch (error) {
        console.error('❌ Lỗi API forgotPassword:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ĐẶT LẠI MẬT KHẨU VỚI OTP
export const resetPasswordWithOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const new_password = req.body.new_password || req.body.mat_khau_moi;

        if (!email || !otp || !new_password) {
            return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin!' });
        }

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/.test(email)) {
            return res.status(400).json({ message: 'Email không đúng định dạng!' });
        }

        if (new_password.length < 8) {
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
        const hashedNew = await bcrypt.hash(new_password, salt);

        await pool.query(
            'UPDATE users SET password = ? WHERE email = ? AND is_active = 1',
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