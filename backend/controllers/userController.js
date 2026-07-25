import { UserModel, normalizeUser } from '../models/userModel.js';
import { FollowModel } from '../models/follow/followLikeModel.js';
import pool from '../config/db.js';
import axios from 'axios';

// GET /api/users/:username
export const getUserProfile = async (req, res) => {
    try {
        const user = await UserModel.findByUsername(req.params.username);
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

        // Ẩn profile admin khỏi user thường và khách chưa đăng nhập
        const currentUserRole = req.user?.role || null;
        if (user.role === 'admin' && currentUserRole !== 'admin') {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        let isFollowing = false;
        if (req.user) {
            isFollowing = await FollowModel.isFollowing(req.user.id, user.id);
        }

        res.json({ user: { ...normalizeUser(user), isFollowing } });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy thông tin người dùng', error: e.message });
    }
};

// GET /api/users/suggestions
export const getSuggestions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const currentId = req.user?.id || 0;
        const currentUserRole = req.user?.role || null;

        // Truyền role để lọc admin nếu cần
        const users = await UserModel.getSuggestions(currentId, limit, currentUserRole);

        // Lấy danh sách id mà currentUser đang follow (nếu đã đăng nhập)
        let followingSet = new Set();
        if (currentId) {
            const rows = await FollowModel.getFollowingIds(currentId);
            followingSet = new Set(rows);
        }

        const result = users.map(u => ({
            ...normalizeUser(u),
            isFollowing: followingSet.has(u.id),
        }));

        res.json({ users: result });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi gợi ý người dùng', error: e.message });
    }
};

// GET /api/users/search?q=&limit=10
export const searchUsers = async (req, res) => {
    try {
        const { q = '', limit = 10 } = req.query;
        if (!q.trim()) return res.json({ users: [] });

        const currentUserRole = req.user?.role ?? null;
        const rows = await UserModel.search(
            q.trim(),
            Math.min(50, parseInt(limit) || 10),
            currentUserRole
        );
        const users = rows.map(u => normalizeUser(u));
        res.json({ users });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tìm kiếm người dùng', error: e.message });
    }
};

// POST /api/users/:username/follow
export const followUser = async (req, res) => {
    try {
        const target = await UserModel.findByUsername(req.params.username);
        if (!target) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        if (target.id === req.user.id) return res.status(400).json({ message: 'Không thể follow chính mình' });

        // Không cho phép follow admin (nếu người dùng hiện tại không phải admin)
        if (target.role === 'admin' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không thể follow người dùng này' });
        }

        await FollowModel.follow(req.user.id, target.id);
        const updated = await UserModel.findById(target.id);
        res.json({ message: 'Đã follow', followers: updated.followers });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi follow', error: e.message });
    }
};

// DELETE /api/users/:username/follow
export const unfollowUser = async (req, res) => {
    try {
        const target = await UserModel.findByUsername(req.params.username);
        if (!target) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        await FollowModel.unfollow(req.user.id, target.id);
        const updated = await UserModel.findById(target.id);
        res.json({ message: 'Đã unfollow', followers: updated.followers });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi unfollow', error: e.message });
    }
};

// PATCH /api/users/me
export const updateMyProfile = async (req, res) => {
    try {
        const { display_name, bio, location, phone_number } = req.body;

        const updates = {};
        if (display_name !== undefined) updates.display_name = display_name;
        if (bio !== undefined) updates.bio = bio;
        if (location !== undefined) updates.location = location;

        const updated = await UserModel.updateProfile(req.user.id, updates);

        if (req.file) {
            await UserModel.updateAvatar(req.user.id, req.file.path);
        }

        // Cập nhật số điện thoại nếu có gửi lên
        if (phone_number !== undefined) {
            // Chuẩn hóa số điện thoại sang E.164
            let phone = phone_number.replace(/[\s\-().]/g, '');
            if (phone && phone.startsWith('0')) {
                phone = '+84' + phone.substring(1);
            } else if (phone && !phone.startsWith('+')) {
                phone = '+' + phone;
            }
            await UserModel.updatePhone(req.user.id, phone || null);
        }

        const normalized = normalizeUser(updated);

        res.json({
            message: 'Cập nhật thành công',
            user: {
                ...normalized,
                username: normalized.username,
                fullName: normalized.fullName,
            }
        });
    } catch (e) {
        // Lỗi UNIQUE constraint khi SĐT đã được dùng
        if (e.code === 'ER_DUP_ENTRY' && e.message?.includes('phone_number')) {
            return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác' });
        }
        res.status(500).json({ message: 'Lỗi cập nhật profile', error: e.message });
    }
};

