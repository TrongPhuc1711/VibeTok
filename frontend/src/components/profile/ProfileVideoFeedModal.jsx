import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComments, postComment, likeVideo, unlikeVideo, shareVideo as shareVideoApi, repostVideo as repostVideoApi } from '../../services/videoService';
import { followUser, unfollowUser } from '../../services/userService';
import { formatCount, formatTimeAgo, parseHashtags, stripHashtags } from '../../utils/formatters';
import { isLoggedIn, getStoredUser } from '../../utils/helpers';
import { ArrowDownIcon, ArrowUpIcon } from '../../icons/NavIcons';
import EmojiPickerButton from '../ui/EmojiPickerButton';
import Avatar from '../common/Avatar/avatar';
import { ImageSlideshow } from '../ui/ImageSlideshow';
import { useToast } from '../ui/Toast';
import LoginPromptModal from '../ui/LoginPromptModal';
import ShareSheet from '../video/ShareSheet/ShareSheet';
import { BookmarkIcon, ShareIcon } from '../../icons/ActionIcons';

// ── Comment Section ──
function CommentSection({ videoId, totalComments }) {
    const me = getStoredUser();
    const [comments,   setComments]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [input,      setInput]      = useState('');
    const [submitting, setSubmitting] = useState(false);
    const listRef  = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!videoId) return;
        setLoading(true);
        getComments(videoId)
            .then(r => setComments(r.data.comments || []))
            .catch(() => setComments([]))
            .finally(() => setLoading(false));
    }, [videoId]);

    const handleSubmit = async () => {
        if (!input.trim() || submitting || !isLoggedIn()) return;
        setSubmitting(true);
        try {
            const r = await postComment(videoId, { content: input.trim() });
            setComments(p => [r.data.comment, ...p]);
            setInput('');
            listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 custom-modal-scrollbar">
                {loading ? (
                    <div className="flex flex-col gap-4 pt-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 shrink-0" />
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 w-1/3" />
                                    <div className="h-2.5 rounded-full bg-black/5 dark:bg-white/5 w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: 'var(--color-text-muted)' }}>
                        <p className="text-[13px] font-body text-center m-0">Chưa có bình luận nào.<br />Hãy là người đầu tiên!</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {comments.map((c, i) => (
                            <CommentRow key={c.id || i} comment={c} />
                        ))}
                    </div>
                )}
            </div>

            <div className="px-4 py-3 shrink-0 border-t" style={{ borderColor: 'var(--color-border)' }}>
                {isLoggedIn() ? (
                    <div className="flex items-center gap-2.5">
                        <Avatar
                            user={me}
                            className="!w-8 !h-8 !text-[10px]"
                        />
                        <div
                            className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-full border"
                            style={{
                                background: 'var(--vt-input)',
                                borderColor: 'var(--color-border)',
                            }}
                        >
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
                                placeholder="Thêm bình luận..."
                                className="flex-1 bg-transparent border-none outline-none text-[13px] font-body"
                                style={{ color: 'var(--color-text-primary)' }}
                            />
                            <EmojiPickerButton
                                onSelect={(emoji) => setInput((p) => p + emoji)}
                                position="top"
                                size={16}
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={!input.trim() || submitting}
                                className="shrink-0 border-none cursor-pointer transition-all disabled:opacity-30 p-0 bg-transparent flex items-center justify-center"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                    stroke={input.trim() ? '#ff2d78' : 'var(--color-text-muted)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 1L7 9M15 1L10.5 15L7 9L1 5.5L15 1Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-[12px] font-body m-0" style={{ color: 'var(--color-text-muted)' }}>
                        Đăng nhập để bình luận
                    </p>
                )}
            </div>
        </div>
    );
}

function CommentRow({ comment }) {
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(comment.likes ?? 0);

    return (
        <div className="flex gap-3 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <Avatar
                user={{
                    anh_dai_dien: comment.anh_dai_dien,
                    initials: comment.initials || comment.username?.[0]?.toUpperCase(),
                    fullName: comment.username
                }}
                className="!w-9 !h-9 !text-[11px]"
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold font-body" style={{ color: 'var(--color-text-primary)' }}>
                        {comment.username}
                    </span>
                    <span className="text-[11px] font-body" style={{ color: 'var(--color-text-muted)' }}>
                        {formatTimeAgo(comment.createdAt)}
                    </span>
                </div>
                <p className="text-[13px] font-body leading-relaxed m-0 break-words" style={{ color: 'var(--color-text-secondary)' }}>
                    {comment.content}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                    <button
                        className="bg-transparent border-none text-[11px] font-body cursor-pointer p-0 transition-colors hover:underline"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        Trả lời
                    </button>
                </div>
            </div>
            <button
                onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1); }}
                className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer shrink-0 self-start mt-1 transition-transform active:scale-90"
            >
                <svg width="14" height="14" viewBox="0 0 24 24"
                    fill={liked ? '#ff2d78' : 'none'}
                    stroke={liked ? '#ff2d78' : 'var(--color-text-muted)'}
                    strokeWidth="1.5">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {likes > 0 && (
                    <span className="text-[10px] font-body" style={{ color: liked ? '#ff2d78' : 'var(--color-text-muted)' }}>
                        {likes}
                    </span>
                )}
            </button>
        </div>
    );
}

