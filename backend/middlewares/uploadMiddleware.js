import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Storage cho VIDEO
const videoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder:        'vibetok/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
        transformation: [{ quality: 'auto' }],
    },
});

// Storage cho ẢNH ĐẠI DIỆN
const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder:        'vibetok/avatars',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    },
});

// Storage cho ÂM NHẠC (Xử lý cả audio và cover image)
const musicStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        if (file.fieldname === 'audio') {
            return {
                folder: 'vibetok/music-audio',
                resource_type: 'video', // Audio được xử lý như video trong cloudinary
                allowed_formats: ['mp3', 'wav', 'm4a', 'aac']
            };
        } else if (file.fieldname === 'cover') {
            return {
                folder: 'vibetok/music-covers',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 500, height: 500, crop: 'fill' }]
            };
        }
    }
});

const fileSizeLimits = {
    video:  500 * 1024 * 1024, // 500 MB
    avatar: 5   * 1024 * 1024, // 5 MB
    music:  50  * 1024 * 1024, // 50 MB cho audio
};

export const uploadVideo  = multer({ storage: videoStorage,  limits: { fileSize: fileSizeLimits.video }  }).single('video');
export const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: fileSizeLimits.avatar } }).single('avatar');
export const uploadMusicFiles = multer({ storage: musicStorage, limits: { fileSize: fileSizeLimits.music } }).fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]);