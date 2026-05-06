import { VideoModel } from '../models/videoModel.js';
import { CommentModel } from '../models/commentModel.js';
import { LikeModel } from '../models/follow/followLikeModel.js';
import { HashtagModel } from '../models/contentModel.js';
import { UserModel, normalizeUser } from '../models/userModel.js';
import { triggerNotification } from './notificationController.js';

// GET /api/videos/feed
export const getFeed = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const currentUserId = req.user?.id ?? null;
        const type = ['forYou', 'following'].includes(req.query.type) ? req.query.type : 'forYou';

        // "following" feed requires auth
        if (type === 'following' && !currentUserId) {
            return res.json({ videos: [], hasMore: false, total: 0 });
        }

        const data = await VideoModel.getFeed({ page, limit, currentUserId, type });
        res.json(data);
    } catch (e) {
        console.error('getFeed error:', e);
        res.status(500).json({ message: 'Lỗi tải feed', error: e.message });
    }
};

// GET /api/videos/search
export const searchVideos = async (req, res) => {
    try {
        const q = (req.query.q || '').trim().slice(0, 100);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const videos = await VideoModel.search({ q, page, limit });
        res.json({ videos });
    } catch (e) {
        console.error('searchVideos error:', e);
        res.status(500).json({ message: 'Lỗi tìm kiếm', error: e.message });
    }
};

// GET /api/videos/:id
export const getVideoById = async (req, res) => {
    try {
        const currentUserId = req.user?.id ?? null;
        const video = await VideoModel.findByIdWithAuth(req.params.id, currentUserId);
        if (!video) return res.status(404).json({ message: 'Video không tồn tại' });

        // Increment views fire-and-forget
        VideoModel.incrementViews(req.params.id).catch(() => {});
        res.json({ video });
    } catch (e) {
        console.error('getVideoById error:', e);
        res.status(500).json({ message: 'Lỗi lấy video', error: e.message });
    }
};

// GET /api/videos/user/:userId
export const getVideosByUser = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
        const currentUserId = req.user?.id ?? null;
        const videos = await VideoModel.getByUserId(req.params.userId, { page, limit, currentUserId });
        res.json({ videos });
    } catch (e) {
        console.error('getVideosByUser error:', e);
        res.status(500).json({ message: 'Lỗi lấy video user', error: e.message });
    }
};

// POST /api/videos/upload
export const uploadVideo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file video' });

        const {
            caption = '',
            privacy = 'public',
            allowDuet,
            allowStitch,
            location = '',
            musicId,
            isDraft,
            originalVolume = '1',
            musicVolume = '0.5',
        } = req.body;

        // Validate privacy
        const validPrivacy = ['public', 'friends', 'private'];
        const safePrivacy = validPrivacy.includes(privacy) ? privacy : 'public';

        const videoId = await VideoModel.create({
            userId: req.user.id,
            musicId: musicId || null,
            originalVolume: parseFloat(originalVolume),
            musicVolume: parseFloat(musicVolume),
            caption: caption.slice(0, 500),
            videoUrl: req.file.path,
            thumbnail: req.file.path
                .replace('/upload/', '/upload/c_fill,w_300,h_400,g_auto/')
                .replace(/\.[^.]+$/, '.jpg'),
            duration: req.file.duration || 0,
            privacy: safePrivacy,
            allowDuet: allowDuet !== 'false',
            allowStitch: allowStitch !== 'false',
            location: location.slice(0, 100),
            isDraft: isDraft === 'true',
        });

        // Attach hashtags
        const tags = (caption.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g) || []);
        if (tags.length) {
            await HashtagModel.attachToVideo(videoId, tags).catch(() => {});
        }

        await UserModel.incrementVideoCount(req.user.id);

        const video = await VideoModel.findById(videoId);
        res.status(201).json({ message: 'Đăng video thành công!', video });
    } catch (e) {
        console.error('uploadVideo error:', e);
        res.status(500).json({ message: 'Lỗi đăng video', error: e.message });
    }
};

// GET /api/videos/:id/comments
export const getComments = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const currentUserId = req.user?.id ?? null;
        const comments = await CommentModel.getByVideoId(req.params.id, { page, limit, currentUserId });
        res.json({ comments });
    } catch (e) {
        console.error('getComments error:', e);
        res.status(500).json({ message: 'Lỗi lấy bình luận', error: e.message });
    }
};

// GET /api/videos/:id/comments/:commentId/replies
export const getReplies = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const currentUserId = req.user?.id ?? null;
        const data = await CommentModel.getReplies(req.params.commentId, { page, limit, currentUserId });
        res.json(data);
    } catch (e) {
        console.error('getReplies error:', e);
        res.status(500).json({ message: 'Lỗi lấy trả lời', error: e.message });
    }
};

