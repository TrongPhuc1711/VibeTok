import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import pool from './config/db.js';

import authRoutes    from './routes/authRoutes.js';
import videoRoutes   from './routes/videoRoutes.js';
import userRoutes    from './routes/userRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { initSocket } from './utils/socket.js';
import messageRoutes from './routes/messageRoutes.js';

const app = express();
const server = createServer(app);

//  CORS: chỉ cho phép frontend origin, không mở toàn bộ
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim());

console.log('[CORS] Allowed origins:', ALLOWED_ORIGINS);

// Xử lý preflight OPTIONS trước — đảm bảo luôn trả header đúng
// Express 5 dùng {*path} thay vì * cho catch-all
app.options('{*path}', cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cors({
    origin: (origin, callback) => {
        // Cho phép request không có origin (Postman, curl, server-to-server)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn('[CORS] Blocked origin:', origin);
            // Trả false thay vì throw Error — Express 5 xử lý Error khác
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

initSocket(server);

app.get('/', (req, res) => res.send('<--VibeTok Backend đang hoạt động!-->'));

app.get('/api/check-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories');
        res.json({ status: 'success', data_count: rows.length, categories: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

app.use('/api/auth',    authRoutes);
app.use('/api/videos',  videoRoutes);

app.use('/api/users',   userRoutes);
app.use('/api', contentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));