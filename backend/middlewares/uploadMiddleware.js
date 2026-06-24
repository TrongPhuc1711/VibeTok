import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const memStorage = multer.memoryStorage();


async function uploadToCloudinary(fileBuffer, mimetype, options = {}) {
    const b64 = fileBuffer.toString('base64');
    const dataUri = `data:${mimetype};base64,${b64}`;
    return cloudinary.uploader.upload(dataUri, options);
}

// Promisify multer middleware để dùng await thay vì callback
function runMulter(multerMw, req, res) {
    return new Promise((resolve, reject) => {
        multerMw(req, res, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Middleware wrapper: parse form → upload Cloudinary → gán path
function wrapMulterAndUpload(multerMw, getCloudinaryParams) {
    return async (req, res, next) => {
        try {
            // Bước 1: parse multipart form
            await runMulter(multerMw, req, res);

            // Bước 2: upload từng file lên Cloudinary
            if (req.files && Object.keys(req.files).length > 0) {
                console.log('[Upload MW] Fields:', Object.keys(req.files));
                for (const fieldName of Object.keys(req.files)) {
                    const files = req.files[fieldName];
                    console.log(`[Upload MW] "${fieldName}": ${files.length} file(s)`);
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        console.log(`[Upload MW] Uploading ${fieldName}[${i}]: ${file.originalname} (${file.mimetype}, ${file.size}B)`);
                        const params = await getCloudinaryParams(req, file);
                        const result = await uploadToCloudinary(file.buffer, file.mimetype, params);
                        file.path = result.secure_url;
                        file.filename = result.public_id;
                        file.cloudinary = result;
                        console.log(`[Upload MW] ✓ ${fieldName}[${i}]: ${result.secure_url}`);
                    }
                }
            } else if (req.file) {
                console.log(`[Upload MW] Single: ${req.file.originalname} (${req.file.mimetype})`);
                const params = await getCloudinaryParams(req, req.file);
                const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, params);
                req.file.path = result.secure_url;
                req.file.filename = result.public_id;
                req.file.cloudinary = result;
                console.log(`[Upload MW] ✓ ${result.secure_url}`);
            } else {
                console.log('[Upload MW] No files received');
            }

            next();
        } catch (err) {
            console.error('[Upload MW] ERROR:', err.message || err);
            // Trả JSON thay vì để Express trả HTML
            if (!res.headersSent) {
                const status = err.storageErrors ? 400 : 500;
                return res.status(status).json({
                    message: err.message || 'Lỗi upload file',
                    error: err.message,
                });
            }
        }
    };
}


// Cloudinary params

const getContentParams = async (_req, file) => {
    if (file.mimetype.startsWith('image/')) {
        return {
            folder: 'vibetok/slideshows',
            resource_type: 'image',
            transformation: [{ quality: 'auto' }],
        };
    }
    return {
        folder: 'vibetok/videos',
        resource_type: 'video',
    };
};

const getAvatarParams = async () => ({
    folder: 'vibetok/avatars',
    resource_type: 'image',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
});

const getMusicParams = async (_req, file) => {
    if (file.fieldname === 'audio') {
        return {
            folder: 'vibetok/music-audio',
            resource_type: 'video', // Audio xử lý như video trong Cloudinary
        };
    }
    if (file.fieldname === 'cover') {
        return {
            folder: 'vibetok/music-covers',
            resource_type: 'image',
            transformation: [{ width: 500, height: 500, crop: 'fill' }],
        };
    }
    return {};
};


// File size limits
const fileSizeLimits = {
    video: 500 * 1024 * 1024, // 500 MB
    avatar: 5 * 1024 * 1024,  // 5 MB
    music: 50 * 1024 * 1024,  // 50 MB
};


// Multer instances


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