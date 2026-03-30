// dữ liệu giả lập
import { sleep } from '../utils/helpers';

// ─── Mock helpers ─────────────────────────────────────────────
export { sleep as delay };

export const ok = (data, status = 200) => ({
    success: true, status, data, timestamp: new Date().toISOString(),
});

export const fail = (status, message) => {
    const err = new Error(message);
    err.status = status;
    err.response = { status, data: { message } };
    throw err;
};

// ─── Users ────────────────────────────────────────────────────
export const mockUsers = [
    {
        id: 'u_001', fullName: 'Nguyen Vibe', username: 'nguyenvibe',
        email: 'nguyenvibe@email.com', password: 'Vibe1234',
        initials: 'NV', bio: 'Chia sẻ khoảnh khắc đẹp ✨ Nhiếp ảnh & du lịch Việt Nam.',
        location: 'Ho Chi Minh City, Vietnam', isCreator: true,
        followers: 48200, following: 312, likes: 1100000, videos: 142,
        createdAt: '2023-01-15T00:00:00Z',
    },
    {
        id: 'u_002', fullName: 'Cmt dạo', username: 'nhavy',
        email: 'nhavy@email.com', password: 'Dance1234',
        initials: 'NV', bio: '💃 Tiến Dũng là của tôi',
        location: 'Bình Định, Vietnam', isCreator: true,
        followers: 112000, following: 89, likes: 2400000, videos: 89,
        createdAt: '2022-11-20T00:00:00Z',
    },
    {
        id: 'u_003', fullName: 'Đàm Vĩnh Hư', username: 'tiendung',
        email: 'tiendung@email.com', password: 'Lofi1234',
        initials: 'TD', bio: '🎵 Thích hát nhưng sai beat',
        location: 'Thanh Hóa, Vietnam', isCreator: true,
        followers: 28400, following: 156, likes: 890000, videos: 63,
        createdAt: '2023-03-10T00:00:00Z',
    },
    {
        id: 'u_004', fullName: 'Khôn lường', username: 'ankhuong',
        email: 'ankhuong@email.com', password: 'Travel1234',
        initials: 'AK', bio: '✈️ Mình là Pi nắc thích khám phá từng ngõ ngách',
        location: 'Hồ Chí Minh, Vietnam', isCreator: true,
        followers: 61000, following: 203, likes: 1700000, videos: 178,
        createdAt: '2022-09-05T00:00:00Z',
    },
    {
        id: 'u_005', fullName: 'Đạt 1 Lít', username: 'quocdat',
        email: 'quocdat@email.com', password: 'Beats1234',
        initials: 'QD', bio: 'Ghosted',
        location: 'Ninh Thuận, Vietnam', isCreator: true,
        followers: 33000, following: 412, likes: 654000, videos: 47,
        createdAt: '2023-06-01T00:00:00Z',
    },
];

// ─── Videos ───────────────────────────────────────────────────
export const mockVideos = [
    {
        id: 'v_001', userId: 'u_001', category: 'Travel',
        caption: 'Hoàng hôn Đà Lạt cực chill hôm nay ✨ #dalat #sunset #vibe #travel',
        hashtags: ['#dalat', '#sunset', '#vibe', '#travel'],
        duration: 121, likes: 6600000, comments: 22000, shares: 502100,
        bookmarks: 1700000, views: 12000000,
        music: { id: 'm_001', title: 'Lofi Study Mix', artist: 'VibeMix 2025' },
        location: 'Đà Lạt, Lâm Đồng', privacy: 'public',
        allowDuet: true, allowStitch: true,
        createdAt: new Date(Date.now() - 7200_000).toISOString(),
    },
    {
        id: 'v_002', userId: 'u_002', category: 'Dance',
        caption: 'Tutorial dance trend mới nhất 💃 #dance #trend #kpop',
        hashtags: ['#dance', '#trend', '#kpop'],
        duration: 60, likes: 856000, comments: 8900, shares: 423000,
        bookmarks: 201000, views: 5400000,
        music: { id: 'm_005', title: 'Night City', artist: 'TrangDancer' },
        privacy: 'public', allowDuet: true, allowStitch: false,
        createdAt: new Date(Date.now() - 18000_000).toISOString(),
    },
    {
        id: 'v_003', userId: 'u_003', category: 'Music',
        caption: 'Chill wave để làm việc 🎵 #lofi #music #chill',
        hashtags: ['#lofi', '#music', '#chill'],
        duration: 180, likes: 423000, comments: 3200, shares: 178000,
        bookmarks: 94000, views: 2100000,
        music: { id: 'm_002', title: 'Chill Wave', artist: 'HaiLofi' },
        privacy: 'public', allowDuet: false, allowStitch: false,
        createdAt: new Date(Date.now() - 86400_000).toISOString(),
    },
    {
        id: 'v_004', userId: 'u_004', category: 'Travel',
        caption: 'Review quán cà phê view đẹp nhất Đà Lạt ☕ #coffee #dalat',
        hashtags: ['#coffee', '#dalat', '#travel'],
        duration: 90, likes: 201000, comments: 5600, shares: 67000,
        bookmarks: 44000, views: 980000,
        music: { id: 'm_003', title: 'Sunset Drive', artist: 'MinhTravel' },
        location: 'Đà Lạt, Lâm Đồng', privacy: 'public',
        allowDuet: true, allowStitch: true,
        createdAt: new Date(Date.now() - 172800_000).toISOString(),
    },
    {
        id: 'v_005', userId: 'u_005', category: 'Music',
        caption: 'Making a beat from scratch 🎹 #music #producer',
        hashtags: ['#music', '#producer'],
        duration: 145, likes: 178000, comments: 2100, shares: 51000,
        bookmarks: 38000, views: 654000,
        music: { id: 'm_004', title: 'Indie VN', artist: 'LinhBeats' },
        privacy: 'public', allowDuet: false, allowStitch: true,
        createdAt: new Date(Date.now() - 259200_000).toISOString(),
    },
];

