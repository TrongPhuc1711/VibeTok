import api from '../api/api';

// GET /api/music
export const getAllTracks = async ({ limit = 20 } = {}) => {
    try {
        const res = await api.get('/music', { params: { limit } });
        return { data: res.data };
    } catch {
        return { data: { tracks: [] } };
    }
};