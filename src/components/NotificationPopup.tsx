import React from 'react';
import { useState, useEffect } from 'react';
import { AlertTriangleIcon } from 'lucide-react';

interface NotificationProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  icon?: React.ReactNode;
  buttons?: {
    text: string;
    href?: string;
    onClick?: () => void;
    primary?: boolean;
  }[];
}

const NotificationPopup = ({ show, onClose, title, message, icon, buttons }: NotificationProps) => {
  const [mounted, setMounted] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const timer = setTimeout(() => {
        setShowNotif(true);
      }, 500);

      const hideTimer = setTimeout(() => {
        setShowNotif(false);
        onClose();
      }, 6000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 transform transition-all duration-700 ease-out
      ${mounted ? 'translate-y-0' : '-translate-y-[200%]'}
      ${showNotif ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div className="backdrop-blur-md bg-white dark:bg-gray-800/30 rounded-lg shadow-lg p-4 relative flex items-center gap-4">
        <button 
          onClick={onClose}
          className="absolute -top-2 -right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"
        >
          <AlertTriangleIcon xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" />
        </button>

        {icon && <div className="h-10 w-10 rounded-full bg-[#06B7DB]/10 flex-shrink-0 flex items-center justify-center">{icon}</div>}
        
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

        {buttons && buttons.length > 0 && (
          <div className="flex gap-2 flex-shrink-0">
            {buttons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors font-medium ${
                  button.primary
                    ? 'text-white bg-[#06B7DB] hover:bg-[#05a6c7]'
                    : 'text-[#06B7DB] bg-[#06B7DB]/10 hover:bg-[#06B7DB]/20'
                }`}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPopup; 
