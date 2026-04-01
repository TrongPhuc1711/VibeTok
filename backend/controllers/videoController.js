import { VideoModel } from '../models/videoModel.js';
import { CommentModel } from '../models/commentModel.js';
import { LikeModel } from '../models/follow/followLikeModel.js';
import { HashtagModel } from '../models/contentModel.js';
import { UserModel } from '../models/userModel.js';
import { triggerNotification } from './notificationController.js';
// GET /api/videos/feed
export const getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const data = await VideoModel.getFeed({ page, limit });
        res.json(data);
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tải feed', error: e.message });
    }
};

// GET /api/videos/search
export const searchVideos = async (req, res) => {
    try {
        const { q = '', page = 1, limit = 10 } = req.query;
        const videos = await VideoModel.search({ q, page: Number(page), limit: Number(limit) });
        res.json({ videos });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tìm kiếm', error: e.message });
    }
};

// GET /api/videos/:id
export const getVideoById = async (req, res) => {
    try {
        const video = await VideoModel.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video không tồn tại' });
        // Tăng lượt xem (async, không chặn response)
        VideoModel.incrementViews(req.params.id).catch(() => { });
        res.json({ video });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy video', error: e.message });
    }
};

// GET /api/videos/user/:userId
export const getVideosByUser = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const videos = await VideoModel.getByUserId(req.params.userId, { page, limit });
        res.json({ videos });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy video user', error: e.message });
    }
};

// POST /api/videos/upload (cần verifyToken + uploadVideo middleware)
export const uploadVideo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file video' });

        const { caption = '', privacy = 'public', allowDuet, allowStitch, location = '', musicId, isDraft } = req.body;

        const videoId = await VideoModel.create({
            userId: req.user.id,
            musicId: musicId || null,
            caption,
            videoUrl: req.file.path,     // Cloudinary URL
            thumbnail: req.file.path
                .replace('/upload/', '/upload/c_fill,w_300,h_400,g_auto/')
                .replace(/\.[^.]+$/, '.jpg'),
            duration: req.file.duration || 0,
            privacy,
            allowDuet: allowDuet !== 'false',
            allowStitch: allowStitch !== 'false',
            location,
            isDraft: isDraft === 'true',
        });

        // Xử lý hashtags từ caption
        const tags = (caption.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g) || []);
        if (tags.length) await HashtagModel.attachToVideo(videoId, tags);

        // Tăng tổng video của user
        await UserModel.incrementVideoCount(req.user.id);

        const video = await VideoModel.findById(videoId);
        res.status(201).json({ message: 'Đăng video thành công!', video });
    } catch (e) {
        console.error('Lỗi upload video:', e);
        res.status(500).json({ message: 'Lỗi đăng video', error: e.message });
    }
};

// GET /api/videos/:id/comments
export const getComments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const comments = await CommentModel.getByVideoId(req.params.id, { page, limit });
        res.json({ comments });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy bình luận', error: e.message });
    }
};

// POST /api/videos/:id/comments (cần verifyToken)
export const postComment = async (req, res) => {
    try {
        const { content, parentId } = req.body;
        if (!content?.trim()) return res.status(400).json({ message: 'Nội dung không được trống' });

        const comment = await CommentModel.create({
            videoId: req.params.id,
            userId: req.user.id,
            content: content.trim(),
            parentId: parentId || null,
        });
        await VideoModel.updateCommentCount(req.params.id, 1);

        // Bắn thông báo
        const video = await VideoModel.findById(req.params.id);
        if (video && video.userId !== String(req.user.id)) {
            await triggerNotification(video.userId, req.user, 'comment', video.id, comment.id);
        }

        res.status(201).json({ message: 'Bình luận thành công!', comment });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi đăng bình luận', error: e.message });
    }
};

// POST /api/videos/:id/like (cần verifyToken)
export const likeVideo = async (req, res) => {
    try {
        const liked = await LikeModel.like(req.user.id, req.params.id);
        
        if (liked) {
            const video = await VideoModel.findById(req.params.id);
            if (video && video.userId !== String(req.user.id)) {
                await triggerNotification(video.userId, req.user, 'like', video.id);
            }
        }
        res.json({ message: liked ? 'Đã thích' : 'Đã thích rồi', liked: true });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi like video', error: e.message });
    }
};

// DELETE /api/videos/:id/like (cần verifyToken)
export const unlikeVideo = async (req, res) => {
    try {
        await LikeModel.unlike(req.user.id, req.params.id);
        res.json({ message: 'Đã bỏ thích', liked: false });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi unlike video', error: e.message });
    }
};

// DELETE /api/videos/:id (cần verifyToken)
export const deleteVideo = async (req, res) => {
    try {
        const ok = await VideoModel.softDelete(req.params.id, req.user.id);
        if (!ok) return res.status(403).json({ message: 'Không thể xóa video này' });
        await UserModel.incrementVideoCount(req.user.id, -1);
        res.json({ message: 'Đã xóa video' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi xóa video', error: e.message });
    }
};