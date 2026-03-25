import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCount } from '../../utils/formatters';

/* layout="card" | "row" */
export default function CreatorCard({ user, layout = 'card' }) {
  const [following, setFollowing] = useState(false);
  const navigate = useNavigate();

  if (layout === 'row') {
    return (
      <div className="flex items-center gap-3 py-2">
        <Avatar user={user} size="sm" onClick={() => navigate(`/profile/${user.username}`)} />
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${user.username}`)}>
          <p className="text-[#ddd] text-[13px] font-semibold font-body truncate m-0">{user.fullName}</p>
          <p className="text-text-faint text-xs font-body m-0">{formatCount(user.followers)} followers</p>
        </div>
        <FollowBtn following={following} onClick={() => setFollowing(f => !f)} small />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-2 bg-surface border border-border rounded-xl p-5 min-w-[160px] cursor-pointer transition-colors hover:border-primary/30"
      onClick={() => navigate(`/profile/${user.username}`)}
    >
      <Avatar user={user} size="md" />
      <p className="text-[#ddd] text-[13px] font-semibold font-body m-0 text-center">{user.fullName}</p>
      <p className="text-text-faint text-xs font-body m-0">@{user.username}</p>
      <p className="text-text-faint text-xs font-body m-0">{formatCount(user.followers)} followers</p>
      <div onClick={e => e.stopPropagation()}>
        <FollowBtn following={following} onClick={() => setFollowing(f => !f)} />
      </div>
    </div>
  );
}

function Avatar({ user, size, onClick }) {
  const cls = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-12 h-12 text-sm';
  return (
    <div
      onClick={onClick}
      className={`${cls} rounded-full bg-brand-gradient flex items-center justify-center font-bold text-white shrink-0`}
    >
      {user.initials || user.fullName?.slice(0, 2).toUpperCase() || 'U'}
    </div>
  );
}

function FollowBtn({ following, onClick, small }) {
  return (
    <button
      onClick={onClick}
      className={`rounded border font-semibold font-body transition-all cursor-pointer
        ${small ? 'text-[11px] px-2.5 py-1' : 'text-xs px-4 py-1.5 mt-1'}
        ${following
          ? 'border-border2 text-text-faint bg-transparent'
          : 'border-primary/50 text-primary bg-transparent hover:bg-primary/10'
        }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}