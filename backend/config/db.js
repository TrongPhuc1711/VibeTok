import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vibeток',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
};

const pool = mysql.createPool(dbConfig);


pool.getConnection()
    .then(connection => {
        console.log('✅ Kết nối Database VibeTok thành công!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối Database:', err.message);
    });

export default pool;