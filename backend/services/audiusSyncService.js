import axios from 'axios';
import pool from '../config/db.js';

const APP_NAME = 'VibeTokApp';
const DISCOVERY_NODE = 'https://discoveryprovider.audius.co';

export const syncTrendingMusicFromAudius = async () => {
    try {
        console.log('⏳ Đang lấy danh sách nhạc từ Audius...');
        
        // 1. Gọi API lấy top 50 bài đang thịnh hành
        const response = await axios.get(`${DISCOVERY_NODE}/v1/tracks/trending?app_name=${APP_NAME}&limit=50`);
        const tracks = response.data.data;

        let addedCount = 0;

        // 2. Lặp qua từng bài hát để xử lý
        for (const track of tracks) {
            const title = track.title;
            const artist = track.user.name;
            const duration = track.duration; // Thời lượng tính bằng giây
            const trackId = track.id;
            
            // Tạo link stream nhạc và ảnh bìa
            const audioUrl = `${DISCOVERY_NODE}/v1/tracks/${trackId}/stream?app_name=${APP_NAME}`;
            // Lấy ảnh bìa kích thước 480x480 (nếu có)
            const cover = track.artwork ? track.artwork['480x480'] : null;

            // 3. Kiểm tra xem bài hát này đã có trong DB chưa (tránh bị trùng lặp)
            const [existing] = await pool.query(
                'SELECT id FROM music WHERE tieu_de = ? AND nghe_si = ?', 
                [title, artist]
            );

            // 4. Nếu chưa có thì lưu vào bảng `music`
            if (existing.length === 0) {
                await pool.query(
                    `INSERT INTO music (tieu_de, nghe_si, thoi_luong_giay, duong_dan_am_thanh, anh_bia, dang_thinh_hanh, luot_su_dung) 
                     VALUES (?, ?, ?, ?, ?, 1, 0)`,
                    [title, artist, duration, audioUrl, cover]
                );
                addedCount++;
                console.log(`Đã thêm: ${title} - ${artist}`);
            }
        }

        console.log(`✅ Đồng bộ hoàn tất! Đã thêm ${addedCount} bài hát mới vào Database.`);
        return { success: true, added: addedCount };

    } catch (error) {
        console.error("❌ Lỗi khi cào nhạc Audius:", error.message);
        return { success: false, error: error.message };
    }
};