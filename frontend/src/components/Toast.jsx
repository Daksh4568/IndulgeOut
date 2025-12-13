import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const types = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-500 dark:text-green-400'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-500 dark:text-red-400'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-500 dark:text-yellow-400'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-500 dark:text-blue-400'
    }
  };

  const config = types[type] || types.info;
  const Icon = config.icon;

  return (
    <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:min-w-[320px] sm:max-w-md z-50 animate-slideInRight`}>
      <div className={`${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`${config.textColor} hover:opacity-70 transition-opacity flex-shrink-0`}
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto space-y-2 z-50 pointer-events-none">
      {toasts.map((toast, index) => (
        <div key={toast.id} className="pointer-events-auto" style={{ marginTop: `${index * 70}px` }}>
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