// POST /api/videos/:id/comments
export const postComment = async (req, res) => {
    try {
        const content = (req.body.content || '').trim();
        if (!content) return res.status(400).json({ message: 'Nội dung không được trống' });
        if (content.length > 300) return res.status(400).json({ message: 'Bình luận tối đa 300 ký tự' });

        const { parentId, mentions } = req.body;

        const comment = await CommentModel.create({
            videoId: req.params.id,
            userId: req.user.id,
            content,
            parentId: parentId || null,
            mentions: mentions || null,
        });
        await VideoModel.updateCommentCount(req.params.id, 1);

        // Trigger notification for video owner (fire-and-forget)
        VideoModel.findById(req.params.id).then(async (video) => {
            if (video && String(video.userId) !== String(req.user.id)) {
                const senderDb = await UserModel.findById(req.user.id);
                const sender = senderDb ? normalizeUser(senderDb) : req.user;
                await triggerNotification(video.userId, sender, 'comment', video.id, comment.id);
            }
        }).catch(() => {});

        // Trigger notification for mentioned users (fire-and-forget)
        if (mentions && Array.isArray(mentions) && mentions.length > 0) {
            const senderDb = await UserModel.findById(req.user.id);
            const sender = senderDb ? normalizeUser(senderDb) : req.user;
            for (const m of mentions) {
                if (String(m.userId) !== String(req.user.id)) {
                    triggerNotification(m.userId, sender, 'mention', req.params.id, comment.id).catch(() => {});
                }
            }
        }

        // Trigger notification for reply target (fire-and-forget)
        if (parentId) {
            import('../models/commentModel.js').then(async () => {
                const [rows] = await (await import('../config/db.js')).default.query(
                    'SELECT ma_nguoi_dung FROM comments WHERE id = ?', [parentId]
                );
                if (rows[0] && String(rows[0].ma_nguoi_dung) !== String(req.user.id)) {
                    const senderDb = await UserModel.findById(req.user.id);
                    const sender = senderDb ? normalizeUser(senderDb) : req.user;
                    triggerNotification(rows[0].ma_nguoi_dung, sender, 'reply', req.params.id, comment.id).catch(() => {});
                }
            }).catch(() => {});
        }

        res.status(201).json({ message: 'Bình luận thành công!', comment });
    } catch (e) {
        console.error('postComment error:', e);
        res.status(500).json({ message: 'Lỗi đăng bình luận', error: e.message });
    }
};

// POST /api/videos/:id/comments/:commentId/like
export const likeComment = async (req, res) => {
    try {
        const liked = await CommentModel.likeComment(req.params.commentId, req.user.id);
        res.json({ message: liked ? 'Đã thích' : 'Đã thích rồi', liked: true });
    } catch (e) {
        console.error('likeComment error:', e);
        res.status(500).json({ message: 'Lỗi thích bình luận', error: e.message });
    }
};

// DELETE /api/videos/:id/comments/:commentId/like
export const unlikeComment = async (req, res) => {
    try {
        await CommentModel.unlikeComment(req.params.commentId, req.user.id);
        res.json({ message: 'Đã bỏ thích', liked: false });
    } catch (e) {
        console.error('unlikeComment error:', e);
        res.status(500).json({ message: 'Lỗi bỏ thích bình luận', error: e.message });
    }
};

// POST /api/videos/:id/like
export const likeVideo = async (req, res) => {
    try {
        const liked = await LikeModel.like(req.user.id, req.params.id);
        if (liked) {
            VideoModel.findById(req.params.id).then(async (video) => {
                if (video && String(video.userId) !== String(req.user.id)) {
                    const senderDb = await UserModel.findById(req.user.id);
                    const sender = senderDb ? normalizeUser(senderDb) : req.user;
                    await triggerNotification(video.userId, sender, 'like', video.id);
                }
            }).catch(() => {});
        }
        res.json({ message: liked ? 'Đã thích' : 'Đã thích rồi', liked: true });
    } catch (e) {
        console.error('likeVideo error:', e);
        res.status(500).json({ message: 'Lỗi like video', error: e.message });
    }
};

// DELETE /api/videos/:id/like
export const unlikeVideo = async (req, res) => {
    try {
        await LikeModel.unlike(req.user.id, req.params.id);
        res.json({ message: 'Đã bỏ thích', liked: false });
    } catch (e) {
        console.error('unlikeVideo error:', e);
        res.status(500).json({ message: 'Lỗi unlike video', error: e.message });
    }
};

// DELETE /api/videos/:id  — owner OR admin can delete
export const deleteVideo = async (req, res) => {
    try {
        const isAdmin = req.user.vai_tro === 'admin';

        let ok;
        if (isAdmin) {
            // Admin can soft-delete any video
            ok = await VideoModel.softDeleteByAdmin(req.params.id);
        } else {
            ok = await VideoModel.softDelete(req.params.id, req.user.id);
        }

        if (!ok) return res.status(403).json({ message: 'Không thể xóa video này' });

        // Update video count for the video owner
        const video = await VideoModel.findDeletedById(req.params.id);
        if (video?.userId) {
            await UserModel.incrementVideoCount(video.userId, -1);
        } else if (!isAdmin) {
            await UserModel.incrementVideoCount(req.user.id, -1);
        }

        res.json({ message: 'Đã xóa video' });
    } catch (e) {
        console.error('deleteVideo error:', e);
        res.status(500).json({ message: 'Lỗi xóa video', error: e.message });
    }
};