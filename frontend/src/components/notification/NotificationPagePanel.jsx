import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { formatTimeAgo } from '../../utils/formatters';
import {
  LikeNotifIcon,
  CommentNotifIcon,
  FollowNotifIcon,
  MentionNotifIcon,
  DuetNotifIcon,
} from '../../icons/NotificationIcons';
import VideoDetailOverlay from '../video/VideoDetailOverlay/VideoDetailOverlay';

/* ── Tab & chip config ── */
const TABS = [
  { key: 'all',     label: 'Tất cả hoạt động' },
  { key: 'like',    label: 'Thích'             },
  { key: 'comment', label: 'Bình luận'          },
];

const FILTER_CHIPS = [
  { key: 'mention', label: 'Lượt nhắc đến và lượt gắn thẻ' },
  { key: 'follow',  label: 'Follower'                        },
];

const TYPE_CONFIG = {
  like:    { BadgeIcon: LikeNotifIcon,    color: '#ff2d78', bg: '#ff2d7820', text: 'đã thích video của bạn'            },
  follow:  { BadgeIcon: FollowNotifIcon,  color: '#3b82f6', bg: '#3b82f620', text: 'đã bắt đầu theo dõi bạn'           },
  comment: { BadgeIcon: CommentNotifIcon, color: '#10b981', bg: '#10b98120', text: 'đã bình luận về video của bạn'      },
  mention: { BadgeIcon: MentionNotifIcon, color: '#f59e0b', bg: '#f59e0b20', text: 'đã nhắc đến bạn trong bình luận'   },
  duet:    { BadgeIcon: DuetNotifIcon,    color: '#7c3aed', bg: '#7c3aed20', text: 'đã tạo duet với video của bạn'      },
};

/* ── Group by time ── */
function groupNotifications(list) {
  const now  = Date.now();
  const DAY  = 86_400_000;
  const WEEK = 7 * DAY;
  const groups = { new: [], week: [], older: [] };
  list.forEach(n => {
    const diff = now - new Date(n.createdAt).getTime();
    if (diff < DAY)  groups.new.push(n);
    else if (diff < WEEK) groups.week.push(n);
    else groups.older.push(n);
  });
  return groups;
}

