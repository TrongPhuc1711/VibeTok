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
        const currentUserRole = req.user?.vai_tro || null;
        if (user.vai_tro === 'admin' && currentUserRole !== 'admin') {
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
        const currentUserRole = req.user?.vai_tro || null;

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

        const currentUserRole = req.user?.vai_tro ?? null;
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
        if (target.vai_tro === 'admin' && req.user.vai_tro !== 'admin') {
            return res.status(403).json({ message: 'Không thể follow người dùng này' });
        }

        await FollowModel.follow(req.user.id, target.id);
        const updated = await UserModel.findById(target.id);
        res.json({ message: 'Đã follow', followers: updated.so_nguoi_theo_doi });
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
        res.json({ message: 'Đã unfollow', followers: updated.so_nguoi_theo_doi });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi unfollow', error: e.message });
    }
};

// PATCH /api/users/me
export const updateMyProfile = async (req, res) => {
    try {
        const { ten_hien_thi, tieu_su, vi_tri, so_dien_thoai } = req.body;

        const updates = {};
        if (ten_hien_thi !== undefined) updates.ten_hien_thi = ten_hien_thi;
        if (tieu_su !== undefined) updates.tieu_su = tieu_su;
        if (vi_tri !== undefined) updates.vi_tri = vi_tri;

        const updated = await UserModel.updateProfile(req.user.id, updates);

        if (req.file) {
            await UserModel.updateAvatar(req.user.id, req.file.path);
        }

        // Cập nhật số điện thoại nếu có gửi lên
        if (so_dien_thoai !== undefined) {
            // Chuẩn hóa số điện thoại sang E.164
            let phone = so_dien_thoai.replace(/[\s\-().]/g, '');
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
                username: normalized.username || normalized.ten_dang_nhap,
                fullName: normalized.fullName || normalized.ten_hien_thi,
            }
        });
    } catch (e) {
        // Lỗi UNIQUE constraint khi SĐT đã được dùng
        if (e.code === 'ER_DUP_ENTRY' && e.message?.includes('so_dien_thoai')) {
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
            `SELECT u.id, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien,
                    (SELECT 1 FROM follows f2 WHERE f2.ma_nguoi_theo_doi = u.id AND f2.ma_nguoi_duoc_theo_doi = ?) AS is_mutual
             FROM follows f
             JOIN users u ON f.ma_nguoi_duoc_theo_doi = u.id
             WHERE f.ma_nguoi_theo_doi = ?
               AND u.hoat_dong = 1
               AND u.vai_tro != 'admin'
               AND (u.ten_dang_nhap LIKE ? OR u.ten_hien_thi LIKE ?)
             ORDER BY is_mutual DESC, u.ten_dang_nhap ASC
             LIMIT ?`,
            [currentUserId, currentUserId, like, like, limit]
        );

        const formatUser = (u) => ({
            id: String(u.id),
            username: u.ten_dang_nhap,
            fullName: u.ten_hien_thi || '',
            anh_dai_dien: u.anh_dai_dien || null,
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