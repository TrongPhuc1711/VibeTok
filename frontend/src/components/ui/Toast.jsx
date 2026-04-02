import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

/* ── Icon theo type ── */
function ToastIcon({ type }) {
  if (type === 'success') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#10b981" opacity="0.2" />
      <circle cx="8" cy="8" r="7" stroke="#10b981" strokeWidth="1.2" />
      <path d="M5 8l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (type === 'error') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#ef4444" opacity="0.2" />
      <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.2" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (type === 'warning') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13H1.5L8 2Z" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 6v3.5M8 11v.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (type === 'info') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#3b82f6" opacity="0.2" />
      <circle cx="8" cy="8" r="7" stroke="#3b82f6" strokeWidth="1.2" />
      <path d="M8 5v.5M8 7v4" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  // message / default
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#ff2d78" opacity="0.2" />
      <circle cx="8" cy="8" r="7" stroke="#ff2d78" strokeWidth="1.2" />
    </svg>
  );
}

const TYPE_CONFIG = {
  success: { accent: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
  error: { accent: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
  warning: { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  info: { accent: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
  message: { accent: '#ff2d78', bg: 'rgba(17,17,24,0.98)', border: 'rgba(30,30,46,1)' },
};

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.message;

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 280);
  };

  const handleClick = () => {
    if (toast.action) toast.action();
    dismiss();
  };

  const isMessage = toast.type === 'message';

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        background: isMessage ? cfg.bg : '#111118',
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.accent}`,
        borderRadius: 12,
        padding: '10px 14px',
        cursor: toast.action ? 'pointer' : 'default',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 0 ${cfg.accent}`,
        minWidth: 280,
        maxWidth: 360,
        transform: exiting ? 'translateX(110%)' : 'translateX(0)',
        opacity: exiting ? 0 : 1,
        transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1), opacity 0.28s ease',
        animation: 'toastIn 0.28s cubic-bezier(0.32,0.72,0,1)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Icon / Avatar */}
      {isMessage && toast.avatar ? (
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg,#ff2d78,#ff6b35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden',
        }}>
          <img src={toast.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : isMessage && toast.initials ? (
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg,#ff2d78,#ff6b35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {toast.initials}
        </div>
      ) : (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <ToastIcon type={toast.type} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 600,
          color: '#fff', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4,
        }}>
          {toast.title}
        </p>
        {toast.body && (
          <p style={{
            margin: '2px 0 0', fontSize: 12, color: '#888',
            fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {toast.body}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={e => { e.stopPropagation(); dismiss(); }}
        style={{
          background: 'transparent', border: 'none', color: '#444',
          cursor: 'pointer', fontSize: 16, padding: '0 2px',
          lineHeight: 1, flexShrink: 0, marginTop: -1,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timerRef.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, body, avatar, initials, action, duration = 4000 }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-5), { id, type, title, body, avatar, initials, action }]);
    timerRef.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  /* Shorthand helpers */
  const showSuccess = useCallback((title, body, opts = {}) =>
    addToast({ type: 'success', title, body, ...opts }), [addToast]);

  const showError = useCallback((title, body, opts = {}) =>
    addToast({ type: 'error', title, body, duration: 5000, ...opts }), [addToast]);

  const showWarning = useCallback((title, body, opts = {}) =>
    addToast({ type: 'warning', title, body, ...opts }), [addToast]);

  const showInfo = useCallback((title, body, opts = {}) =>
    addToast({ type: 'info', title, body, ...opts }), [addToast]);

  /* Backward-compat: showToast({ title, body, ... }) */
  const showToast = useCallback((opts) => addToast({ type: 'message', ...opts }), [addToast]);

  /* Message toast (inbox) */
  const showMessageToast = useCallback(({ senderName, content, avatar, initials, username }) => {
    addToast({
      type: 'message',
      title: senderName || username || 'Tin nhắn mới',
      body: content,
      avatar,
      initials: initials || (senderName || 'U').charAt(0).toUpperCase(),
      action: username ? () => { window.location.href = `/messages/${username}`; } : undefined,
      duration: 5000,
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, showMessageToast, dismiss }}>
      {children}

      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        <style>{`
          @keyframes toastIn {
            from { transform: translateX(110%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}