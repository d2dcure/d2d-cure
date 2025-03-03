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
  }, [router.query.justLoggedIn, router]);

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
      fixed top-4 right-4 z-[60] transform transition-all duration-700 ease-out
      ${mounted ? 'translate-y-0' : '-translate-y-[200%]'}
      ${showSuccessNotif ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div className="backdrop-blur-md bg-white dark:bg-gray-800/30 rounded-lg shadow-lg relative">
        <div className="p-4">
          <div className="flex gap-3">
            <div className="h-[42px] w-[42px] rounded-full bg-[#06B7DB]/10 flex-shrink-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#06B7DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="flex-grow pr-8">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Successfully logged in
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Welcome back, {user?.email}
              </p>
              <div className="flex gap-2 mt-3">
                <Link 
                  href="/user-settings"
                  className="px-3 py-1.5 text-xs text-[#06B7DB] bg-[#06B7DB]/10 rounded-md hover:bg-[#06B7DB]/20 transition-colors font-medium"
                >
                  Settings
                </Link>
                <Link 
                  href="/dashboard"
                  className="px-3 py-1.5 text-xs text-white bg-[#06B7DB] rounded-md hover:bg-[#05a6c7] transition-colors font-medium"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSuccessNotification; 