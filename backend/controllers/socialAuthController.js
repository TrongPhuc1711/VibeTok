import axios from 'axios';
import jwt from 'jsonwebtoken';
import { socialAuthModel } from '../models/socialAuthModel.js';
import { UserModel, normalizeUser } from '../models/userModel.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'vibetok_secret_key_default';

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
            userId = linkedAccount.ma_nguoi_dung;
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

        // 3. Lấy thông tin user cuối cùng
        const userRow = await UserModel.findById(userId);
        if (!userRow) {
            return res.status(404).json({ message: 'User not found after link/create' });
        }

        // 4. Tạo JWT và gửi về client như login thông thường
        const token = jwt.sign(
            { id: userRow.id, ten_dang_nhap: userRow.ten_dang_nhap, vai_tro: userRow.vai_tro },
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
