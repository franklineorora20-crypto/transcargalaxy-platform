import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (options: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
  success: (title: string, description?: string, duration?: number) => void;
  info: (title: string, description?: string, duration?: number) => void;
  warning: (title: string, description?: string, duration?: number) => void;
  error: (title: string, description?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, type = 'success', duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, title, description, type, duration };

      setToasts((prev) => [...prev.slice(-3), newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback(
    (title: string, description?: string, duration = 4000) =>
      showToast({ title, description, type: 'success', duration }),
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string, duration = 3500) =>
      showToast({ title, description, type: 'info', duration }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, description?: string, duration = 4500) =>
      showToast({ title, description, type: 'warning', duration }),
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string, duration = 5000) =>
      showToast({ title, description, type: 'error', duration }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, success, info, warning, error }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-20 right-3 sm:right-6 z-[100] flex flex-col gap-2.5 w-[calc(100vw-1.5rem)] max-w-sm pointer-events-none print:hidden"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => {
            const IconComponent =
              item.type === 'success'
                ? CheckCircle2
                : item.type === 'error'
                ? AlertCircle
                : item.type === 'warning'
                ? AlertTriangle
                : Info;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                role="status"
                data-testid="toast-notification"
                className="pointer-events-auto relative overflow-hidden rounded-2xl bg-[#0A0A0A] text-[#FFFFFF] border-2 border-[#FFC300] shadow-2xl p-3.5 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-[#FFC300] text-[#0A0A0A] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconComponent className="w-4 h-4 stroke-[2.5]" />
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs sm:text-sm font-black tracking-tight text-[#FFFFFF] leading-snug">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-[11px] sm:text-xs font-medium text-[#FFFFFF]/80 mt-0.5 leading-relaxed break-words">
                      {item.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(item.id)}
                  aria-label="Dismiss notification"
                  className="p-1 rounded-lg text-[#FFFFFF]/70 hover:text-[#FFC300] hover:bg-[#FFFFFF]/10 transition-colors cursor-pointer flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback if rendered outside provider
    return {
      toasts: [],
      showToast: () => {},
      dismissToast: () => {},
      success: () => {},
      info: () => {},
      warning: () => {},
      error: () => {},
    };
  }
  return ctx;
}
