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
import { ShareSmIcon }       from '../icons/CommonIcons';

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
  const [feedModalIndex, setFeedModalIndex] = useState(null);
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

  const handleDeleteVideo = async (videoId) => {
    try {
      await deleteVideo(videoId);
      setLocalVideos(prev => prev.filter(v => v.id !== videoId));
      setProfile(p => ({ ...p, videos: Math.max(0, (p.videos || 0) - 1) }));
      if (feedModalIndex !== null && localVideos[feedModalIndex]?.id === videoId) {
        setFeedModalIndex(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa video này');
    }
  };

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

  /* Desktop right panel */
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
    { label: 'Đang theo', value: formatCount(profile.following), clickable: true, modalType: 'following' },
    { label: 'Thích',     value: formatCount(profile.likes),     clickable: false },
  ];

  return (
    <PageLayout rightPanel={rightPanel}>
      <div className="flex-1 overflow-auto">

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-base z-10">
          <button
            onClick={() => navigate(-1)}
            className="md:flex hidden bg-transparent border-none text-text-secondary cursor-pointer items-center gap-2 text-sm font-body hover:text-white transition-colors"
          >
            ← Quay lại
          </button>
          <span className="text-white text-[16px] font-semibold font-body flex-1 text-center md:text-center">
            {profile.username}
          </span>
          {/* Share button */}
          <button className="bg-transparent border-none text-text-secondary cursor-pointer text-xl w-8 h-8 flex items-center justify-center">
            ···
          </button>
        </div>

        {/* ── Cover / Header ── */}
        <div className="relative">
          <div
            className="relative overflow-hidden"
            style={{
              height: 120,
              background: 'linear-gradient(135deg,#1a0a1e,#0d0d25 50%,#1a0a10)',
            }}
          >
            <div className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full"
              style={{ background: 'radial-gradient(circle,rgba(255,45,120,.15),transparent 70%)' }} />
          </div>

          {/* Avatar */}
          <div
            className="absolute w-[78px] h-[78px] md:w-[90px] md:h-[90px] rounded-full bg-brand-gradient flex items-center justify-center font-bold text-white border-[3px] border-base overflow-hidden"
            style={{ bottom: -38, left: 16, fontSize: 24 }}
          >
            {profile.anh_dai_dien ? (
              <img src={profile.anh_dai_dien} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              profile.initials || profile.fullName?.slice(0, 2).toUpperCase()
            )}
          </div>

          {/* Action buttons top-right */}
          <div className="absolute flex gap-2 items-center" style={{ bottom: -38 + 4, right: 12 }}>
            {!isMyProfile && (
              <button
                onClick={() => navigate(`/messages?u=${profile.username}`)}
                className="px-3 py-1.5 rounded-lg border border-border2 text-text-secondary text-[12px] font-body bg-transparent cursor-pointer hover:text-white hover:border-white/30"
              >
                Nhắn tin
              </button>
            )}
            {isMyProfile ? (
              <button
                onClick={() => setEditOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-border2 text-text-secondary text-[12px] font-body bg-transparent cursor-pointer hover:text-white"
              >
                Chỉnh sửa
              </button>
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

        {/* ── Profile info ── */}
        <div className="px-4 pt-14 pb-4">
          <div className="flex items-baseline gap-2 mb-0.5">
            <h1 className="font-display font-bold text-[20px] md:text-[22px] text-white m-0">
              {profile.fullName}
            </h1>
            {profile.isCreator && (
              <span className="text-transparent bg-clip-text bg-brand-gradient text-[12px] font-semibold font-body">
                ✦Creator
              </span>
            )}
          </div>

          <p className="text-text-faint text-[13px] font-body mb-2">
            @{profile.username}
            {profile.location && ` · ${profile.location}`}
          </p>

          {profile.bio && (
            <p className="text-text-secondary text-[13px] font-body leading-relaxed max-w-[480px] mb-3">
              {profile.bio}
            </p>
          )}

          {/* Stats row - horizontal scroll on mobile */}
          <div className="flex items-center overflow-x-auto gap-0 pb-1" style={{ scrollbarWidth: 'none' }}>
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                <div
                  className={`flex flex-col items-center px-4 first:pl-0 shrink-0 ${s.clickable ? 'cursor-pointer' : ''}`}
                  onClick={s.clickable ? () => setFollowModal(s.modalType) : undefined}
                >
                  <p className={`font-display font-bold text-[18px] md:text-[20px] m-0 mb-0.5 ${s.clickable ? 'text-white' : 'text-white'}`}>
                    {s.value}
                  </p>
                  <p className="text-[11px] font-body m-0 text-text-faint whitespace-nowrap">
                    {s.label}
                  </p>
                </div>
                {i < stats.length - 1 && <div className="w-px h-7 bg-border2 mx-1 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-border px-2 md:px-8 sticky top-[49px] bg-base z-10">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none bg-transparent border-none px-3 md:px-5 py-3 text-[13px] font-body cursor-pointer transition-all border-b-2
                ${activeTab === tab
                  ? 'text-white font-semibold border-primary'
                  : 'text-text-faint border-transparent hover:text-text-secondary'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Video grid ── */}
        {/* Mobile: 3 columns, Desktop: 5 columns */}
        <div className="p-1 md:p-3 grid grid-cols-3 md:grid-cols-5 gap-0.5 md:gap-1">
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
              <div className="col-span-3 md:col-span-5 flex flex-col items-center justify-center py-16 gap-3 text-text-subtle font-body">
                <span className="text-4xl">🎬</span>
                <p className="text-sm">{isMyProfile ? 'Bạn chưa đăng video nào' : 'Người dùng chưa đăng video nào'}</p>
                {isMyProfile && (
                  <Button onClick={() => navigate('/upload')}>Đăng video đầu tiên</Button>
                )}
              </div>
            )
          ) : (
            <div className="col-span-3 md:col-span-5 flex flex-col items-center justify-center py-16 gap-3 text-text-subtle font-body">
              <p className="text-sm">Tính năng đang phát triển</p>
            </div>
          )}
        </div>

      </div>

      {feedModalIndex !== null && (
        <ProfileVideoFeedModal
          videos={localVideos}
          initialIndex={feedModalIndex}
          onClose={() => setFeedModalIndex(null)}
        />
      )}

      {followModal && (
        <FollowListModal
          username={profile.username}
          type={followModal}
          onClose={() => setFollowModal(null)}
          onTabChange={t => setFollowModal(t)}
        />
      )}

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