import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.2" />
      <path d="M5 8l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.2" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13.5H1.5L8 2Z" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 6.5v3M8 11v.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#3b82f6" fillOpacity="0.15" stroke="#3b82f6" strokeWidth="1.2" />
      <path d="M8 7v4M8 5.5v.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  message: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.5 10a1 1 0 01-1 1H5L2.5 13.5V3a1 1 0 011-1h9a1 1 0 011 1V10z" fill="#ff2d78" fillOpacity="0.15" stroke="#ff2d78" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
};

const ACCENT = {
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  message: '#ff2d78',
};

let _idCounter = 0;
const genId = () => `toast_${++_idCounter}`;

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 320);
  }, [exiting, onRemove, toast.id]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const duration = toast.duration ?? 4000;
    timerRef.current = setTimeout(dismiss, duration);
    return () => clearTimeout(timerRef.current);
  }, []);

  const accent = ACCENT[toast.type] || ACCENT.info;
  const icon = ICONS[toast.type] || ICONS.info;

  return (
    <div
      style={{
        transform: visible && !exiting ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.92)',
        opacity: visible && !exiting ? 1 : 0,
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.32s ease',
        pointerEvents: 'all',
      }}
    >
      <div
        className="relative flex items-start gap-3 px-4 py-3.5 rounded-xl cursor-pointer select-none"
        style={{
          background: 'rgba(17,17,24,0.97)',
          border: `1px solid ${accent}30`,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
          minWidth: 280,
          maxWidth: 360,
        }}
        onClick={dismiss}
        onMouseEnter={() => clearTimeout(timerRef.current)}
        onMouseLeave={() => {
          timerRef.current = setTimeout(dismiss, 1500);
        }}
      >
        {/* Accent bar */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
          style={{ background: accent }}
        />

        {/* Icon */}
        <div className="shrink-0 mt-0.5">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p
              className="font-semibold text-[13px] font-body leading-tight m-0"
              style={{ color: '#fff' }}
            >
              {toast.title}
            </p>
          )}
          {toast.body && (
            <p
              className="text-[12px] font-body leading-relaxed m-0 mt-0.5"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {toast.body}
            </p>
          )}
        </div>

        {/* Close */}
        <button
          className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full transition-colors border-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 1l6 6M7 1L1 7" />
          </svg>
        </button>

        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl overflow-hidden"
          style={{ background: `${accent}20` }}
        >
          <div
            className="h-full rounded-b-xl"
            style={{
              background: accent,
              width: '100%',
              transformOrigin: 'left',
              animation: `toastProgress ${toast.duration ?? 4000}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      className="fixed z-[9999] flex flex-col gap-2.5 pointer-events-none"
      style={{
        bottom: 24,
        right: 20,
      }}
    >
      <style>{`
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, title, body, opts = {}) => {
    const id = genId();
    setToasts((prev) => {
      // Max 5 toasts at a time
      const next = [...prev, { id, type, title, body, ...opts }];
      return next.slice(-5);
    });
    return id;
  }, []);

  const showSuccess = useCallback((title, body, opts) => addToast('success', title, body, opts), [addToast]);
  const showError = useCallback((title, body, opts) => addToast('error', title, body, opts), [addToast]);
  const showWarning = useCallback((title, body, opts) => addToast('warning', title, body, opts), [addToast]);
  const showInfo = useCallback((title, body, opts) => addToast('info', title, body, opts), [addToast]);

  const showToast = useCallback((opts) => {
    const { type = 'info', title, body, ...rest } = opts;
    return addToast(type, title, body, rest);
  }, [addToast]);

  const showMessageToast = useCallback(({ senderName, content, avatar, initials, username }) => {
    addToast('message', senderName || username || 'Tin nhắn mới', content, {
      duration: 5000,
      action: username ? () => { window.location.href = `/messages/${username}`; } : undefined,
    });
  }, [addToast]);

  const dismiss = useCallback((id) => {
    if (id) removeToast(id);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, showMessageToast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}