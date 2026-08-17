import express from 'express';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';
import { uploadMusicFiles } from '../middlewares/uploadMiddleware.js';
import {
    getStats, getUserGrowth, getContentDistribution, getTopCreators,
    getUsers, getUserCounts, banUser, unbanUser, tempBanUser, resetUserPassword,
    getVideos, getVideoCounts, hideVideo, restoreVideo, approveVideo,
    getViewsPerDay, getSidebarCounts,
    getMusic, getMusicCounts, createMusic, updateMusic, deleteMusic, toggleMusicTrending,
    getAdminReports, getAdminReportCounts, updateAdminReportStatus, deleteAdminReport,
    getSettings, updateSettings,
    updateAdminProfile, changeAdminPassword
} from '../controllers/adminController.js';

const router = express.Router();

// Tất cả routes admin yêu cầu đăng nhập + quyền admin
router.use(verifyToken, requireAdmin);

// Dashboard
router.get('/stats', getStats);
router.get('/user-growth', getUserGrowth);
router.get('/content-distribution', getContentDistribution);
router.get('/top-creators', getTopCreators);
router.get('/sidebar-counts', getSidebarCounts);

// Users
router.get('/users', getUsers);
router.get('/user-counts', getUserCounts);
router.patch('/users/:id/ban', banUser);
router.patch('/users/:id/unban', unbanUser);
router.patch('/users/:id/temp-ban', tempBanUser);
router.patch('/users/:id/reset-password', resetUserPassword);

// Videos
router.get('/videos', getVideos);
router.get('/video-counts', getVideoCounts);
router.patch('/videos/:id/hide', hideVideo);
router.patch('/videos/:id/restore', restoreVideo);
router.patch('/videos/:id/approve', approveVideo);

// Music
router.get('/music', getMusic);
router.get('/music-counts', getMusicCounts);
router.post('/music', uploadMusicFiles, createMusic);
router.patch('/music/:id', uploadMusicFiles, updateMusic);
router.delete('/music/:id', deleteMusic);
router.patch('/music/:id/trending', toggleMusicTrending);

// Analytics
router.get('/views-per-day', getViewsPerDay);

// Reports
router.get('/reports', getAdminReports);
router.get('/report-counts', getAdminReportCounts);
router.patch('/reports/:id/status', updateAdminReportStatus);
router.delete('/reports/:id', deleteAdminReport);

// System Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Admin Profile & Security
router.patch('/profile', updateAdminProfile);
router.post('/change-password', changeAdminPassword);

export default router;