// ─── Comments ─────────────────────────────────────────────────
export const mockComments = [
    {
        id: 'c_001', videoId: 'v_001', userId: 'ext_1', username: 'Vermouth', initials: 'V',
        content: 'Tuất tổng chủ tập đoàn cầu thị 😭😭', likes: 77600, replies: 96,
        createdAt: new Date(Date.now() - 3600_000).toISOString()
    },
    {
        id: 'c_002', videoId: 'v_001', userId: 'ext_2', username: 'yeon', initials: 'y',
        content: 'the dog: 🐕', likes: 80500, replies: 88,
        createdAt: new Date(Date.now() - 5400_000).toISOString()
    },
    {
        id: 'c_003', videoId: 'v_001', userId: 'ext_3', username: 'Virexia 💕', initials: 'Vi',
        content: 'Aww 🥹', likes: 0, replies: 0,
        createdAt: new Date(Date.now() - 60_000).toISOString()
    },
    {
        id: 'c_004', videoId: 'v_001', userId: 'ext_4', username: 'Minh Khoa', initials: 'MK',
        content: 'Nhạc chọn rất hợp cảnh, chill quá 🎵', likes: 201, replies: 0,
        createdAt: new Date(Date.now() - 14400_000).toISOString()
    },
    {
        id: 'c_005', videoId: 'v_001', userId: 'ext_5', username: 'Hoa Pham', initials: 'HP',
        content: 'Ước đi Đà Lạt lúc này 😭 Xứ mình nắng quá!', likes: 67, replies: 0,
        createdAt: new Date(Date.now() - 18000_000).toISOString()
    },
];

// ─── Tracks ───────────────────────────────────────────────────
export const mockTracks = [
    { id: 'm_001', title: 'Lofi Study Mix', artist: 'VibeMix 2025', duration: 192 },
    { id: 'm_002', title: 'Chill Wave', artist: 'HaiLofi', duration: 192 },
    { id: 'm_003', title: 'Indie VN', artist: 'LinhBeats', duration: 178 },
    { id: 'm_004', title: 'Sunset Drive', artist: 'MinhTravel', duration: 241 },
    { id: 'm_005', title: 'Night City', artist: 'TrangDancer', duration: 224 },
];

// ─── Hashtags ─────────────────────────────────────────────────
export const mockHashtags = [
    { id: 'h_001', tag: '#dalatchill', videos: 142000, category: 'Travel' },
    { id: 'h_002', tag: '#lofivibes', videos: 98000, category: 'Music' },
    { id: 'h_003', tag: '#streetfood', videos: 76000, category: 'Food' },
    { id: 'h_004', tag: '#gaming', videos: 41000, category: 'Gaming' },
    { id: 'h_005', tag: '#travel', videos: 54000, category: 'Travel' },
    { id: 'h_006', tag: '#kpop', videos: 38000, category: 'Dance' },
    { id: 'h_007', tag: '#vlog', videos: 67000, category: 'Lifestyle' },
];