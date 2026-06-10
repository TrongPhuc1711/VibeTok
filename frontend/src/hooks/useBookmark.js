import { useState, useCallback, useEffect } from 'react';
import { toggleBookmark as toggleBookmarkApi, checkBookmark } from '../services/bookmarkService';
import { isLoggedIn } from '../utils/helpers';

export function useBookmark(videoId, initialBookmarked = false) {
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [loading, setLoading] = useState(false);

    // Sync state if initialBookmarked prop changes
    useEffect(() => {
        setBookmarked(initialBookmarked);
    }, [initialBookmarked]);

    // Check actual bookmark status from backend on mount/videoId change
    useEffect(() => {
        if (!isLoggedIn() || !videoId) return;

        let isMounted = true;
        checkBookmark(videoId)
            .then(val => {
                if (isMounted) setBookmarked(val);
            })
            .catch(() => {});

        return () => {
            isMounted = false;
        };
    }, [videoId]);

    const toggle = useCallback(async () => {
        if (!isLoggedIn() || loading) return null;
        const prev = bookmarked;
        setBookmarked(!prev);
        setLoading(true);
        try {
            const res = await toggleBookmarkApi(videoId);
            setBookmarked(res.bookmarked);
            return res.bookmarked;
        } catch {
            setBookmarked(prev);
            return null;
        } finally {
            setLoading(false);
        }
    }, [videoId, bookmarked, loading]);

    return { bookmarked, toggle, loading };
}