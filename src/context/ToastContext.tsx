import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-16 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => {
          // Curated colors & glows
          let icon = <Info className="h-5 w-5 text-blue-400 shrink-0" />;
          let bgStyle = 'bg-slate-900/80 border-blue-500/30 text-slate-100 shadow-blue-500/10';
          let progressBg = 'bg-blue-500';

          if (toast.type === 'success') {
            icon = <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />;
            bgStyle = 'bg-slate-900/80 border-emerald-500/30 text-slate-100 shadow-emerald-500/10';
            progressBg = 'bg-emerald-500';
          } else if (toast.type === 'error') {
            icon = <XCircle className="h-5 w-5 text-red-400 shrink-0" />;
            bgStyle = 'bg-slate-900/80 border-red-500/30 text-slate-100 shadow-red-500/10';
            progressBg = 'bg-red-500';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />;
            bgStyle = 'bg-slate-900/80 border-amber-500/30 text-slate-100 shadow-amber-500/10';
            progressBg = 'bg-amber-500';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-in ${bgStyle}`}
              role="alert"
            >
              {icon}
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Progress Bar Animation */}
              <div
                style={{ animationDuration: `${toast.duration || 4000}ms` }}
                className={`absolute bottom-0 left-0 h-1 w-full animate-toast-progress origin-left ${progressBg}`}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
