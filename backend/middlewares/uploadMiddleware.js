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

const fileSizeLimits = {
    video:  500 * 1024 * 1024, // 500 MB
    avatar: 5   * 1024 * 1024, // 5 MB
};

export const uploadVideo  = multer({ storage: videoStorage,  limits: { fileSize: fileSizeLimits.video }  }).single('video');
export const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: fileSizeLimits.avatar } }).single('avatar');