import { useState, useEffect, useCallback } from 'react';
import { getFeed } from '../services/videoService';

// ✅ FIX: Hook hỗ trợ feedType "forYou" và "following"
export function useVideoFeed(type = 'forYou') {
    const [videos,      setVideos]      = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page,        setPage]        = useState(1);
    const [hasMore,     setHasMore]     = useState(true);
    const [error,       setError]       = useState(null);

    const fetchVideos = useCallback(async (p = 1, reset = false) => {
        try {
            if (p === 1) setLoading(true); else setLoadingMore(true);
            const res = await getFeed({ type, page: p });
            const incoming = res.data.videos || [];
            setVideos(prev => reset ? incoming : [...prev, ...incoming]);
            setHasMore(res.data.hasMore ?? false);
            setPage(p);
            setError(null);
        } catch (e) {
            setError(e.message || 'Lỗi khi tải video');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [type]);

    // Reset khi feedType thay đổi
    useEffect(() => {
        setVideos([]);
        setPage(1);
        setHasMore(true);
        fetchVideos(1, true);
    }, [fetchVideos]);

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) fetchVideos(page + 1);
    }, [loadingMore, hasMore, page, fetchVideos]);

    const refresh = useCallback(() => fetchVideos(1, true), [fetchVideos]);

    return { videos, loading, loadingMore, hasMore, error, loadMore, refresh };
}