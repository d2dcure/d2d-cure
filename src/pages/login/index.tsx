import React, { useState, useEffect, useContext } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, signOut  } from "firebase/auth";
import { auth } from "../../../firebaseConfig"
import { useRouter } from 'next/router';
import { useUser } from '@/components/UserProvider';
import { NextUIProvider } from "@nextui-org/react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import {Input} from "@nextui-org/react";

export {};

declare global {
  interface Window {
    google: any;
  }
}


const Login = () => {


  const { user, setUser, loading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const [showSuccessNotif, setShowSuccessNotif] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Add mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  //Google sign in button logic 
  useEffect(() => {
    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google script loaded');
        window.google.accounts.id.initialize({
          client_id: '908640937966-i4qfvag5cf18pee3e4op0as4d3lo8lad.apps.googleusercontent.com',
          callback: handleGoogleSignIn,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('my-signin2'),
          { theme: 'outline', size: 'large' }
        );
        window.google.accounts.id.prompt(); 
      };
      document.body.appendChild(script);
    };

    const handleGoogleSignIn = (response: { credential: string }) => {
      console.log('Encoded JWT ID token: ' + response.credential);
    };

    loadGoogleScript();
  }, []);


  const variants = ["flat", "bordered", "underlined", "faded"]; //for login input box

  const handleSignIn = async (email: string, password: string) => {
    try {
      await setPersistence(auth, browserLocalPersistence); // ensures that the user remains logged in across page refreshes and browser sessions
      await signInWithEmailAndPassword(auth, email, password);
      
      // Add the justLoggedIn parameter to wherever you're redirecting
      const redirectPath = '/dashboard'; // or any other page
      router.push({
        pathname: redirectPath,
        query: { justLoggedIn: 'true' }
      });
    } catch (error) {
      setError('Failed to sign in');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSignIn(email, password);
  };

  // Add useEffect for redirection
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const SuccessNotification = () => (
    <div 
      className={`
        fixed top-4 right-4 z-50 transform transition-all duration-700 ease-out
        ${mounted ? 'translate-y-0' : '-translate-y-full'}
        ${showSuccessNotif ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      <div className="backdrop-blur-md bg-white/30 dark:bg-gray-800/30 rounded-lg shadow-lg border border-[#06B7DB]/20 p-6 min-w-[320px]">
        <div className="flex flex-col items-center gap-4">
          {/* Success Icon */}
          <div className="h-12 w-12 rounded-full bg-[#06B7DB]/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#06B7DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* Text Content */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Successfully logged in
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Logged in as {email}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col w-full gap-2 mt-2">
            <Link 
              href="/dashboard"
              className="w-full px-4 py-2 text-sm text-white bg-[#06B7DB] rounded-lg hover:bg-[#05a6c7] transition-colors text-center font-medium"
            >
              View Dashboard
            </Link>
            <Link 
              href="/settings"
              className="w-full px-4 py-2 text-sm text-[#06B7DB] bg-[#06B7DB]/10 rounded-lg hover:bg-[#06B7DB]/20 transition-colors text-center font-medium"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <NavBar />
      <SuccessNotification />
      <div className="flex justify-center items-center h-screen" style={{marginTop: "36px"}}>
      <div
        style={{
          position: "absolute", 
          width: "100%", 
          height: "100%", 
          background: "linear-gradient(180deg, #FFFFFF 16.13%, #E3F3F5 58.36%)",
          zIndex: -1, 
        }}
      ></div>
          <Card style={{
            width: "448px",
            height: "580px",
            borderRadius: "14px",
            padding: "32px",
            gap: "36px", 
            display: "flex", // Make the Card a flex container
            justifyContent: "center", // Center content horizontally
            alignItems: "center", // Center content vertically
          }}>
            <CardHeader style = {{    height: "40px",
                width: "300px",
                fontSize: "30px",
                fontFamily: "Inter, sans-serif",
                fontWeight: "400",
                textAlign: "center", 
                display: "flex", // Make the Card a flex container
                justifyContent: "center", // Center content horizontally
                alignItems: "center", // Center content vertically
              }}>Welcome back!</CardHeader>
              <CardBody style={{ 
                overflowY: 'hidden' // Add this to disable vertical scrolling
              }}>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4" style = {{fontSize: "14px"}}>
                    <label className="block text-gray-700 text-sm mb-2" htmlFor="email">
                      Username or Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      variant = "bordered"
                      size = "lg"
                      style={{width: "365px", height: "48px", borderRadius: "8px", border: "2px"}}
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm mb-2" htmlFor="password">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      variant = "bordered"
                      size = "lg"
                      style={{width: "365px", height: "48px", borderRadius: "8px", border: "2px"}}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                      style = {{fontSize: "16px", background: "#06B7DB", width: "384px", height: "48px", borderRadius: "12px", borderColor: "#E4E4E7",  border: "2px solid", paddingRight: "16px", paddingLeft: "16px", gap: "12px"}}
                    >
                      Login
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-xs italic">{error}</p>}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    margin: "16px 0", // Adjust margin as needed
                    marginTop: "36px"
                  }}>
                    <hr style={{ flex: 1, border: "1px", height: "1px", backgroundColor: "#71717A", width: "146px"}} />
                    <span style={{ padding: "0 36px", color: "#71717A", fontSize: "14px", fontWeight: "400", lineHeight: "20px" }}>OR</span>
                    <hr style={{ flex: 1, border: "1px", height: "1px", backgroundColor: "#71717A", width: "146px"}} />
                  </div>
                </form>

                <div>
                  {/*google sign in button*/}
                  <div id="my-signin2" style = {{marginTop: "20px"}}></div> 
                </div>
                
                  <div style={{ marginTop: "36px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "400px", lineHeight: "20px" }}>
                    <p style={{ display: "inline-block" }}>Don&apos;t have an account?</p>
                    <Link
                      href="/signup"
                      className="text-blue-600 underline hover:text-blue-800"
                      style={{ display: "inline-block", textDecoration: "none"}}
                    >
                      Create an account
                    </Link>
                </div>
              </CardBody>

            </Card>

        </div>

      </>
  );
};

export default Login;