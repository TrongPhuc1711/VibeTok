import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import pool from './config/db.js';

import authRoutes         from './routes/authRoutes.js';
import videoRoutes        from './routes/videoRoutes.js';
import userRoutes         from './routes/userRoutes.js';
import contentRoutes      from './routes/contentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes      from './routes/messageRoutes.js';
import followListRoutes   from './routes/followListRoutes.js';

import { initSocket } from './utils/socket.js';

dotenv.config();

const app    = express();
const server = createServer(app);

// CORS: cho phép frontend dev và production
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Cho phép request không có origin (mobile, Postman) và origin trong whitelist
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

initSocket(server);

// Health check
app.get('/', (req, res) => res.json({
    status: 'ok',
    message: '<--VibeTok Backend đang hoạt động!-->',
    env: process.env.NODE_ENV || 'development',
}));

// DB check (chỉ dùng lúc dev)
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/check-db', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM categories');
            res.json({ status: 'success', data_count: rows.length, categories: rows });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message });
        }
    });
}

// Routes
app.use('/api/auth',           authRoutes);
app.use('/api/videos',         videoRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/users',          followListRoutes); 
app.use('/api',                contentRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/messages',       messageRoutes);

// Global 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} không tồn tại` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[Server Error]', err.stack || err.message);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        message: err.message || 'Lỗi server không xác định',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`<--Server: http://localhost:${PORT}-->`);
    console.log(`   Môi trường: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM nhận được. Đang tắt server...');
    server.close(() => {
        pool.end();
        process.exit(0);
    });
});