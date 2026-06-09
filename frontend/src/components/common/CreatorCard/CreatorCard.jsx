import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../Avatar/avatar';
import FollowButton from './FollowButton';
import { formatCount } from '../../../utils/formatters';
import { followUser, unfollowUser } from '../../../services/userService';
import { getStoredUser } from '../../../utils/helpers';
import { addFollowing, removeFollowing } from '../../../utils/following';
import { useToast } from '../../ui/Toast';

export default function CreatorCard({ user, layout = 'card' }) {
  const navigate = useNavigate();
  const me = getStoredUser();
  const { showSuccess, showInfo, showError } = useToast();

  const isSelf =
    me &&
    (String(me.id) === String(user.id) ||
      me.username === user.username ||
      me.ten_dang_nhap === user.username);

  const [following, setFollowing] = useState(user.isFollowing ?? false);
  const [followerCount, setFollowerCount] = useState(user.followers ?? 0);
  const [loading, setLoading] = useState(false);

  const goToProfile = () => navigate(`/profile/${user.username}`);

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (isSelf || loading) return;

    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerCount(n => wasFollowing ? Math.max(0, n - 1) : n + 1);
    if (wasFollowing) {
      removeFollowing(user.id);
    } else {
      addFollowing(user.id);
    }
    setLoading(true);

    try {
      if (wasFollowing) {
        await unfollowUser(user.username);
        showInfo('Đã bỏ follow', `@${user.username}`);
      } else {
        await followUser(user.username);
        showSuccess('Đã follow!', `Bạn đang theo dõi @${user.username}`);
      }
    } catch {
      setFollowing(wasFollowing);
      setFollowerCount(n => wasFollowing ? n + 1 : Math.max(0, n - 1));
      if (wasFollowing) {
        addFollowing(user.id);
      } else {
        removeFollowing(user.id);
      }
      showError('Thao tác thất bại', 'Không thể thực hiện, thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  if (layout === 'row') {
    return (
      <div className="flex items-center gap-3 py-2">
        <Avatar user={user} size="sm" onClick={goToProfile} />
        <div className="flex-1 min-w-0 cursor-pointer" onClick={goToProfile}>
          <p className="text-[#ddd] text-[13px] font-semibold font-body truncate m-0">
            {user.fullName}
          </p>
          <p className="text-text-faint text-xs font-body m-0">
            {formatCount(followerCount)} followers
          </p>
        </div>
        {!isSelf && (
          <FollowButton
            following={following}
            onClick={handleFollow}
            size="sm"
            disabled={loading}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-2 bg-surface border border-border rounded-xl p-5 min-w-[160px] cursor-pointer transition-colors hover:border-primary/30"
      onClick={goToProfile}
    >
      <Avatar user={user} size="md" />
      <p className="text-[#ddd] text-[13px] font-semibold font-body m-0 text-center">
        {user.fullName}
      </p>
      <p className="text-text-faint text-xs font-body m-0">@{user.username}</p>
      <p className="text-text-faint text-xs font-body m-0">
        {formatCount(followerCount)} followers
      </p>
      {!isSelf && (
        <div onClick={(e) => e.stopPropagation()}>
          <FollowButton
            following={following}
            onClick={handleFollow}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
}