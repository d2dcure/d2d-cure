import { useState, useEffect } from 'react';

interface ToastProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  duration?: number;
  type?: 'success' | 'error' | 'info' | 'warning';
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

const Toast = ({ 
  show, 
  onClose, 
  title, 
  message, 
  duration = 6000, 
  type = 'success',
  actions = []
}: ToastProps) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const showTimer = setTimeout(() => setVisible(true), 100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 700); // Wait for fade out animation
      }, duration);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [show, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return {
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
        };
      case 'error':
        return {
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
        };
      case 'warning':
        return {
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
        };
      default: // info
        return {
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
        };
    }
  };

  const getTypeStyles = () => {
    const styles = {
      success: 'bg-[#06B7DB]/10 text-[#06B7DB]',
      error: 'bg-red-100 text-red-600',
      warning: 'bg-yellow-100 text-yellow-600',
      info: 'bg-blue-100 text-blue-600'
    };
    return styles[type];
  };

  if (!show) return null;

  const { icon } = getIcon();

  return (
    <div className={`
      fixed top-4 right-4 z-50 transform transition-all duration-700 ease-out
      ${mounted ? 'translate-y-0' : '-translate-y-[200%]'}
      ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div className="backdrop-blur-md bg-white dark:bg-gray-800/30 rounded-lg shadow-lg relative">
        <div className="flex items-center gap-4 p-4">
          <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center ${getTypeStyles()}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {getIcon()}
            </svg>
          </div>
          
          <div className="flex-grow pr-8">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </p>
            {message && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {message}
              </p>
            )}
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {actions.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex gap-2 justify-end">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  px-3 py-1.5 text-xs rounded-md transition-colors font-medium
                  ${action.variant === 'secondary' 
                    ? 'text-[#06B7DB] bg-[#06B7DB]/10 hover:bg-[#06B7DB]/20' 
                    : 'text-white bg-[#06B7DB] hover:bg-[#05a6c7]'}
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast; 
