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

  const getIconByType = () => {
    switch (type) {
      case 'success':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        );
      case 'error':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        );
      case 'warning':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        );
      default: // info
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        );
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

  return (
    <div className={`
      fixed top-4 right-4 z-50 transform transition-all duration-700 ease-out
      ${mounted ? 'translate-y-0' : '-translate-y-[200%]'}
      ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div className="backdrop-blur-md bg-white dark:bg-gray-800/30 rounded-lg shadow-lg p-4 relative flex items-center gap-4">
        <button 
          onClick={onClose}
          className="absolute -top-2 -right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center ${getTypeStyles()}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {getIconByType()}
          </svg>
        </div>
        
        <div className="flex-grow">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </p>
          {message && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {message}
            </p>
          )}
        </div>

        {actions.length > 0 && (
          <div className="flex gap-2 flex-shrink-0">
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