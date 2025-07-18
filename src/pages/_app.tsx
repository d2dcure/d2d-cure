import React, { useEffect } from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { UserProvider } from '@/components/UserProvider';
import AuthStateListener from '@/components/AuthStateListener';
import dynamic from 'next/dynamic';
import "../app/globals.css"; 
import LoginSuccessNotification from '@/components/LoginSuccessNotification';
import LogoutSuccessNotification from '@/components/LogoutSuccessNotification';
import { useRouter } from 'next/router';
import '@/styles/nprogress.css';
import { LoadingBar } from '@/components/LoadingBar';

const FlowbiteInit = dynamic(
  () => import('@/components/FlowbiteInit'),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const pathEnd = router.pathname.split('/').pop() ?? 'Page';
  const pageName = router.pathname === '/' ? 'Home' : pathEnd.charAt(0).toUpperCase() + pathEnd.slice(1);
	// TODO: fix this behavior

  return (
    <UserProvider>
      <Head>  {/* Head, not head -- special tag from next/app */}
        <title>D2D CURE | {pageName}</title>
		<meta charset="UTF-8" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthStateListener />
      <LoginSuccessNotification />
      <LogoutSuccessNotification />
      <LoadingBar />
      <Component {...pageProps} />
      <FlowbiteInit />
    </UserProvider>
  );
}

export default MyApp;
