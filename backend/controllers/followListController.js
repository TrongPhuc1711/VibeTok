import { FollowListService } from "../services/followListService";

// GET /api/users/:username/followers
export const getFollowers = async (req, res) => {
    try {
        const { username } = req.params;
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await FollowListService.getFollowers(username, {
            page,
            limit,
            currentUserId: req.user?.id ?? null,
        });

        if (!result) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json(result);
    } catch (e) {
        console.error('Lỗi getFollowers:', e);
        res.status(500).json({ message: 'Lỗi lấy danh sách follower', error: e.message });
    }
};

// GET /api/users/:username/following
export const getFollowing = async (req, res) => {
    try {
        const { username } = req.params;
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await FollowListService.getFollowing(username, {
            page,
            limit,
            currentUserId: req.user?.id ?? null,
        });

        if (!result) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json(result);
    } catch (e) {
        console.error('Lỗi getFollowing:', e);
        res.status(500).json({ message: 'Lỗi lấy danh sách following', error: e.message });
    }
};