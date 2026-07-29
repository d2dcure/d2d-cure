import React, { useState, useEffect } from 'react';
import { CheckIcon, XIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react';

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
        return <CheckIcon />;
      case 'error':
        return <XIcon />;
      case 'warning':
        return <AlertTriangleIcon />;
      default:
        return <InfoIcon />;
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
    <div className={
      `fixed top-4 right-4 z-50 transform transition-all duration-700 ease-out
      ${mounted ? 'translate-y-0' : '-translate-y-[200%]'}
      ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`
    }>
      <div className="backdrop-blur-md bg-white dark:bg-gray-800/30 rounded-lg shadow-lg relative">
        <div className="flex items-center gap-4 p-4">
          <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center ${getTypeStyles()}`}>
            {React.cloneElement(getIcon() as any, { className: 'h-6 w-6' })}
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
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {actions.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex gap-2 justify-end">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={
                  `px-3 py-1.5 text-xs rounded-md transition-colors font-medium
                  ${action.variant === 'secondary' 
                    ? 'text-[#06B7DB] bg-[#06B7DB]/10 hover:bg-[#06B7DB]/20' 
                    : 'text-white bg-[#06B7DB] hover:bg-[#05a6c7]'}`
                }
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
