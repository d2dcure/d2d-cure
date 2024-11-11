import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/components/UserProvider';

const LoginSuccessNotification = () => {
  const [showSuccessNotif, setShowSuccessNotif] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (router.query.justLoggedIn === 'true') {
      setMounted(true);
      const timer = setTimeout(() => {
        setShowSuccessNotif(true);
      }, 500);

      const hideTimer = setTimeout(() => {
        setShowSuccessNotif(false);
        const newQuery = { ...router.query };
        delete newQuery.justLoggedIn;
        router.replace(
          {
            pathname: router.pathname,
            query: newQuery
          },
          undefined,
          { shallow: true }
        );
      }, 6000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [router.query.justLoggedIn]);

    const handleClose = () => {
      setShowSuccessNotif(false);
      const newQuery = { ...router.query };
      delete newQuery.justLoggedIn;
      router.replace(
        {
          pathname: router.pathname,
          query: newQuery
        },
        undefined,
        { shallow: true }
      );
    };

  if (!router.query.justLoggedIn) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 transform transition-all duration-700 ease-out
      ${mounted ? 'translate-y-0' : '-translate-y-[200%]'}
      ${showSuccessNotif ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div className="backdrop-blur-md bg-white dark:bg-gray-800/30 rounded-lg shadow-lg p-4 relative flex items-center gap-4">
        <button 
          onClick={handleClose}
          className="absolute -top-2 -right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Success Icon */}
        <div className="h-10 w-10 rounded-full bg-[#06B7DB]/10 flex-shrink-0 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#06B7DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {/* Text Content */}
        <div className="flex-grow">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Successfully logged in
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Link 
            href="/dashboard"
            className="px-3 py-1.5 text-xs text-white bg-[#06B7DB] rounded-md hover:bg-[#05a6c7] transition-colors font-medium"
          >
            Dashboard
          </Link>
          <Link 
            href="/settings"
            className="px-3 py-1.5 text-xs text-[#06B7DB] bg-[#06B7DB]/10 rounded-md hover:bg-[#06B7DB]/20 transition-colors font-medium"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginSuccessNotification; 