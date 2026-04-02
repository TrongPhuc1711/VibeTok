import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import PageLayout              from '../components/layout/PageLayout/PageLayout';
import CreatorCard             from '../components/common/CreatorCard';
import Button                  from '../components/ui/Button';
import { SpinnerCenter }       from '../components/ui/Spinner';
import FollowListModal         from '../components/common/FollowListModal/FollowListModal';
import EditProfileModal        from '../components/profile/EditProfileModal/EditProfileModal';
import ProfileVideoFeedModal   from '../components/profile/ProfileVideoFeedModal';

import { useProfile }        from '../hooks/useProfile';
import { getSuggestedUsers } from '../services/userService';
import { deleteVideo }       from '../services/videoService';
import { formatCount }       from '../utils/formatters';
import { getStoredUser }     from '../utils/helpers';
import { BackIcon, ShareSmIcon } from '../icons/CommonIcons';

import VideoThumb from '../components/profile/VideoThumb';

const TABS = ['Videos', 'Liked', 'Reposts'];

export default function ProfilePage() {
  const { username } = useParams();
  const navigate     = useNavigate();
  const me           = getStoredUser();

  const target = username || me?.username || me?.ten_dang_nhap || 'me';
  const { profile, videos, loading, following, toggleFollow, setProfile } = useProfile(target);

  const [activeTab,    setActiveTab]    = useState('Videos');
  const [suggests,     setSuggests]     = useState([]);
  const [localVideos,  setLocalVideos]  = useState([]);

  // Feed modal state
  const [feedModalIndex, setFeedModalIndex] = useState(null); // null = đóng, number = mở

  // Modals
  const [followModal, setFollowModal] = useState(null);
  const [editOpen,    setEditOpen]    = useState(false);

  const isMyProfile =
    !username ||
    username === me?.username ||
    username === me?.ten_dang_nhap;

  useEffect(() => { setLocalVideos(videos); }, [videos]);

  useEffect(() => {
    getSuggestedUsers({ limit: 5 })
      .then(r => setSuggests(r.data.users.filter(u => u.username !== target)))
      .catch(() => {});
  }, [target]);

  /* ─── Xóa video ─── */
  const handleDeleteVideo = async (videoId) => {
    try {
      await deleteVideo(videoId);
      setLocalVideos(prev => prev.filter(v => v.id !== videoId));
      setProfile(p => ({ ...p, videos: Math.max(0, (p.videos || 0) - 1) }));
      // Nếu đang xem video bị xóa trong modal → đóng modal
      if (feedModalIndex !== null && localVideos[feedModalIndex]?.id === videoId) {
        setFeedModalIndex(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa video này');
    }
  };

  /* ─── Sau khi lưu edit profile ─── */
  const handleProfileSaved = (updatedUser) => {
    if (!updatedUser) return;
    setProfile(p => ({
      ...p,
      fullName:     updatedUser.fullName     || updatedUser.ten_hien_thi || p.fullName,
      bio:          updatedUser.bio          || updatedUser.tieu_su      || p.bio,
      location:     updatedUser.location     || updatedUser.vi_tri       || p.location,
      anh_dai_dien: updatedUser.anh_dai_dien || p.anh_dai_dien,
    }));
  };

  /* ─── Right panel ─── */
  const rightPanel = (
    <div className="p-[18px]">
      <h3 className="text-text-secondary text-[13px] font-body mb-4 tracking-[0.3px]">
        Gợi ý theo dõi
      </h3>
      <div className="flex flex-col gap-1">
        {suggests.map(u => <CreatorCard key={u.id} user={u} layout="row" />)}
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
          
          <p>Không tìm thấy người dùng</p>
        </div>
      </PageLayout>
    );
  }

  const displayVideoCount = localVideos.length;
  const stats = [
    { label: 'Videos',    value: formatCount(displayVideoCount), clickable: false },
    { label: 'Follower',  value: formatCount(profile.followers), clickable: true, modalType: 'followers' },
    { label: 'Đã follow', value: formatCount(profile.following), clickable: true, modalType: 'following' },
    { label: 'Thích',     value: formatCount(profile.likes),     clickable: false },
  ];

  return (
    <PageLayout rightPanel={rightPanel}>
      <div className="flex-1 overflow-auto">

        {/* ── Back bar ── */}
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

        {/* ── Cover ── */}
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
          <div className="absolute bottom-[-45px] left-8 w-[90px] h-[90px] rounded-full bg-brand-gradient flex items-center justify-center text-[28px] font-bold text-white border-[3px] border-base overflow-hidden">
            {profile.anh_dai_dien ? (
              <img src={profile.anh_dai_dien} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              profile.initials || profile.fullName?.slice(0, 2).toUpperCase()
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute bottom-[-42px] right-8 flex gap-2 items-center">
            {!isMyProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/messages?u=${profile.username}`)}
              >
                Nhắn tin
              </Button>
            )}
            {isMyProfile ? (
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                Chỉnh sửa hồ sơ
              </Button>
            ) : (
              <Button
                variant={following ? 'ghost' : 'primary'}
                size="sm"
                onClick={toggleFollow}
              >
                {following ? 'Đang follow' : 'Follow'}
              </Button>
            )}
          </div>
        </div>

        {/* ── Profile Info ── */}
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
                  className={`flex flex-col items-center px-5 first:pl-0 ${s.clickable ? 'cursor-pointer group' : ''}`}
                  onClick={s.clickable ? () => setFollowModal(s.modalType) : undefined}
                >
                  <p className={`font-display font-bold text-[20px] m-0 mb-0.5 transition-colors ${s.clickable ? 'text-white group-hover:text-primary' : 'text-white'}`}>
                    {s.value}
                  </p>
                  <p className={`text-xs font-body m-0 transition-colors ${s.clickable ? 'text-text-faint group-hover:text-primary/70' : 'text-text-faint'}`}>
                    {s.label}
                  </p>
                </div>
                {i < stats.length - 1 && <div className="w-px h-8 bg-border2 mx-1" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-border px-8">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`bg-transparent border-none px-5 py-3 text-sm font-body cursor-pointer transition-all border-b-2
                ${activeTab === tab
                  ? 'text-white font-semibold border-primary'
                  : 'text-text-faint border-transparent hover:text-text-secondary'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Video grid ── */}
        <div className="p-3 grid grid-cols-5 gap-1">
          {activeTab === 'Videos' ? (
            localVideos.length > 0 ? (
              localVideos.map((v, idx) => (
                <VideoThumb
                  key={v.id}
                  video={v}
                  isOwner={isMyProfile}
                  onClick={() => setFeedModalIndex(idx)}
                  onDelete={handleDeleteVideo}
                />
              ))
            ) : (
              <div className="col-span-5 flex flex-col items-center justify-center py-16 gap-3 text-text-subtle font-body">
                <p>{isMyProfile ? 'Bạn chưa đăng video nào' : 'Người dùng chưa đăng video nào'}</p>
                {isMyProfile && (
                  <Button onClick={() => navigate('/upload')}>Đăng video đầu tiên</Button>
                )}
              </div>
            )
          ) : (
            <div className="col-span-5 flex flex-col items-center justify-center py-16 gap-3 text-text-subtle font-body">
              
              <p>Tính năng đang phát triển</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Feed Modal (thay VideoModal cũ) ── */}
      {feedModalIndex !== null && (
        <ProfileVideoFeedModal
          videos={localVideos}
          initialIndex={feedModalIndex}
          onClose={() => setFeedModalIndex(null)}
        />
      )}

      {/* ── Follow List Modal ── */}
      {followModal && (
        <FollowListModal
          username={profile.username}
          type={followModal}
          onClose={() => setFollowModal(null)}
          onTabChange={t => setFollowModal(t)}
        />
      )}

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </PageLayout>
  );
}