// ── Right Panel ──
function RightPanel({ video, following, onFollowToggle, onLike, liked, likeCount, bookmarked, bookmarkCount, onBookmark, shareCount, onShareOpen, onClose, onPrivacyChange }) {
    const navigate = useNavigate();
    const me = getStoredUser();
    const user = video?.user ?? {};
    const hashtags = parseHashtags(video?.caption ?? '');
    const captionTxt = stripHashtags(video?.caption ?? '');
    const isOwnVideo = me && (String(me.id) === String(user.id) || me.username === user.username);

    return (
        <div
            className="flex flex-col h-full"
            style={{
                background: 'var(--vt-card)',
                borderLeft: '1px solid var(--color-border)',
            }}
        >
            {/* User header */}
            <div className="flex items-center gap-3 px-5 py-4 shrink-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <Avatar
                    user={user}
                    className="!w-11 !h-11 !text-sm cursor-pointer ring-2 ring-black/5 dark:ring-white/10 hover:ring-primary/50 transition-all"
                    onClick={() => { onClose(); navigate(`/profile/${user.username}`); }}
                />
                <div className="flex-1 min-w-0">
                    <p
                        className="text-[14px] font-semibold font-body leading-tight cursor-pointer hover:underline m-0"
                        style={{ color: 'var(--color-text-primary)' }}
                        onClick={() => { onClose(); navigate(`/profile/${user.username}`); }}
                    >
                        {user.fullName || user.username}
                        {user.isCreator && <span className="ml-1.5 text-[11px] text-primary">✦</span>}
                    </p>
                    <p className="text-[12px] font-body m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        @{user.username}
                    </p>
                </div>
                {!isOwnVideo && me ? (
                    <button
                        onClick={onFollowToggle}
                        className={`shrink-0 text-[12px] font-semibold font-body px-4 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            following
                                ? 'bg-transparent text-text-secondary border-border hover:border-red-400 hover:text-red-400'
                                : 'bg-primary border-primary text-white hover:opacity-90'
                        }`}
                    >
                        {following ? 'Đang follow' : 'Follow'}
                    </button>
                ) : isOwnVideo ? (
                    <div className="shrink-0">
                        <select
                            value={video?.privacy || 'public'}
                            onChange={(e) => onPrivacyChange && onPrivacyChange(video.id, e.target.value)}
                            className="rounded-lg px-2.5 py-1.5 text-[12px] font-body outline-none cursor-pointer border transition-colors"
                            style={{
                                background: 'var(--vt-input)',
                                color: 'var(--color-text-primary)',
                                borderColor: 'var(--color-border)',
                            }}
                        >
                            <option value="public">Công khai</option>
                            <option value="friends">Bạn bè</option>
                            <option value="private">Chỉ mình tôi</option>
                        </select>
                    </div>
                ) : null}
            </div>

            {/* Caption & Hashtags */}
            <div className="px-5 py-3.5 shrink-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
                {captionTxt && (
                    <p className="text-[13px] font-body leading-relaxed m-0 mb-2 line-clamp-3" style={{ color: 'var(--color-text-primary)' }}>
                        {captionTxt}
                    </p>
                )}
                {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {hashtags.map(h => (
                            <span 
                                key={h} 
                                className="text-primary text-[12px] font-semibold font-body cursor-pointer hover:underline transition-colors"
                                onClick={() => { onClose(); navigate(`/tag/${h.replace('#', '')}`); }}
                            >
                                {h}
                            </span>
                        ))}
                    </div>
                )}
                {video?.music && (
                    <div className="flex items-center gap-1.5 mt-2.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--color-text-muted)' }}>
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                        <span className="text-[11px] font-body truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {video.music.title} – {video.music.artist}
                        </span>
                    </div>
                )}
                <p className="text-[11px] font-body mt-2 m-0" style={{ color: 'var(--color-text-muted)' }}>
                    {formatTimeAgo(video?.createdAt)}
                </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-5 px-5 py-3 shrink-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
                {/* Like */}
                <button
                    onClick={onLike}
                    className="flex items-center gap-2 bg-transparent border-none cursor-pointer transition-all group active:scale-90 p-0"
                    title={liked ? 'Bỏ thích' : 'Thích'}
                >
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                        style={{
                            background: liked ? 'rgba(255,45,120,0.15)' : 'var(--vt-input)',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24"
                            fill={liked ? '#ff2d78' : 'none'}
                            stroke={liked ? '#ff2d78' : 'var(--color-text-secondary)'}
                            strokeWidth="1.5">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                    <span className="text-[13px] font-body" style={{ color: liked ? '#ff2d78' : 'var(--color-text-secondary)' }}>
                        {formatCount(likeCount)}
                    </span>
                </button>

                {/* Comment count */}
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--vt-input)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                    </div>
                    <span className="text-[13px] font-body" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatCount(video?.comments)}
                    </span>
                </div>

                {/* Share */}
                <button
                    onClick={onShareOpen}
                    className="flex items-center gap-2 bg-transparent border-none cursor-pointer transition-all active:scale-90 p-0"
                    title="Chia sẻ"
                >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ background: 'var(--vt-input)' }}>
                        <ShareIcon size={17} />
                    </div>
                    <span className="text-[13px] font-body" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatCount(shareCount ?? video?.shares)}
                    </span>
                </button>

                {/* Bookmark */}
                <button
                    onClick={onBookmark}
                    className="flex items-center gap-2 bg-transparent border-none cursor-pointer transition-all active:scale-90 p-0"
                    title={bookmarked ? 'Bỏ lưu' : 'Lưu video'}
                >
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                        style={{
                            background: bookmarked ? 'rgba(255,248,45,0.15)' : 'var(--vt-input)',
                        }}
                    >
                        <BookmarkIcon filled={bookmarked} />
                    </div>
                    <span className="text-[13px] font-body" style={{ color: bookmarked ? '#fff82d' : 'var(--color-text-secondary)' }}>
                        {formatCount(bookmarkCount ?? video?.bookmarks)}
                    </span>
                </button>

                {/* Views */}
                <div className="flex items-center gap-1.5 ml-auto">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="text-[11px] font-body" style={{ color: 'var(--color-text-muted)' }}>
                        {formatCount(video?.views)}
                    </span>
                </div>
            </div>

            {/* Comments label */}
            <div className="px-5 py-2.5 shrink-0 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[11px] font-body uppercase tracking-[0.5px] m-0" style={{ color: 'var(--color-text-muted)' }}>
                    Bình luận ({formatCount(video?.comments)})
                </p>
            </div>

            {/* Comments */}
            <CommentSection videoId={video?.id} totalComments={video?.comments} />
        </div>
    );
}

