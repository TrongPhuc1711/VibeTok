//card video trong feed
import React, { useState } from 'react';
import { formatCount, parseHashtags, stripHashtags } from '../../utils/formatters';

export default function VideoCard({ video, isActive, onComment, onLike, onShare, onBookmark }) {
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [localLikes, setLocalLikes] = useState(video?.likes ?? 0);
    const [following, setFollowing] = useState(false);
    const user = video?.user ?? {};

    const handleLike = () => {
        const next = !liked;
        setLiked(next);
        setLocalLikes(p => next ? p + 1 : Math.max(0, p - 1));
        onLike?.(video.id, next);
    };

    const hashtags = parseHashtags(video?.caption ?? '');
    const captionText = stripHashtags(video?.caption ?? '');

    /* pastel background dựa trên id */
    const hue = (parseInt(video?.id?.slice(-3) ?? '0', 16) || 0) % 360;

    return (
        <div
            className="relative w-full h-full overflow-hidden flex items-center justify-center bg-base"
            style={{ background: `linear-gradient(135deg,hsl(${hue},30%,8%),hsl(${(hue + 60) % 360},20%,5%))` }}
        >
            {/* Decorative blobs */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% -10%,rgba(255,107,53,.15),transparent 50%)' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 90%,rgba(255,45,120,.12),transparent 50%)' }} />

            {/* Pause icon */}
            {!isActive && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <PlayIcon />
                </div>
            )}

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 pb-10"
                style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,.5),transparent)' }}>
                <div className="flex gap-5">
                    {['Following', 'For You', 'Live'].map(tab => (
                        <button key={tab} className={`bg-transparent border-none font-body text-[15px] cursor-pointer pb-1
              ${tab === 'For You' ? 'text-white font-bold border-b-2 border-white' : 'text-white/50 font-normal'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
                <SearchBtnIcon />
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-[60px] px-5 pt-20 pb-5"
                style={{ background: 'linear-gradient(to top,rgba(0,0,0,.8),transparent)' }}>
                <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-11 h-11 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white border-2 border-white/30">
                        {user.initials ?? 'U'}
                    </div>
                    <span className="text-white text-sm font-semibold font-body">@{user.username ?? 'user'}</span>
                    {user.isCreator && (
                        <span className="bg-brand-gradient text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Creator</span>
                    )}
                    <button
                        onClick={() => setFollowing(f => !f)}
                        className={`ml-1 border text-white text-xs px-3 py-0.5 rounded-sm cursor-pointer bg-transparent transition-colors
              ${following ? 'border-border2' : 'border-white/50'}`}
                    >
                        {following ? 'Following' : '+ Follow'}
                    </button>
                </div>

                <p className="text-white/90 text-sm font-body leading-relaxed m-0 mb-2">
                    {captionText}{' '}
                    {hashtags.map(h => <span key={h} className="text-primary font-medium">{h} </span>)}
                </p>

                {video?.music && (
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                        <span className="text-white/70 text-xs font-body">{video.music.title} – {video.music.artist} · Trending</span>
                    </div>
                )}
            </div>

            {/* Right actions */}
            <div className="absolute right-3 bottom-20 flex flex-col gap-[18px] items-center">
                {/* Avatar + follow */}
                <div className="relative mb-1">
                    <div className="w-11 h-11 rounded-full border-2 border-white/30 bg-brand-gradient flex items-center justify-center text-[13px] font-bold text-white">
                        {user.initials ?? 'U'}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm leading-none">+</div>
                </div>
                <ActionBtn icon={<HeartIcon filled={liked} />} count={formatCount(localLikes)} active={liked} onClick={handleLike} />
                <ActionBtn icon={<CommentIcon />} count={formatCount(video?.comments)} onClick={() => onComment?.(video.id)} />
                <ActionBtn icon={<ShareIcon />} count={formatCount(video?.shares)} onClick={() => onShare?.(video.id)} />
                <ActionBtn icon={<BookmarkIcon filled={bookmarked} />} count={formatCount(video?.bookmarks)} active={bookmarked} onClick={() => { setBookmarked(b => !b); onBookmark?.(video.id, !bookmarked); }} />
                {/* Disc */}
                <div className="w-[38px] h-[38px] rounded-full border-4 border-white/20 bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] flex items-center justify-center"
                    style={{ animation: 'spin 4s linear infinite' }}>
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                </div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/15">
                <div className="h-full w-[42%] bg-white/70" />
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}

function ActionBtn({ icon, count, active, onClick }) {
    return (
        <button onClick={onClick}
            className="bg-white/10 backdrop-blur-sm border-none rounded-full w-12 h-12 cursor-pointer flex flex-col items-center justify-center gap-0.5">
            {icon}
            <span className={`text-[11px] font-semibold font-body leading-none ${active ? 'text-primary' : 'text-white/80'}`}>{count}</span>
        </button>
    );
}

function HeartIcon({ filled }) {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? '#ff2d78' : 'none'} stroke={filled ? '#ff2d78' : 'rgba(255,255,255,.8)'} strokeWidth="1.5">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>;
}
function CommentIcon() {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>;
}
function ShareIcon() {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>;
}
function BookmarkIcon({ filled }) {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? '#ff2d78' : 'none'} stroke={filled ? '#ff2d78' : 'rgba(255,255,255,.8)'} strokeWidth="1.5">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>;
}
function PlayIcon() {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,.8)">
        <path d="M5 3l14 9-14 9V3z" />
    </svg>;
}
function SearchBtnIcon() {
    return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8.5" cy="8.5" r="6" />
        <path d="M14 14l4 4" />
    </svg>;
}