import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parseHashtags, stripHashtags } from '../../../utils/formatters';
import { MusicFilledIcon } from '../../../icons/CommonIcons';

/*
  VideoCardInfo — vùng thông tin góc dưới bên trái video (Chuẩn giao diện TikTok Web)
  Chỉ hiển thị Username, Caption và Hashtags. Lớp gradient mỏng, chữ có drop-shadow.
 */
export default function VideoCardInfo({ video }) {
  const navigate = useNavigate();

  const user = video?.user ?? {};
  const hashtags = parseHashtags(video?.caption ?? '');
  const captionText = stripHashtags(video?.caption ?? '');

  const handleNavigateToProfile = (e) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài làm dừng video
    if (user.username) {
      navigate(`/profile/${user.username}`);
    }
  };

  return (
    <div
      // pointer-events-none để vùng gradient đen không vô tình chặn thao tác click/pause video của người dùng
      className="absolute bottom-0 left-0 w-full px-4 pt-24 pb-20 md:pb-6 z-10 flex flex-col gap-1.5 pointer-events-none"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
    >
      {/* Badge "bạn bè đã đăng lại" */}
      {video?.repostedByFriend && (
        <div className="flex items-center gap-1.5 pointer-events-auto mb-0.5 animate-[fadeSlideUp_0.3s_ease-out]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <span className="text-white/70 text-[13px] font-body drop-shadow-md">
            <span
              className="font-semibold text-white/90 hover:underline cursor-pointer"
              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${video.repostedByFriend.username}`); }}
            >
              {video.repostedByFriend.fullName}
            </span>
            {' '}đã đăng lại
          </span>
        </div>
      )}

      {/* Tên người dùng */}
      {/* Phục hồi pointer-events-auto để user có thể click vào tên */}
      <h3 
        onClick={handleNavigateToProfile}
        className="text-white font-bold text-[17px] tracking-wide pointer-events-auto cursor-pointer drop-shadow-md hover:underline w-fit m-0"
      >
        {/* Ưu tiên hiển thị fullname hoặc displayName nếu có, không thì dùng username */}
        {user.fullName || user.username || "nguoi_dung_an_danh"}
      </h3>

      {/* Caption & Hashtags */}
      <div className="text-[#f1f1f2] text-[15px] font-normal leading-snug pointer-events-auto drop-shadow-md w-[90%]">
        {captionText}
        
        {/* Render hashtags sau caption */}
        {hashtags.length > 0 && (
          <span className="font-bold ml-1">
            {hashtags.map((h) => (
               <span 
                 key={h} 
                 className="text-white font-bold hover:underline cursor-pointer mr-1"
                 onClick={(e) => { e.stopPropagation(); navigate(`/tag/${h.replace('#', '')}`); }}
               >
                 {h}
               </span>
            ))}
          </span>
        )}
      </div>

      {/*Music - Nếu bạn vẫn muốn giữ lại dòng nhạc đang phát */}
      {video?.music && (
        <div className="flex items-center gap-1.5 mt-1 pointer-events-auto cursor-pointer w-fit hover:underline">
           <MusicFilledIcon size={14} className="text-white drop-shadow-md" />
          <span className="text-white text-[14px] font-medium drop-shadow-md">
            {video.music.title} – {video.music.artist}
          </span>
        </div>
      )}
    </div>
  );
}