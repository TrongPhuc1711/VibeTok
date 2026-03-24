import { useState, useEffect, useCallback } from 'react';
import { getFeed } from '../services/videoService';

export function useVideoFeed(type = 'forYou') {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);

    const fetch = useCallback(async (p = 1, reset = false) => {
        try {
            if (p === 1) setLoading(true); else setLoadingMore(true);
            const res = await getFeed({ type, page: p });
            setVideos(prev => reset ? res.data.videos : [...prev, ...res.data.videos]);
            setHasMore(res.data.hasMore);
            setPage(p);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [type]);

    useEffect(() => { fetch(1, true); }, [fetch]);

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) fetch(page + 1);
    }, [loadingMore, hasMore, page, fetch]);

    const refresh = useCallback(() => fetch(1, true), [fetch]);

    return { videos, loading, loadingMore, hasMore, error, loadMore, refresh };
}