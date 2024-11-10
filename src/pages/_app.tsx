import React, { useEffect } from 'react';
import { AppProps } from 'next/app';
import { UserProvider } from '@/components/UserProvider';
import AuthStateListener from '@/components/AuthStateListener';
import dynamic from 'next/dynamic';
import "../app/globals.css"; 
import LoginSuccessNotification from '@/components/LoginSuccessNotification';
import LogoutSuccessNotification from '@/components/LogoutSuccessNotification';

const FlowbiteInit = dynamic(
  () => import('@/components/FlowbiteInit'),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <AuthStateListener />
      <LoginSuccessNotification />
      <LogoutSuccessNotification />
      <Component {...pageProps} />
      <FlowbiteInit />
    </UserProvider>
  );
}

export default MyApp;