// ── ProfileVideoFeedModal Main Component ──
export default function ProfileVideoFeedModal({ videos = [], initialIndex = 0, onClose, onPrivacyChange }) {
    const navigate = useNavigate();
    const { showSuccess, showInfo, showError } = useToast();

    const [currentIdx, setCurrentIdx] = useState(initialIndex);
    const [playing, setPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [visible, setVisible] = useState(false);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(9 / 16);

    const current = videos[currentIdx];

    const [liked, setLiked] = useState(current?.isLiked ?? false);
    const [likeCount, setLikeCount] = useState(current?.likes ?? 0);
    const [likeLoading, setLikeLoading] = useState(false);

    const [followMap, setFollowMap] = useState({});
    const [followLoading, setFollowLoading] = useState(false);

    // Bookmark, Share & Login states per video
    const [bookmarkMap, setBookmarkMap] = useState({});
    const [bookmarkCountMap, setBookmarkCountMap] = useState({});
    const [shareCountMap, setShareCountMap] = useState({});
    const [repostMap, setRepostMap] = useState({});
    const [shareOpen, setShareOpen] = useState(false);
    const [loginPrompt, setLoginPrompt] = useState({ open: false, action: 'like' });

    const videoRef = useRef(null);
    const progressBarRef = useRef(null);

    useEffect(() => {
        setVisible(true);
    }, []);

    useEffect(() => {
        if (!current) return;
        setLiked(current.isLiked ?? false);
        setLikeCount(current.likes ?? 0);
        setProgress(0);
        setPlaying(true);

        if (current.id) {
            setBookmarkMap(prev => (prev[current.id] !== undefined ? prev : { ...prev, [current.id]: Boolean(current.isBookmarked) }));
            setBookmarkCountMap(prev => (prev[current.id] !== undefined ? prev : { ...prev, [current.id]: current.bookmarks ?? 0 }));
            setShareCountMap(prev => (prev[current.id] !== undefined ? prev : { ...prev, [current.id]: current.shares ?? 0 }));
            setRepostMap(prev => (prev[current.id] !== undefined ? prev : { ...prev, [current.id]: Boolean(current.isReposted) }));
        }

        if (current.user?.username && followMap[current.user.username] === undefined) {
            setFollowMap(prev => ({
                ...prev,
                [current.user.username]: current.user.isFollowing ?? false,
            }));
        }
    }, [currentIdx, current?.id]);

    const following = current?.user?.username ? (followMap[current.user.username] ?? false) : false;

    const bookmarked = current?.id ? (bookmarkMap[current.id] ?? Boolean(current.isBookmarked)) : false;
    const bookmarkCount = current?.id ? (bookmarkCountMap[current.id] ?? (current.bookmarks ?? 0)) : (current?.bookmarks ?? 0);
    const shareCount = current?.id ? (shareCountMap[current.id] ?? (current.shares ?? 0)) : (current?.shares ?? 0);
    const reposted = current?.id ? (repostMap[current.id] ?? Boolean(current.isReposted)) : false;

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const onTime = () => {
            if (!dragging && v.duration) {
                setProgress((v.currentTime / v.duration) * 100);
            }
        };
        const onMeta = () => setDuration(v.duration || 0);
        const onEnd = () => go(1);
        v.addEventListener('timeupdate', onTime);
        v.addEventListener('loadedmetadata', onMeta);
        v.addEventListener('ended', onEnd);
        return () => {
            v.removeEventListener('timeupdate', onTime);
            v.removeEventListener('loadedmetadata', onMeta);
            v.removeEventListener('ended', onEnd);
        };
    }, [dragging, currentIdx]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.volume = volume;
        v.muted = muted;
    }, [volume, muted]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') handleClose();
            if (e.key === 'ArrowUp' || e.key === 'k') go(-1);
            if (e.key === 'ArrowDown' || e.key === 'j') go(1);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [currentIdx]);

    const handleClose = () => {
        setVisible(false);
        videoRef.current?.pause();
        setTimeout(onClose, 260);
    };

    const go = useCallback((dir) => {
        const next = currentIdx + dir;
        if (next >= 0 && next < videos.length) {
            videoRef.current?.pause();
            setPlaying(false);
            setCurrentIdx(next);
        }
    }, [currentIdx, videos.length]);

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setPlaying(true); }
        else { v.pause(); setPlaying(false); }
    };

    const seekToRatio = useCallback((ratio) => {
        const v = videoRef.current;
        if (!v || !v.duration) return;
        v.currentTime = Math.max(0, Math.min(1, ratio)) * v.duration;
        setProgress(Math.max(0, Math.min(1, ratio)) * 100);
    }, []);

    const getRatioFromEvent = (e) => {
        const bar = progressBarRef.current;
        if (!bar) return 0;
        const rect = bar.getBoundingClientRect();
        return (e.clientX - rect.left) / rect.width;
    };

    const handleProgressMouseDown = (e) => {
        e.stopPropagation();
        setDragging(true);
        seekToRatio(getRatioFromEvent(e));
        const onMove = (ev) => seekToRatio(getRatioFromEvent(ev));
        const onUp = () => { setDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const promptLogin = (action) => setLoginPrompt({ open: true, action });

    const handleLike = async () => {
        if (!isLoggedIn()) { promptLogin('like'); return; }
        if (likeLoading || !current?.id) return;
        const was = liked;
        const nextState = !was;
        const nextCount = was ? Math.max(0, likeCount - 1) : likeCount + 1;
        setLiked(nextState);
        setLikeCount(nextCount);
        if (current) {
            current.isLiked = nextState;
            current.likes = nextCount;
        }

        setLikeLoading(true);
        try {
            if (was) await unlikeVideo(current.id);
            else {
                await likeVideo(current.id);
                showSuccess('Đã thích video ❤️', `@${current.user?.username}`);
            }
        } catch {
            setLiked(was);
            setLikeCount(likeCount);
            if (current) {
                current.isLiked = was;
                current.likes = likeCount;
            }
        } finally {
            setLikeLoading(false);
        }
    };

    const handleBookmark = async () => {
        if (!isLoggedIn()) { promptLogin('bookmark'); return; }
        if (!current?.id) return;

        const videoId = current.id;
        const wasBk = Boolean(bookmarked);
        const nextBk = !wasBk;
        const nextCount = wasBk ? Math.max(0, bookmarkCount - 1) : bookmarkCount + 1;

        // Optimistic UI updates
        setBookmarkMap(prev => ({ ...prev, [videoId]: nextBk }));
        setBookmarkCountMap(prev => ({ ...prev, [videoId]: nextCount }));
        if (current) {
            current.isBookmarked = nextBk;
            current.bookmarks = nextCount;
        }

        try {
            const { toggleBookmark: toggleBookmarkApi } = await import('../../services/bookmarkService');
            const res = await toggleBookmarkApi(videoId);
            const serverBk = res.bookmarked;
            setBookmarkMap(prev => ({ ...prev, [videoId]: serverBk }));
            if (current) current.isBookmarked = serverBk;

            if (serverBk) showSuccess('Đã lưu video', 'Thêm vào danh sách lưu');
            else showInfo('Đã bỏ lưu', 'Xóa khỏi danh sách lưu');
        } catch {
            setBookmarkMap(prev => ({ ...prev, [videoId]: wasBk }));
            setBookmarkCountMap(prev => ({ ...prev, [videoId]: bookmarkCount }));
            if (current) {
                current.isBookmarked = wasBk;
                current.bookmarks = bookmarkCount;
            }
            showError('Lỗi', 'Không thể lưu video');
        }
    };

    const handleShareOpen = () => {
        setShareOpen(true);
    };

    const handleShareDone = () => {
        if (!current?.id) return;
        const videoId = current.id;
        setShareCountMap(prev => ({ ...prev, [videoId]: (prev[videoId] || 0) + 1 }));
        if (current) current.shares = (current.shares || 0) + 1;
        shareVideoApi(videoId).catch(() => {
            setShareCountMap(prev => ({ ...prev, [videoId]: Math.max(0, (prev[videoId] || 1) - 1) }));
        });
    };

    const handleRepost = async () => {
        if (!isLoggedIn()) { promptLogin('repost'); return; }
        if (!current?.id) return;
        const videoId = current.id;
        const was = reposted;
        setRepostMap(prev => ({ ...prev, [videoId]: !was }));
        try {
            const res = await repostVideoApi(videoId);
            const serverReposted = res.data.reposted;
            setRepostMap(prev => ({ ...prev, [videoId]: serverReposted }));
            if (current) current.isReposted = serverReposted;

            if (serverReposted) {
                showSuccess('Đã đăng lại!', `Video của @${current.user?.username}`);
            } else {
                showInfo('Đã bỏ đăng lại', 'Xóa khỏi danh sách đăng lại');
            }
        } catch {
            setRepostMap(prev => ({ ...prev, [videoId]: was }));
            showError('Lỗi', 'Không thể đăng lại video này');
        }
    };

    const handleFollowToggle = async () => {
        if (!current?.user?.username || followLoading) return;
        const username = current.user.username;
        const was = followMap[username] ?? false;
        setFollowMap(prev => ({ ...prev, [username]: !was }));

        setFollowLoading(true);
        try {
            if (was) await unfollowUser(username);
            else     await followUser(username);
        } catch {
            setFollowMap(prev => ({ ...prev, [username]: was }));
        } finally {
            setFollowLoading(false);
        }
    };

    const fmtTime = (sec) => {
        if (!sec || isNaN(sec)) return '0:00';
        return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
    };
    const currentSec = duration ? (progress / 100) * duration : 0;

    const isSlideshow = (() => {
        if (!current?.videoUrl) return false;
        if (Array.isArray(current.videoUrl)) return true;
        if (typeof current.videoUrl === 'string') {
            const trimmed = current.videoUrl.trim();
            return (trimmed.startsWith('[') && trimmed.endsWith(']'));
        }
        return false;
    })();

    const imagesArray = (() => {
        if (!isSlideshow) return [];
        try {
            const parsed = Array.isArray(current.videoUrl) ? current.videoUrl : JSON.parse(current.videoUrl);
            return parsed.map((url, i) => ({ id: String(i), url }));
        } catch {
            return [];
        }
    })();

    if (!current) return null;

    return (
        <div
            className="fixed inset-0 z-[300] flex items-stretch"
            style={{
                background: 'rgba(0,0,0,0.92)',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.26s ease',
            }}
        >
            {/* LEFT: Close + Video */}
            <div
                className="flex flex-col items-center justify-center"
                style={{
                    background: '#000',
                    width: '100%',
                    maxWidth: 'calc(100vw - 400px)',
                    minWidth: 0,
                    position: 'relative',
                }}
            >
                <button
                    onClick={handleClose}
                    className="absolute top-5 left-5 z-20 flex items-center gap-2 border-none cursor-pointer transition-all"
                    style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 14px', color: '#ffffff', backdropFilter: 'blur(8px)' }}
                >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M2.5 2.5l10 10M12.5 2.5L2.5 12.5" />
                    </svg>
                </button>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2.5">
                    <NavBtn direction="up" onClick={() => go(-1)} disabled={currentIdx === 0} />
                    <NavBtn direction="down" onClick={() => go(1)} disabled={currentIdx === videos.length - 1} />
                </div>

                <div
                    className="relative overflow-hidden"
                    style={{
                        aspectRatio: aspectRatio,
                        height: 'calc(100vh - 0px)',
                        maxHeight: '100vh',
                        maxWidth: '100%',
                        margin: '0 auto',
                        background: '#0a0a0a',
                    }}
                >
                    {isSlideshow ? (
                        <div className="absolute inset-0 w-full h-full z-[1]">
                            <ImageSlideshow
                                images={imagesArray}
                                autoPlay={true}
                                duration={3000}
                            />
                        </div>
                    ) : current.videoUrl ? (
                        <video
                            ref={videoRef}
                            src={current.videoUrl}
                            loop
                            playsInline
                            onClick={togglePlay}
                            onLoadedMetadata={(e) => {
                                const w = e.target.videoWidth;
                                const h = e.target.videoHeight;
                                if (w && h) setAspectRatio(w / h);
                            }}
                            className="w-full h-full cursor-pointer"
                            style={{ objectFit: 'contain' }}
                        />
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#1a0a2e,#0a0a1a)' }}
                            onClick={togglePlay}
                        >
                            <span className="text-5xl opacity-20">🎬</span>
                        </div>
                    )}

                    {!isSlideshow && !playing && (
                        <div
                            className="absolute inset-0 flex items-center justify-center cursor-pointer"
                            style={{ background: 'rgba(0,0,0,0.2)' }}
                            onClick={togglePlay}
                        >
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M5 3l14 9-14 9V3z" />
                                </svg>
                            </div>
                        </div>
                    )}

                    <div
                        className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-20 pointer-events-none"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
                    >
                        <p
                            className="font-semibold text-[15px] font-body mb-1 cursor-pointer hover:underline w-fit pointer-events-auto m-0"
                            style={{ color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                            onClick={() => { handleClose(); navigate(`/profile/${current.user?.username}`); }}
                        >
                            @{current.user?.username}
                        </p>
                    </div>

                    {/* Volume control */}
                    <div className="absolute top-3.5 right-12 flex items-center gap-2 z-10 px-3 py-2 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                        <button onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }} className="bg-transparent border-none text-white cursor-pointer text-base p-0">
                            {muted || volume === 0 ? '🔇' : '🔊'}
                        </button>
                        <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                            onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(parseFloat(e.target.value) === 0); }}
                            onClick={e => e.stopPropagation()}
                            className="w-16 h-1 accent-white cursor-pointer"
                        />
                    </div>

                    {/* Progress bar */}
                    <div
                        ref={progressBarRef}
                        className="absolute bottom-0 left-0 right-0 z-10 cursor-pointer"
                        style={{ height: 20, display: 'flex', alignItems: 'flex-end' }}
                        onMouseDown={handleProgressMouseDown}
                    >
                        <div
                            className="absolute bottom-5 text-[10px] text-white font-body px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap"
                            style={{
                                background: 'rgba(0,0,0,0.7)',
                                left: `${progress}%`,
                                transform: 'translateX(-50%)',
                                opacity: dragging ? 1 : 0,
                                transition: 'opacity 0.15s',
                            }}
                        >
                            {fmtTime(currentSec)} / {fmtTime(duration)}
                        </div>
                        <div style={{ width: '100%', height: dragging ? 5 : 3, background: 'rgba(255,255,255,0.2)', position: 'relative', transition: 'height 0.15s' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: '#ff2d78', transition: dragging ? 'none' : 'width 0.1s linear' }} />
                            <div style={{
                                position: 'absolute', top: '50%', left: `${progress}%`,
                                transform: 'translate(-50%,-50%)', width: 12, height: 12,
                                borderRadius: '50%', background: 'white', opacity: dragging ? 1 : 0,
                                transition: 'opacity 0.15s', pointerEvents: 'none',
                            }} />
                        </div>
                    </div>
                </div>

                {/* Video dots indicator */}
                {videos.length > 1 && (
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5 pointer-events-none" style={{ zIndex: 15 }}>
                        {videos.slice(Math.max(0, currentIdx - 4), Math.min(videos.length, currentIdx + 5)).map((_, i) => {
                            const realIdx = Math.max(0, currentIdx - 4) + i;
                            return (
                                <div key={realIdx} className="pointer-events-auto" onClick={() => { setCurrentIdx(realIdx); }}>
                                    <div style={{
                                        width: realIdx === currentIdx ? 20 : 6, height: 6,
                                        borderRadius: 3,
                                        background: realIdx === currentIdx ? '#ff2d78' : 'rgba(255,255,255,0.3)',
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                    }} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT: Info + Comments */}
            <div style={{ width: 400, minWidth: 400, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <RightPanel
                    video={current}
                    following={following}
                    onFollowToggle={handleFollowToggle}
                    onLike={handleLike}
                    liked={liked}
                    likeCount={likeCount}
                    bookmarked={bookmarked}
                    bookmarkCount={bookmarkCount}
                    onBookmark={handleBookmark}
                    shareCount={shareCount}
                    onShareOpen={handleShareOpen}
                    onClose={handleClose}
                    onPrivacyChange={onPrivacyChange}
                />
            </div>

            <LoginPromptModal
                open={loginPrompt.open}
                onClose={() => setLoginPrompt({ open: false, action: 'like' })}
                action={loginPrompt.action}
            />

            <ShareSheet
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                videoId={current.id}
                onShareDone={handleShareDone}
                onRepost={handleRepost}
                isReposted={reposted}
            />
        </div>
    );
}

function NavBtn({ direction, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.2 : 1,
                transition: 'all 0.15s ease',
            }}
        >
            {direction === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </button>
    );
}