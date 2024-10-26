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

      router.push('/');
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

  if(loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p>Hello, {user.status}</p>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleLogout}
          >
            Log Out
          </button> <br></br>
          <Link href = "user-management">Manage students in your class/laboratory</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <div className="flex justify-center items-center h-screen" style = {{marginTop: "36px"}}>
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
              <CardBody>
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
                    <p style={{ display: "inline-block" }}>Don't have an account?</p>
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