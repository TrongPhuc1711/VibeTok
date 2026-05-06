import React, { useState, useEffect, useRef } from 'react';

/**
 * MentionDropdown — Popup hiện danh sách user khi gõ @
 * Props:
 *   users      – [{ id, username, fullName, anh_dai_dien, isFollowing }]
 *   loading    – boolean
 *   visible    – boolean
 *   onSelect   – (user) => void
 *   onClose    – () => void
 *   query      – string (keyword đang search)
 */
export default function MentionDropdown({ users = [], loading, visible, onSelect, onClose, query = '' }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef(null);

  useEffect(() => { setActiveIdx(0); }, [users]);

  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, users.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && users.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        onSelect(users[activeIdx]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [visible, users, activeIdx, onSelect, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[activeIdx];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!visible) return null;

  const highlightMatch = (text) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ color: '#ff2d78', fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        marginBottom: 6,
        background: 'rgba(30, 30, 40, 0.98)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14,
        maxHeight: 260,
        overflow: 'auto',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
        zIndex: 100,
        padding: '6px 0',
      }}
      ref={listRef}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        padding: '6px 14px 8px',
        fontSize: 11,
        color: 'rgba(255,255,255,0.35)',
        fontFamily: 'var(--font-body, Inter, sans-serif)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>@</span>
        <span>Nhắc đến người dùng</span>
      </div>

      {loading ? (
        <div style={{ padding: '16px 14px', textAlign: 'center' }}>
          <div style={{
            width: 20, height: 20,
            border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: '#ff2d78',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            margin: '0 auto',
          }} />
        </div>
      ) : users.length === 0 ? (
        <div style={{
          padding: '16px 14px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 13,
          fontFamily: 'var(--font-body, Inter, sans-serif)',
        }}>
          Không tìm thấy người dùng
        </div>
      ) : (
        users.map((user, i) => (
          <div
            key={user.id}
            onClick={() => onSelect(user)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              cursor: 'pointer',
              background: i === activeIdx ? 'rgba(255,255,255,0.08)' : 'transparent',
              transition: 'background 0.15s',
            }}
            onMouseEnter={() => setActiveIdx(i)}
          >
            {/* Avatar */}
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              flexShrink: 0,
              overflow: 'hidden',
              background: user.anh_dai_dien ? undefined : `hsl(${(user.username?.charCodeAt(0) || 0) * 37 % 360}, 55%, 40%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
            }}>
              {user.anh_dai_dien
                ? <img src={user.anh_dai_dien} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user.username?.[0]?.toUpperCase() || 'U')
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {highlightMatch(user.username)}
              </div>
              {user.fullName && (
                <div style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'var(--font-body, Inter, sans-serif)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {highlightMatch(user.fullName)}
                </div>
              )}
            </div>

            {/* Following/Friends badge */}
            {(user.isMutual || user.isFollowing) && (
              <span style={{
                fontSize: 10,
                color: user.isMutual ? '#ff2d78' : 'rgba(255,255,255,0.35)',
                background: user.isMutual ? 'rgba(255, 45, 120, 0.15)' : 'rgba(255,255,255,0.06)',
                padding: '2px 8px',
                borderRadius: 20,
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                flexShrink: 0,
                fontWeight: user.isMutual ? 600 : 'normal',
                border: user.isMutual ? '1px solid rgba(255, 45, 120, 0.3)' : 'none',
              }}>
                {user.isMutual ? 'Bạn bè' : 'Đang follow'}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}