// POST /api/users/sync-google-contacts — Đồng bộ danh bạ Google để gợi ý bạn bè
export const syncGoogleContacts = async (req, res) => {
    try {
        const { access_token } = req.body;
        const currentUserId = req.user.id;

        if (!access_token) {
            return res.status(400).json({ message: 'Thiếu Google access_token' });
        }

        // Gọi Google People API để lấy danh bạ
        let connections = [];
        let nextPageToken = null;

        // Phân trang: lấy tối đa 1000 contacts
        do {
            const params = {
                personFields: 'names,phoneNumbers,emailAddresses',
                pageSize: 1000,
            };
            if (nextPageToken) params.pageToken = nextPageToken;

            const googleRes = await axios.get(
                'https://people.googleapis.com/v1/people/me/connections',
                {
                    headers: { Authorization: `Bearer ${access_token}` },
                    params,
                }
            );

            if (googleRes.data.connections) {
                connections = connections.concat(googleRes.data.connections);
            }
            nextPageToken = googleRes.data.nextPageToken || null;
        } while (nextPageToken && connections.length < 2000);

        // Trích xuất số điện thoại và email từ danh bạ
        const phoneNumbers = new Set();
        const emails = new Set();

        connections.forEach(person => {
            // Số điện thoại (ưu tiên canonicalForm đã chuẩn hóa E.164)
            if (person.phoneNumbers) {
                person.phoneNumbers.forEach(phone => {
                    const formatted = phone.canonicalForm || phone.value;
                    if (formatted) {
                        // Chuẩn hóa thêm nếu cần
                        let p = formatted.replace(/[\s\-().]/g, '');
                        if (p.startsWith('0')) {
                            p = '+84' + p.substring(1);
                        } else if (!p.startsWith('+') && p.length > 0) {
                            p = '+' + p;
                        }
                        if (p.length >= 8) phoneNumbers.add(p);
                    }
                });
            }
            // Email
            if (person.emailAddresses) {
                person.emailAddresses.forEach(email => {
                    if (email.value) {
                        emails.add(email.value.toLowerCase());
                    }
                });
            }
        });

        // Đối khớp với database
        const phoneList = Array.from(phoneNumbers);
        const emailList = Array.from(emails);

        const [phoneMatches, emailMatches] = await Promise.all([
            UserModel.findByPhoneNumbers(currentUserId, phoneList),
            UserModel.findByEmails(currentUserId, emailList),
        ]);

        // Gộp kết quả và loại bỏ trùng lặp
        const seenIds = new Set();
        const result = [];

        // Ưu tiên kết quả theo SĐT (chính xác hơn)
        phoneMatches.forEach(u => {
            if (!seenIds.has(u.id)) {
                seenIds.add(u.id);
                result.push({
                    ...normalizeUser(u),
                    isFollowing: false,
                    matchedBy: 'phone',
                });
            }
        });

        emailMatches.forEach(u => {
            if (!seenIds.has(u.id)) {
                seenIds.add(u.id);
                result.push({
                    ...normalizeUser(u),
                    isFollowing: false,
                    matchedBy: 'email',
                });
            }
        });

        res.json({
            users: result,
            stats: {
                totalContacts: connections.length,
                phonesFound: phoneList.length,
                emailsFound: emailList.length,
                matchedUsers: result.length,
            },
        });

    } catch (error) {
        console.error('syncGoogleContacts error:', error);

        // Phân biệt lỗi từ Google API vs lỗi hệ thống
        if (error.response?.status === 401) {
            return res.status(401).json({ message: 'Token Google đã hết hạn. Vui lòng thử lại.' });
        }
        if (error.response?.status === 403) {
            return res.status(403).json({ message: 'Chưa cấp quyền đọc danh bạ Google. Vui lòng cho phép quyền truy cập.' });
        }

        res.status(500).json({ message: 'Không thể đồng bộ danh bạ Google', error: error.message });
    }
};

