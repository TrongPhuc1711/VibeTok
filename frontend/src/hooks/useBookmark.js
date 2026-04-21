import { useState, useCallback } from 'react';
import { toggleBookmark as toggleBookmarkApi } from '../services/bookmarkService';
import { isLoggedIn } from '../utils/helpers';

export function useBookmark(videoId, initialBookmarked = false) {
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [loading, setLoading] = useState(false);

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