/* ── Main component ── */
export default function NotificationPagePanel({ onClose }) {
  const { notifications, unreadCount, loading, markAllRead, markRead } = useNotifications();
  const [activeTab,  setActiveTab]  = useState('all');
  const [activeChip, setActiveChip] = useState(null);

  /* Video overlay state */
  const [overlayVideoId,    setOverlayVideoId]    = useState(null);
  const [overlayHighlight,  setOverlayHighlight]  = useState(false);

  const filtered = notifications.filter(n => {
    if (activeTab === 'like'    && n.type !== 'like')    return false;
    if (activeTab === 'comment' && n.type !== 'comment') return false;
    if (activeChip === 'mention' && n.type !== 'mention') return false;
    if (activeChip === 'follow'  && n.type !== 'follow')  return false;
    return true;
  });

  const groups = groupNotifications(filtered);

  const handleItem = (notif) => {
    markRead(notif.id);
    if (notif.meta?.videoId) {
      /* Mở overlay — nếu là comment/mention thì highlight phần comment */
      setOverlayHighlight(notif.type === 'comment' || notif.type === 'mention');
      setOverlayVideoId(notif.meta.videoId);
    }
    /* follow notification không có video → không mở overlay */
  };

  return (
    <>
      <div
        className="flex flex-col h-screen bg-base border-r border-border shrink-0 overflow-hidden"
        style={{ width: 440 }}
      >
        {/* Header */}
        <div className="px-6 py-[18px] border-b border-border shrink-0">
          <h2 className="font-display font-bold text-[22px] text-white m-0 leading-none">
            Thông báo
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3.5 text-[13px] font-body font-medium border-none bg-transparent cursor-pointer transition-all relative
                ${activeTab === tab.key ? 'text-white' : 'text-text-faint hover:text-text-secondary'}`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t"/>
              )}
            </button>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-5 py-3 shrink-0 border-b border-border/50 flex-wrap">
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip.key}
              onClick={() => setActiveChip(activeChip === chip.key ? null : chip.key)}
              className={`text-[12px] font-body px-3.5 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap
                ${activeChip === chip.key
                  ? 'bg-white text-[#111] border-white font-semibold'
                  : 'bg-transparent border-[#2a2a3e] text-text-secondary hover:border-[#3a3a4e]'}`}
            >
              {chip.label}
            </button>
          ))}

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="ml-auto text-[11px] font-body text-primary bg-transparent border-none cursor-pointer whitespace-nowrap hover:underline"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <LoadingSkeleton/>
          ) : filtered.length === 0 ? (
            <EmptyState/>
          ) : (
            <>
              {groups.new.length   > 0 && <NotifGroup label="Mới"      items={groups.new}   onItemClick={handleItem}/>}
              {groups.week.length  > 0 && <NotifGroup label="Tuần này" items={groups.week}  onItemClick={handleItem}/>}
              {groups.older.length > 0 && <NotifGroup label="Trước đây" items={groups.older} onItemClick={handleItem}/>}
            </>
          )}
        </div>
      </div>

      {/* ── Video Detail Overlay ── */}
      {overlayVideoId && ReactDOM.createPortal(
        <VideoDetailOverlay
          videoId={overlayVideoId}
          highlightComment={overlayHighlight}
          onClose={() => { setOverlayVideoId(null); setOverlayHighlight(false); }}
        />,
        document.body
      )}
    </>
  );
}

/* ── Group wrapper ── */
function NotifGroup({ label, items, onItemClick }) {
  return (
    <div>
      <p className="px-5 pt-4 pb-1.5 text-[13px] font-semibold font-body text-text-secondary">
        {label}
      </p>
      {items.map(n => <NotifItem key={n.id} notif={n} onClick={onItemClick}/>)}
    </div>
  );
}

/* ── Single item ── */
function NotifItem({ notif, onClick }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.like;
  const name = notif.actor?.fullName || notif.actor?.username || 'Ai đó';
  const { BadgeIcon } = cfg;
  const hasVideo = !!notif.meta?.videoId;

  return (
    <div
      onClick={() => onClick(notif)}
      className={`flex items-center gap-3 px-5 py-3.5 transition-colors
        ${hasVideo ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}
        ${!notif.read ? 'bg-primary/[0.03]' : ''}`}
    >
      {/* Avatar + badge */}
      <div className="relative shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-bold text-white overflow-hidden"
          style={{ background: notif.actor?.color || 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}
        >
          {notif.actor?.anh_dai_dien
            ? <img src={notif.actor.anh_dai_dien} alt="" className="w-full h-full object-cover"/>
            : (notif.actor?.initials || 'U')}
        </div>
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-base"
          style={{ background: cfg.bg }}
        >
          <BadgeIcon color={cfg.color}/>
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-body leading-snug m-0">
          <span className="text-white font-semibold">{name}</span>
          <span className="text-text-secondary"> {cfg.text}</span>
        </p>
        {notif.meta?.comment && (
          <p className="text-text-faint text-[12px] font-body mt-0.5 truncate">
            "{notif.meta.comment}"
          </p>
        )}
        <p className="text-text-subtle text-[11px] font-body mt-0.5">
          {formatTimeAgo(notif.createdAt)}
        </p>
      </div>

      {/* Video thumb — hiển thị nút xem nếu có videoId */}
      {hasVideo ? (
  <div className="relative w-10 h-14 rounded shrink-0 overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#0a0a1a] border border-border2 group">
    {notif.meta?.videoThumb ? (
      <img
        src={notif.meta.videoThumb}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-[13px]">🎬</div>
    )}
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M5 3l14 9-14 9V3z"/>
      </svg>
    </div>
  </div>
) : null}

      {/* Unread dot */}
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-start mt-2"/>
      )}
    </div>
  );
}

/* ── Loading skeleton ── */
function LoadingSkeleton() {
  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-border2 shrink-0"/>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 rounded-full bg-border2 w-3/4"/>
            <div className="h-2.5 rounded-full bg-border2/60 w-1/2"/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-text-subtle">
      <p className="text-[13px] font-body">Chưa có thông báo nào</p>
    </div>
  );
}