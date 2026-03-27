import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../Avatar/avatar';
import FollowButton from './FollowButton';
import { formatCount } from '../../../utils/formatters';

/**
 * CreatorCard
 *
 * Props:
 *  user   – user object
 *  layout – 'card' | 'row'
 */
export default function CreatorCard({ user, layout = 'card' }) {
  const [following, setFollowing] = useState(false);
  const navigate = useNavigate();

  const goToProfile = () => navigate(`/profile/${user.username}`);

  if (layout === 'row') {
    return (
      <div className="flex items-center gap-3 py-2">
        <Avatar user={user} size="sm" onClick={goToProfile} />
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={goToProfile}
        >
          <p className="text-[#ddd] text-[13px] font-semibold font-body truncate m-0">
            {user.fullName}
          </p>
          <p className="text-text-faint text-xs font-body m-0">
            {formatCount(user.followers)} followers
          </p>
        </div>
        <FollowButton
          following={following}
          onClick={() => setFollowing((f) => !f)}
          size="sm"
        />
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
        {formatCount(user.followers)} followers
      </p>
      <div onClick={(e) => e.stopPropagation()}>
        <FollowButton
          following={following}
          onClick={() => setFollowing((f) => !f)}
        />
      </div>
    </div>
  );
}