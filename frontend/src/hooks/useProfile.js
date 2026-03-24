import { useState, useEffect, useCallback } from 'react';
import { getUserProfile, getUserVideos, followUser, unfollowUser } from '../services/userService';

export function useProfile(username) {
    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (!username) return;
        setLoading(true);
        Promise.all([getUserProfile(username), getUserVideos(username)])
            .then(([pRes, vRes]) => {
                setProfile(pRes.data.user);
                setVideos(vRes.data.videos);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [username]);

    const toggleFollow = useCallback(async () => {
        if (!profile) return;
        try {
            const fn = following ? unfollowUser : followUser;
            const res = await fn(profile.username);
            setFollowing(f => !f);
            setProfile(p => ({ ...p, followers: res.data.followers }));
        } catch (e) {
            setError(e.message);
        }
    }, [following, profile]);

    return { profile, videos, loading, error, following, toggleFollow, setProfile };
}