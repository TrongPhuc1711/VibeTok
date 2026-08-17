import axios from 'axios';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { socialAuthModel } from '../models/socialAuthModel.js';
import { normalizeUser } from '../models/userModel.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'vibetok_secret_key_default';

// Helper kiểm tra trạng thái khóa của tài khoản
const checkBanStatus = async (user, res) => {
    // 1. Kiểm tra ban vĩnh viễn (is_active = 0)
    if (!user.is_active) {
        res.status(403).json({
            message: 'Tài khoản của bạn đã bị vô hiệu hóa vĩnh viễn. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
            banned: true,
            permanentBan: true
        });
        return false;
    }

    // 2. Kiểm tra vô hiệu hóa tạm thời (temp ban)
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

            res.status(403).json({
                message: `Tài khoản của bạn đã bị vô hiệu hóa tạm thời. Còn lại: ${remainLabel}.${user.ban_reason ? ` Lý do: ${user.ban_reason}` : ''}`,
                banned: true,
                tempBan: true,
                bannedUntil: user.banned_until,
            });
            return false;
        } else {
            // Hết hạn → tự động mở khóa
            await pool.query(
                'UPDATE users SET banned_until = NULL, ban_reason = NULL WHERE id = ?',
                [user.id]
            );
        }
    }

    return true;
};

export const googleLogin = async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) {
            return res.status(400).json({ message: 'Missing access_token string' });
        }

        // 1. Lấy thông tin user từ Google API bằng access_token
        const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        
        const { sub, email, name, picture } = googleResponse.data; // sub là UID của Google

        // 2. Tìm liên kết
        let linkedAccount = await socialAuthModel.findByProvider('google', sub);
        let userId;

        if (linkedAccount) {
            // Đã liên kết trước đó
            userId = linkedAccount.user_id;
        } else {
            // Chưa liên kết, tìm user theo email
            const existingUser = await socialAuthModel.findByEmail(email);

            if (existingUser) {
                // Email đã có -> Liên kết
                userId = existingUser.id;
                await socialAuthModel.linkProvider(userId, 'google', sub);
            } else {
                // Email chưa có -> Tạo tài khoản mới hoàn toàn
                userId = await socialAuthModel.createUser({ email, name, picture });
                await socialAuthModel.linkProvider(userId, 'google', sub);
            }
        }

        // 3. Lấy thông tin user (kể cả khi is_active = 0 để kiểm tra ban)
        const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const userRow = userRows[0];
        if (!userRow) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản người dùng!' });
        }

        // 4. Kiểm tra tài khoản có bị khóa / tạm khóa không
        const isAllowed = await checkBanStatus(userRow, res);
        if (!isAllowed) return;

        // 5. Tạo JWT và gửi về client như login thông thường
        const token = jwt.sign(
            { id: userRow.id, username: userRow.username, role: userRow.role },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Đăng nhập Google thành công!',
            token,
            user: normalizeUser(userRow),
        });

    } catch (error) {
        console.error('Lỗi Google Login:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập Google', error: error.message });
    }
};

export const facebookLogin = async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) {
            return res.status(400).json({ message: 'Missing access_token' });
        }

        // 1. Lấy thông tin user từ Facebook Graph API
        const fbResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                fields: 'id,name,email,picture.type(large)',
                access_token,
            }
        });

        const { id: fbId, email, name, picture } = fbResponse.data;
        const pictureUrl = picture?.data?.url || null;

        // Facebook có thể không trả email nếu user không cấp quyền
        if (!email) {
            return res.status(400).json({
                message: 'Không thể lấy email từ Facebook. Vui lòng cấp quyền truy cập email khi đăng nhập.'
            });
        }

        // 2. Tìm liên kết
        let linkedAccount = await socialAuthModel.findByProvider('facebook', fbId);
        let userId;

        if (linkedAccount) {
            // Đã liên kết trước đó
            userId = linkedAccount.user_id;
        } else {
            // Chưa liên kết, tìm user theo email
            const existingUser = await socialAuthModel.findByEmail(email);

            if (existingUser) {
                // Email đã có -> Liên kết
                userId = existingUser.id;
                await socialAuthModel.linkProvider(userId, 'facebook', fbId);
            } else {
                // Email chưa có -> Tạo tài khoản mới hoàn toàn
                userId = await socialAuthModel.createUser({ email, name, picture: pictureUrl });
                await socialAuthModel.linkProvider(userId, 'facebook', fbId);
            }
        }

        // 3. Lấy thông tin user (kể cả khi is_active = 0 để kiểm tra ban)
        const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const userRow = userRows[0];
        if (!userRow) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản người dùng!' });
        }

        // 4. Kiểm tra tài khoản có bị khóa / tạm khóa không
        const isAllowed = await checkBanStatus(userRow, res);
        if (!isAllowed) return;

        // 5. Tạo JWT và gửi về client
        const token = jwt.sign(
            { id: userRow.id, username: userRow.username, role: userRow.role },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Đăng nhập Facebook thành công!',
            token,
            user: normalizeUser(userRow),
        });

    } catch (error) {
        console.error('Lỗi Facebook Login:', error);
        // Trả lỗi rõ ràng nếu token Facebook hết hạn hoặc không hợp lệ
        if (error.response?.status === 400 || error.response?.data?.error) {
            return res.status(401).json({
                message: 'Token Facebook không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
            });
        }
        res.status(500).json({ message: 'Lỗi server khi đăng nhập Facebook', error: error.message });
    }
};
