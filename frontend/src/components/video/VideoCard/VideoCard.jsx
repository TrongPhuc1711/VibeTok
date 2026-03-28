import React from 'react';
import VideoCardTopBar from './VideoCardTopBar';
import VideoCardInfo from './VideoCardInfo';
import VideoCardActions from './VideoCardActions';
import { VideoPlaySmIcon } from '../../../icons/CommonIcons';

/*
 VideoCard — card video fullscreen kiểu TikTok
 
 Props:
 video      – video object (xem mockData)
 isActive   – boolean
 onComment  – () => void
 onLike     – (id, liked) => void
 onShare    – (id) => void
 onBookmark – (id, bookmarked) => void
 */
export default function VideoCard({ video, isActive, onComment, onLike, onShare, onBookmark }) {
  /* pastel background dựa trên id */
  const hue = (parseInt(video?.id?.slice(-3) ?? '0', 16) || 0) % 360;

  return (
    <div
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-base"
      style={{
        background: `linear-gradient(135deg,hsl(${hue},30%,8%),hsl(${(hue + 60) % 360},20%,5%))`,
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% -10%,rgba(255,107,53,.15),transparent 50%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 80% 90%,rgba(255,45,120,.12),transparent 50%)',
        }}
      />

      {/* Pause overlay */}
      {!isActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center z-20">
          <VideoPlaySmIcon />
        </div>
      )}

      {/* Sub-components */}
      <VideoCardTopBar activeTab="For You" />
      <VideoCardInfo video={video} />
      <VideoCardActions
        video={video}
        onComment={onComment}
        onLike={onLike}
        onShare={onShare}
        onBookmark={onBookmark}
      />

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/15 z-10">
        <div className="h-full w-[42%] bg-white/70" />
      </div>
    </div>
  );
}