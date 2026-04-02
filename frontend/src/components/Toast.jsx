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
      bgColor: 'bg-green-800 sm:bg-green-50 sm:dark:bg-green-900/20',
      borderColor: 'border-green-500 sm:border-green-200 sm:dark:border-green-800',
      textColor: 'text-green-50 sm:text-green-800 sm:dark:text-green-200',
      iconColor: 'text-green-200 sm:text-green-500 sm:dark:text-green-400'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-800 sm:bg-red-50 sm:dark:bg-red-900/20',
      borderColor: 'border-red-500 sm:border-red-200 sm:dark:border-red-800',
      textColor: 'text-red-50 sm:text-red-800 sm:dark:text-red-200',
      iconColor: 'text-red-200 sm:text-red-500 sm:dark:text-red-400'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-800 sm:bg-yellow-50 sm:dark:bg-yellow-900/20',
      borderColor: 'border-yellow-500 sm:border-yellow-200 sm:dark:border-yellow-800',
      textColor: 'text-yellow-50 sm:text-yellow-800 sm:dark:text-yellow-200',
      iconColor: 'text-yellow-200 sm:text-yellow-500 sm:dark:text-yellow-400'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-800 sm:bg-blue-50 sm:dark:bg-blue-900/20',
      borderColor: 'border-blue-500 sm:border-blue-200 sm:dark:border-blue-800',
      textColor: 'text-blue-50 sm:text-blue-800 sm:dark:text-blue-200',
      iconColor: 'text-blue-200 sm:text-blue-500 sm:dark:text-blue-400'
    }
  };

  const config = types[type] || types.info;
  const Icon = config.icon;

  return (
    <div className={`fixed top-4 sm:top-20 right-2 left-2 sm:right-4 sm:left-auto sm:min-w-[320px] sm:max-w-md z-50 animate-slideInRight`}>
      <div className={`${config.bgColor} ${config.borderColor} border rounded-lg shadow-xl sm:shadow-lg p-2.5 sm:p-4`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.iconColor} flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs sm:text-sm font-medium ${config.textColor}`}>{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`${config.textColor} hover:opacity-70 transition-opacity flex-shrink-0`}
              aria-label="Close notification"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
    <div className="fixed top-4 sm:top-20 right-2 left-2 sm:right-4 sm:left-auto space-y-2 z-50 pointer-events-none">
      {toasts.map((toast, index) => (
        <div key={toast.id} className="pointer-events-auto" style={{ marginTop: index > 0 ? '8px' : '0' }}>
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
