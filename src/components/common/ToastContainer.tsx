import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-500 shrink-0" />
        };

        const borders = {
          success: 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-stone-900',
          error: 'border-rose-200 dark:border-rose-800 bg-white dark:bg-stone-900',
          info: 'border-sky-200 dark:border-sky-800 bg-white dark:bg-stone-900'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl border flex items-center justify-between gap-3 text-sm text-stone-800 dark:text-stone-100 ${borders[toast.type]} transition-all animate-bounce-in`}
          >
            <div className="flex items-center gap-2.5">
              {icons[toast.type]}
              <p className="font-medium text-xs leading-snug">{toast.text}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
