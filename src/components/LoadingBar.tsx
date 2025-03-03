import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import { useEffect } from 'react';

// Configure NProgress
NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 500,
  showSpinner: false,
});

// Export the utility function
export const useLoadingBar = () => {
  const start = () => {
    NProgress.start();
  };

  const done = () => {
    NProgress.done();
  };

  return { start, done };
};

// Export the component
export const LoadingBar: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleStop);
      router.events.off('routeChangeError', handleStop);
    };
  }, [router]);

  return null;
}; 