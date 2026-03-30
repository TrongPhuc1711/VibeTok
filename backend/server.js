import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contentRoutes from './routes/contentRoutes.js';

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => res.send('🚀 VibeTok Backend đang hoạt động!'));

app.get('/api/check-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories');
        res.json({ status: 'success', data_count: rows.length, categories: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/music', contentRoutes);
app.use('/api/hashtags', contentRoutes);
app.use('/api/categories', contentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));