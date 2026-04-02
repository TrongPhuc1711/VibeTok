import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function MessageToast({ toast, onDismiss }) {
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 280);
  };

  const handleClick = () => {
    if (toast.action) toast.action();
    dismiss();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#111118',
        border: '1px solid #1e1e2e',
        borderLeft: '3px solid #ff2d78',
        borderRadius: 12,
        padding: '10px 14px',
        cursor: toast.action ? 'pointer' : 'default',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        minWidth: 280,
        maxWidth: 340,
        transform: exiting ? 'translateX(110%)' : 'translateX(0)',
        opacity: exiting ? 0 : 1,
        transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1), opacity 0.28s ease',
        animation: 'toastIn 0.28s cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'linear-gradient(135deg,#ff2d78,#ff6b35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {toast.avatar
          ? <img src={toast.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : toast.initials
        }
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.3 }}>
          {toast.title}
        </p>
        {toast.body && (
          <p style={{
            margin: '2px 0 0',
            fontSize: 12,
            color: '#777',
            fontFamily: 'DM Sans, sans-serif',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}>
            {toast.body}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={e => { e.stopPropagation(); dismiss(); }}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#444',
          cursor: 'pointer',
          fontSize: 16,
          padding: '0 2px',
          lineHeight: 1,
          flexShrink: 0,
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

  const showToast = useCallback(({ title, body, avatar, initials, action, duration = 5000 }) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, title, body, avatar, initials, action }]);
    timerRef.current[id] = setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, _exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, duration);
    return id;
  }, []);

  const showMessageToast = useCallback(({ senderName, content, avatar, initials, username }) => {
    showToast({
      title: senderName || username || 'Tin nhắn mới',
      body: content,
      avatar,
      initials: initials || (senderName || 'U').charAt(0).toUpperCase(),
      action: username ? () => window.location.hash = `/messages?u=${username}` : undefined,
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showMessageToast, dismiss }}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}>
        <style>{`@keyframes toastIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <MessageToast toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}