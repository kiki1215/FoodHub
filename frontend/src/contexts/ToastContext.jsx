import { createContext, useCallback, useMemo, useState } from 'react';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info', duration = 3500) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      success: (msg) => showToast(msg, 'success'),
      error: (msg) => showToast(msg, 'error', 4500),
      info: (msg) => showToast(msg, 'info'),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-20 z-50 flex max-w-sm flex-col gap-2.5">
        {toasts.map((t) => {
          const styles =
            t.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : t.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-[#F4E5D7] bg-white text-[#262626]';
          return (
            <div
              key={t.id}
              role="alert"
              className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg transition-all ${styles}`}
            >
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="ml-2 text-xs font-bold opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
