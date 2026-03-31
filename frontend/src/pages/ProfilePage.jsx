import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout/PageLayout';
import CreatorCard from '../components/common/CreatorCard';
import Button from '../components/ui/Button';
import { SpinnerCenter } from '../components/ui/Spinner';
import FollowListModal from '../components/common/FollowListModal/FollowListModal';
import { useProfile } from '../hooks/useProfile';
import { getSuggestedUsers } from '../services/userService';
import { deleteVideo } from '../services/videoService';
import { formatCount } from '../utils/formatters';
import { getStoredUser } from '../utils/helpers';
import { BackIcon, ShareSmIcon } from '../icons/CommonIcons';

const TABS = ['Videos', 'Liked', 'Reposts'];

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const me = getStoredUser();

  const target = username || me?.username || me?.ten_dang_nhap || 'me';
  const { profile, videos, loading, following, toggleFollow, setProfile } = useProfile(target);

  const [activeTab, setActiveTab] = useState('Videos');
  const [suggests, setSuggests] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [localVideos, setLocalVideos] = useState([]);

  // Modal followers/following
  const [followModal, setFollowModal] = useState(null); // null | 'followers' | 'following'

  const isMyProfile =
    !username ||
    username === me?.username ||
    username === me?.ten_dang_nhap;

  // Đồng bộ localVideos khi videos từ hook thay đổi
  useEffect(() => {
    setLocalVideos(videos);
  }, [videos]);

  useEffect(() => {
    getSuggestedUsers({ limit: 5 })
      .then((r) => setSuggests(r.data.users.filter((u) => u.username !== target)))
      .catch(() => { });
  }, [target]);

  // Xóa video và cập nhật state ngay lập tức
  const handleDeleteVideo = async (videoId) => {
    try {
      await deleteVideo(videoId);
      // Cập nhật danh sách video
      setLocalVideos(prev => prev.filter(v => v.id !== videoId));
      // Cập nhật số đếm trên profile
      setProfile(p => ({
        ...p,
        videos: Math.max(0, (p.videos || 0) - 1),
      }));
      // Đóng modal nếu đang xem video bị xóa
      if (selectedVideo?.id === videoId) setSelectedVideo(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa video này');
    }
  };

  // Khi follow/unfollow từ modal → cập nhật số liệu profile
  const handleFollowToggleInModal = (delta) => {
    if (!profile) return;
    setProfile(p => ({ ...p, followers: Math.max(0, (p.followers || 0) + delta) }));
  };

  const rightPanel = (
    <div className="p-[18px]">
      <h3 className="text-text-secondary text-[13px] font-body mb-4 tracking-[0.3px]">
        Gợi ý theo dõi
      </h3>
      <div className="flex flex-col gap-1">
        {suggests.map((u) => (
          <CreatorCard key={u.id} user={u} layout="row" />
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <PageLayout rightPanel={rightPanel}>
        <SpinnerCenter text="Đang tải hồ sơ..." />
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full text-text-subtle font-body flex-col gap-3">
          <span className="text-4xl">👤</span>
          <p>Không tìm thấy người dùng</p>
        </div>
      </PageLayout>
    );
  }

  // Dùng localVideos.length thay vì profile.videos để luôn đồng bộ
  const displayVideoCount = localVideos.length;

  const stats = [
    { label: 'Videos', value: formatCount(displayVideoCount), clickable: false },
    { label: 'Follower', value: formatCount(profile.followers), clickable: true, modalType: 'followers' },
    { label: 'Đã follow', value: formatCount(profile.following), clickable: true, modalType: 'following' },
    { label: 'Thích', value: formatCount(profile.likes), clickable: false },
  ];

  return (
    <PageLayout rightPanel={rightPanel}>
      <div className="flex-1 overflow-auto">
        {/* Back bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border sticky top-0 bg-base z-10">
          <button
            onClick={() => navigate(-1)}
            className="bg-transparent border-none text-text-secondary cursor-pointer flex items-center gap-2 text-sm font-body hover:text-white transition-colors"
          >
            <BackIcon /> Quay lại
          </button>
          <span className="text-white text-[15px] font-semibold font-body flex-1 text-center">
            {profile.username}
          </span>
          <button className="bg-transparent border-none text-text-secondary cursor-pointer text-xl">
            ···
          </button>
        </div>

        {/* Cover */}
        <div className="relative">
          <div
            className="h-[180px] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#1a0a1e,#0d0d25 50%,#1a0a10)' }}
          >
            <div
              className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full"
              style={{ background: 'radial-gradient(circle,rgba(255,45,120,.15),transparent 70%)' }}
            />
          </div>

          {/* Avatar */}
          <div className="absolute bottom-[-45px] left-8 w-[90px] h-[90px] rounded-full bg-brand-gradient flex items-center justify-center text-[28px] font-bold text-white border-[3px] border-base">
            {profile.anh_dai_dien ? (
              <img src={profile.anh_dai_dien} alt={profile.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              profile.initials || profile.fullName?.slice(0, 2).toUpperCase()
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute bottom-[-42px] right-8 flex gap-2 items-center">
            {!isMyProfile && (
              <Button variant="ghost" size="sm">Nhắn tin</Button>
            )}
            {isMyProfile ? (
              <Button variant="ghost" size="sm">Chỉnh sửa hồ sơ</Button>
            ) : (
              <Button
                variant={following ? 'ghost' : 'primary'}
                size="sm"
                onClick={toggleFollow}
              >
                {following ? 'Đang follow' : 'Follow'}
              </Button>
            )}
            <button className="w-[34px] h-[34px] flex items-center justify-center bg-transparent border border-border2 rounded-md cursor-pointer text-text-secondary hover:border-primary/40 transition-colors">
              <ShareSmIcon />
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-8 pt-16 pb-5">
          <div className="flex items-baseline gap-2 mb-0.5">
            <h1 className="font-display font-bold text-[22px] text-white m-0">
              {profile.fullName}
            </h1>
            {profile.isCreator && (
              <span className="text-transparent bg-clip-text bg-brand-gradient text-[13px] font-semibold font-body">
                ✦ Creator
              </span>
            )}
          </div>

          <p className="text-text-faint text-[13px] font-body mb-3">
            @{profile.username}
            {profile.location && ` · ${profile.location}`}
          </p>

          {profile.bio && (
            <p className="text-text-secondary text-[13px] font-body leading-relaxed max-w-[480px] mb-4">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-0">
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                <div
                  className={`flex flex-col items-center px-5 first:pl-0
                    ${s.clickable ? 'cursor-pointer group' : ''}`}
                  onClick={s.clickable ? () => setFollowModal(s.modalType) : undefined}
                >
                  <p className={`font-display font-bold text-[20px] m-0 mb-0.5 transition-colors
                    ${s.clickable ? 'text-white group-hover:text-primary' : 'text-white'}`}>
                    {s.value}
                  </p>
                  <p className={`text-xs font-body m-0 transition-colors
                    ${s.clickable ? 'text-text-faint group-hover:text-primary/70' : 'text-text-faint'}`}>
                    {s.label}
                  </p>
                </div>
                {i < stats.length - 1 && (
                  <div className="w-px h-8 bg-border2 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`bg-transparent border-none px-5 py-3 text-sm font-body cursor-pointer transition-all border-b-2
                ${activeTab === tab ? 'text-white font-semibold border-primary' : 'text-text-faint border-transparent hover:text-text-secondary'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Videos grid */}
        <div className="p-3 grid grid-cols-5 gap-1">
          {activeTab === 'Videos' && (
            localVideos.length > 0 ? (
              localVideos.map((v) => (
                <VideoThumb
                  key={v.id}
                  video={v}
                  isOwner={isMyProfile}
                  onClick={() => setSelectedVideo(v)}
                  onDelete={handleDeleteVideo}
                />
              ))
            ) : (
              <div className="col-span-5 flex flex-col items-center justify-center py-16 gap-3 text-text-subtle font-body">
                <span className="text-[32px]">🎬</span>
                <p>{isMyProfile ? 'Bạn chưa đăng video nào' : 'Người dùng chưa đăng video nào'}</p>
                {isMyProfile && (
                  <Button onClick={() => navigate('/upload')}>Đăng video đầu tiên</Button>
                )}
              </div>
            )
          )}

          {activeTab !== 'Videos' && (
            <div className="col-span-5 flex flex-col items-center justify-center py-16 gap-3 text-text-subtle font-body">
              <span className="text-[32px]">🔒</span>
              <p>Tính năng đang phát triển</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal xem video */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          isOwner={isMyProfile}
          onClose={() => setSelectedVideo(null)}
          onDelete={handleDeleteVideo}
        />
      )}

      {/* Modal follower/following */}
      {followModal && (
        <FollowListModal
          username={profile.username}
          type={followModal}
          onClose={() => setFollowModal(null)}
          onTabChange={(t) => setFollowModal(t)}
        />
      )}
    </PageLayout>
  );
}

/* ── VideoThumb ── */
function VideoThumb({ video, isOwner, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hue = (parseInt(video.id?.slice(-2) ?? '0', 16) || 0) % 360;

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Tự reset sau 3s nếu không xác nhận
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    await onDelete(video.id);
    setDeleting(false);
  };

  return (
    <div
      className="relative rounded cursor-pointer overflow-hidden transition-transform duration-200"
      style={{
        aspectRatio: '9/16',
        background: `linear-gradient(135deg,hsl(${hue},25%,10%),hsl(${(hue + 60) % 360},15%,6%))`,
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      onClick={onClick}
    >
      {video.thumbnail && (
        <img
          src={video.thumbnail}
          alt={video.caption}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Hover overlay */}
      {hovered && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-white text-2xl">▶</span>
        </div>
      )}

      {/* Nút xóa — chỉ hiện khi là chủ và hover */}
      {isOwner && hovered && (
        <button
          onClick={handleDeleteClick}
          disabled={deleting}
          className={`
            absolute top-1.5 right-1.5 z-10 text-[10px] font-bold font-body
            px-2 py-1 rounded border-none cursor-pointer transition-all
            disabled:opacity-50
            ${confirmDelete
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-black/60 text-white/80 hover:bg-red-500 hover:text-white'
            }
          `}
        >
          {deleting ? '...' : confirmDelete ? 'Xác nhận?' : '🗑'}
        </button>
      )}

      <p className="absolute bottom-1.5 left-1.5 text-white text-[11px] font-semibold font-body m-0 drop-shadow">
        ▶ {formatCount(video.views || video.likes || 0)}
      </p>
    </div>
  );
}

/* ── VideoModal ── */
function VideoModal({ video, isOwner, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa video này không?')) return;
    setDeleting(true);
    await onDelete(video.id);
    setDeleting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex gap-0 bg-surface border border-border rounded-2xl overflow-hidden max-h-[90vh] shadow-2xl">
        {/* Video */}
        <div className="relative bg-black" style={{ width: 340, height: 620 }}>
          {video.videoUrl ? (
            <video src={video.videoUrl} autoPlay loop controls playsInline className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-faint flex-col gap-2">
              <span className="text-4xl">🎬</span>
              <p className="text-sm font-body">Không có video</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="w-[260px] flex flex-col p-5 overflow-auto border-l border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white shrink-0">
              {video.user?.initials || 'U'}
            </div>
            <div>
              <p className="text-white text-sm font-semibold font-body m-0">@{video.user?.username}</p>
              <p className="text-text-faint text-xs font-body m-0">{video.user?.fullName}</p>
            </div>
          </div>
          <p className="text-white/90 text-sm font-body leading-relaxed mb-4 flex-1">{video.caption}</p>
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 mb-4">
            {[
              { icon: '❤️', value: formatCount(video.likes), label: 'Thích' },
              { icon: '💬', value: formatCount(video.comments), label: 'Bình luận' },
              { icon: '👁️', value: formatCount(video.views), label: 'Xem' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-xl">{s.icon}</span>
                <span className="text-white text-sm font-bold font-body">{s.value}</span>
                <span className="text-text-faint text-[10px] font-body">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Nút xóa trong modal — chỉ hiện với chủ video */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-2 rounded-lg border border-red-500/40 text-red-400 bg-transparent text-[13px] font-semibold font-body cursor-pointer hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Đang xóa...' : '🗑 Xóa video'}
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 border-none text-white text-lg cursor-pointer flex items-center justify-center hover:bg-black/70 transition-colors z-10"
        >
          ×
        </button>
      </div>
    </div>
  );
}