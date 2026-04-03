import React, { createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

/* Phát custom event để PetVibeTok bắt và hiển thị qua bong bóng */
function dispatch(type, title, body, opts = {}) {
  window.dispatchEvent(new CustomEvent('vibetok:toast', {
    detail: { type, title, body, ...opts },
  }));
}

export function ToastProvider({ children }) {
  const showSuccess = useCallback((title, body, opts = {}) =>
    dispatch('success', title, body, opts), []);

  const showError = useCallback((title, body, opts = {}) =>
    dispatch('error', title, body, opts), []);

  const showWarning = useCallback((title, body, opts = {}) =>
    dispatch('warning', title, body, opts), []);

  const showInfo = useCallback((title, body, opts = {}) =>
    dispatch('info', title, body, opts), []);

  const showToast = useCallback((opts) =>
    dispatch('message', opts.title, opts.body, opts), []);

  const showMessageToast = useCallback(({ senderName, content, avatar, initials, username }) => {
    dispatch('message', senderName || username || 'Tin nhắn mới', content, {
      avatar,
      initials: initials || (senderName || 'U').charAt(0).toUpperCase(),
      action: username ? () => { window.location.href = `/messages/${username}`; } : undefined,
    });
  }, []);

  const dismiss = useCallback(() => { }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, showMessageToast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}