import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parseHashtags, stripHashtags } from '../../../utils/formatters';

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
      // w-full, p-4 (padding đều các cạnh), pt-24 (kéo dài gradient lên trên một chút để chữ không bị chìm)
      // pointer-events-none để vùng gradient đen không vô tình chặn thao tác click/pause video của người dùng
      className="absolute bottom-0 left-0 w-full p-4 pt-24 z-10 flex flex-col gap-1.5 pointer-events-none"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
    >
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
          <span className="font-bold hover:underline cursor-pointer ml-1">
            {hashtags.map((h) => (
               <span key={h} className="text-white font-bold hover:underline cursor-pointer mr-1">
                 {h}
               </span>
            ))}
          </span>
        )}
      </div>

      {/*Music - Nếu bạn vẫn muốn giữ lại dòng nhạc đang phát */}
      {video?.music && (
        <div className="flex items-center gap-1.5 mt-1 pointer-events-auto cursor-pointer w-fit hover:underline">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-md"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          <span className="text-white text-[14px] font-medium drop-shadow-md">
            {video.music.title} – {video.music.artist}
          </span>
        </div>
      )}
    </div>
  );
}