// GET /api/users/mention-search?q= — Tìm user để @mention (chỉ hiển thị người đang follow / bạn bè)
export const searchMentionUsers = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const limit = Math.min(20, parseInt(req.query.limit) || 10);
        const currentUserId = req.user.id;

        const like = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;

        // Tìm trong danh sách đang follow trước, check xem có mutual không (Bạn bè)
        const [followingRows] = await pool.query(
            `SELECT u.id, u.username, u.display_name, u.avatar_url,
                    (SELECT 1 FROM follows f2 WHERE f2.follower_id = u.id AND f2.following_id = ?) AS is_mutual
             FROM follows f
             JOIN users u ON f.following_id = u.id
             WHERE f.follower_id = ?
               AND u.is_active = 1
               AND u.role != 'admin'
               AND (u.username LIKE ? OR u.display_name LIKE ?)
             ORDER BY is_mutual DESC, u.username ASC
             LIMIT ?`,
            [currentUserId, currentUserId, like, like, limit]
        );

        const formatUser = (u) => ({
            id: String(u.id),
            username: u.username,
            fullName: u.display_name || '',
            anh_dai_dien: u.avatar_url || null,
            isFollowing: true,
            isMutual: Boolean(u.is_mutual)
        });

        const users = followingRows.map(formatUser);

        res.json({ users });
    } catch (e) {
        console.error('searchMentionUsers error:', e);
        res.status(500).json({ message: 'Lỗi tìm kiếm người dùng', error: e.message });
    }
};

// PATCH /api/users/me/phone
export const updateUserPhone = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ message: 'Số điện thoại không được để trống' });
        }

        // Chuẩn hóa số điện thoại: Loại bỏ khoảng trắng, dấu cộng, hoặc chuyển đổi định dạng
        const cleanPhone = phone.trim().replace(/[\s\-\(\)\+]/g, '');

        // Kiểm tra xem số điện thoại đã được đăng ký bởi user khác chưa
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE phone_number = ? AND id != ? AND is_active = 1',
            [cleanPhone, req.user.id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Số điện thoại này đã được liên kết với một tài khoản khác' });
        }

        const updated = await UserModel.updatePhone(req.user.id, cleanPhone);
        res.json({
            message: 'Xác thực và cập nhật số điện thoại thành công',
            user: normalizeUser(updated)
        });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi cập nhật số điện thoại', error: e.message });
    }
};

// POST /api/users/me/sync-contacts
export const syncContacts = async (req, res) => {
    try {
        const { contacts = [] } = req.body; // Mảng các số điện thoại từ danh bạ
        if (!Array.isArray(contacts) || contacts.length === 0) {
            return res.json({ users: [] });
        }

        // Chuẩn hóa danh sách số điện thoại nhận từ client sang định dạng +84... hoặc +...
        const cleanPhones = contacts.map(p => {
            let phone = p.trim().replace(/[\s\-().]/g, '');
            if (phone && phone.startsWith('0')) {
                phone = '+84' + phone.substring(1);
            } else if (phone && !phone.startsWith('+')) {
                phone = '+' + phone;
            }
            return phone;
        }).filter(Boolean);

        if (cleanPhones.length === 0) return res.json({ users: [] });

        // Tìm các user khớp số điện thoại
        const matchedUsers = await UserModel.findUsersByPhones(cleanPhones, req.user.id);

        // Lấy danh sách id mà user hiện tại đang follow để kiểm tra xem đã follow chưa
        const followingIds = await FollowModel.getFollowingIds(req.user.id);
        const followingSet = new Set(followingIds);

        const result = matchedUsers.map(u => ({
            ...normalizeUser(u),
            isFollowing: followingSet.has(u.id)
        }));

        res.json({ users: result });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi đồng bộ danh bạ', error: e.message });
    }
};
