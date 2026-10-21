'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;
    warning: (message: string, title?: string) => string;
    info: (message: string, title?: string) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toastMethods = {
    success: (message: string, title = 'SUCCESS') =>
      addToast({ type: 'success', title, message }),
    error: (message: string, title = 'ERROR') =>
      addToast({ type: 'error', title, message }),
    warning: (message: string, title = 'WARNING') =>
      addToast({ type: 'warning', title, message }),
    info: (message: string, title = 'NOTIFICATION') =>
      addToast({ type: 'info', title, message })
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastMethods }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Editorial Toast Notification Item
 */
export const Toast: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const borderStyles = {
    success: 'border-l-4 border-l-[#2F7D5B]',
    error: 'border-l-4 border-l-[#C0453A]',
    warning: 'border-l-4 border-l-[#D98A1F]',
    info: 'border-l-4 border-l-[#111111]'
  }[toast.type];

  const badgeConfig = {
    success: { bg: 'bg-[#2F7D5B]', text: 'text-white', label: 'MATCH' },
    error: { bg: 'bg-[#C0453A]', text: 'text-white', label: 'MISMATCH' },
    warning: { bg: 'bg-[#D98A1F]', text: 'text-white', label: 'ATTENTION' },
    info: { bg: 'bg-[#111111]', text: 'text-white', label: 'INFO' }
  }[toast.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-80 sm:w-96 border border-[#111111] bg-[#F1EEE6] p-4 flex flex-col gap-1.5 transition-all duration-200 select-none ${borderStyles}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 border border-[#111111] ${badgeConfig.bg} ${badgeConfig.text}`}
        >
          {toast.title || badgeConfig.label}
        </span>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="p-1 text-[#111111]/70 hover:text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
        >
          <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-[#111111] font-body font-medium leading-snug">
        {toast.message}
      </p>
    </div>
  );
};

/**
 * Toast Container positioning the toasts at bottom-right
 */
export const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
