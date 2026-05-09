import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// ====================================================
// Dùng memoryStorage thay vì multer-storage-cloudinary
// vì multer-storage-cloudinary v4 yêu cầu cloudinary v1
// nhưng project dùng cloudinary v2 SDK → gây lỗi 500.
// ====================================================

const memStorage = multer.memoryStorage();

// Helper: upload buffer lên Cloudinary trả về result
function uploadToCloudinary(buffer, options = {}) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        stream.end(buffer);
    });
}

// Middleware wrapper: chạy multer → upload từng file lên Cloudinary
// và gán lại req.files với path (secure_url) giống như multer-storage-cloudinary
function wrapMulterAndUpload(multerMiddleware, getCloudinaryParams) {
    return async (req, res, next) => {
        // Bước 1: parse multipart bằng multer (lưu vào memory)
        multerMiddleware(req, res, async (multerErr) => {
            if (multerErr) {
                console.error('[Upload MW] Multer error:', multerErr);
                return res.status(400).json({ message: multerErr.message || 'Lỗi upload file' });
            }

            try {
                // Bước 2: upload từng file lên Cloudinary
                if (req.files && Object.keys(req.files).length > 0) {
                    console.log('[Upload MW] Uploading fields:', Object.keys(req.files));
                    for (const fieldName of Object.keys(req.files)) {
                        const files = req.files[fieldName];
                        console.log(`[Upload MW] Field "${fieldName}": ${files.length} file(s)`);
                        for (let i = 0; i < files.length; i++) {
                            const file = files[i];
                            console.log(`[Upload MW] Uploading ${fieldName}[${i}]: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
                            const params = await getCloudinaryParams(req, file);
                            const result = await uploadToCloudinary(file.buffer, params);
                            // Gán path giống format cũ (multer-storage-cloudinary)
                            file.path = result.secure_url;
                            file.filename = result.public_id;
                            file.cloudinary = result;
                            console.log(`[Upload MW] Done ${fieldName}[${i}]: ${result.secure_url}`);
                        }
                    }
                } else if (req.file) {
                    console.log(`[Upload MW] Single file: ${req.file.originalname} (${req.file.mimetype})`);
                    const params = await getCloudinaryParams(req, req.file);
                    const result = await uploadToCloudinary(req.file.buffer, params);
                    req.file.path = result.secure_url;
                    req.file.filename = result.public_id;
                    req.file.cloudinary = result;
                    console.log(`[Upload MW] Done: ${result.secure_url}`);
                } else {
                    console.log('[Upload MW] No files received from multer');
                }

                next();
            } catch (uploadErr) {
                console.error('[Upload MW] Cloudinary upload error:', uploadErr);
                return res.status(500).json({
                    message: 'Lỗi tải file lên cloud',
                    error: uploadErr.message,
                });
            }
        });
    };
}

// ==================
// Cloudinary params
// ==================

const getContentParams = async (_req, file) => {
    if (file.mimetype.startsWith('image/')) {
        return {
            folder: 'vibetok/slideshows',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ quality: 'auto' }],
        };
    }
    return {
        folder: 'vibetok/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
        transformation: [{ quality: 'auto' }],
    };
};

const getAvatarParams = async () => ({
    folder: 'vibetok/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
});

const getMusicParams = async (_req, file) => {
    if (file.fieldname === 'audio') {
        return {
            folder: 'vibetok/music-audio',
            resource_type: 'video', // Audio xử lý như video trong Cloudinary
            allowed_formats: ['mp3', 'wav', 'm4a', 'aac'],
        };
    }
    if (file.fieldname === 'cover') {
        return {
            folder: 'vibetok/music-covers',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 500, height: 500, crop: 'fill' }],
        };
    }
    return {};
};

// ==================
// File size limits
// ==================
const fileSizeLimits = {
    video: 500 * 1024 * 1024, // 500 MB
    avatar: 5 * 1024 * 1024,  // 5 MB
    music: 50 * 1024 * 1024,  // 50 MB
};

// ==================
// Exported Middlewares
// ==================

const contentMulter = multer({
    storage: memStorage,
    limits: { fileSize: fileSizeLimits.video },
}).fields([
    { name: 'video', maxCount: 1 },
    { name: 'images', maxCount: 20 },
]);

const avatarMulter = multer({
    storage: memStorage,
    limits: { fileSize: fileSizeLimits.avatar },
}).single('avatar');

const musicMulter = multer({
    storage: memStorage,
    limits: { fileSize: fileSizeLimits.music },
}).fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
]);

export const uploadContent = wrapMulterAndUpload(contentMulter, getContentParams);
export const uploadAvatar = wrapMulterAndUpload(avatarMulter, getAvatarParams);
export const uploadMusicFiles = wrapMulterAndUpload(musicMulter, getMusicParams);