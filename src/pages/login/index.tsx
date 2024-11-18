import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, signOut } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { useRouter } from 'next/router';
import { useUser } from '@/components/UserProvider';
import Link from 'next/link';
import { Input } from "@nextui-org/react";

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const images = [
    '/resources/images/d2d-aboutus.png',
    '/resources/slideshow/Design-Data-class-UC-Davis_2.webp',
    '/resources/slideshow/Design-Data-pipette-UC-Davisc.avif',
    '/resources/slideshow/Design-Data-protein-UC-Davisd.avif',
    '/resources/slideshow/Design-Data-UC-Davis2.avif',
    '/resources/slideshow/D2D2022a.jpg',
    '/resources/slideshow/D2D20217d.jpg',
    '/resources/slideshow/IMG_1369.jpeg',
    '/resources/slideshow/IMG_1602.jpeg',
    '/resources/slideshow/IMG_5581.jpeg'
  ];

  const facts = [
    "Built by UC Davis students at CodeLab",
    '"D2D helped me discover my passion for bioinformatics" - Student, 2022',
    '"The perfect bridge between biology and coding" - Mentor',
    '"I never thought I could code until D2D" - Student, 2023',
    '"Amazing to see students grow in just 8 weeks" - Instructor',
    '"D2D opened doors to my biotech career" - Alumni',
    "Students analyze real cancer data",
    "8-week hands-on lab experience",
    "First D2D cohort launched Summer 2021",
    "Partnership with UC Davis Genome Center",
    "Students learn Python and wet lab skills",
    "Weekly sessions in teaching lab",
    "Mentored by UC Davis researchers",
    "Projects presented at UC Davis symposium",
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

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
          { 
            type: "standard",
            size: "large",
            theme: "nuetral",
            shape: "pill",
            width: 380,
            logo_alignment: "left"
          }
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

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev + 1) % 100);
    }, 80); // 8000ms / 100 steps = 80ms per step

    const imageInterval = setInterval(() => {
      setProgress(0);
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 8000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(imageInterval);
    };
  }, []);

  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.src = images[currentImageIndex];
    img.onload = () => setImageLoaded(true);
  }, [currentImageIndex]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      const redirectPath = '/dashboard';
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

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen p-4 gap-4">
      <div 
        className="md:hidden h-32 bg-cover bg-center relative rounded-2xl overflow-hidden"
        style={{ 
          backgroundImage: imageLoaded ? `url(${images[currentImageIndex]})` : 'none',
          transition: 'background-image 1.5s ease-in-out'
        }}>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <div className="absolute bottom-2 right-2">
          <p className="text-white/80 text-xs">
            {facts[currentImageIndex]}
          </p>
        </div>
        <div className="absolute bottom-2 left-2">
          <div className="h-0.5 w-8 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-[600px] flex justify-center items-center bg-white p-4 md:p-12 rounded-2xl" 
           style={{ maxWidth: '100%' }}>
        <div className="w-full max-w-[380px] mx-auto">
          <div className="mb-8">
            <Link href="/">
              <img 
                src="/resources/images/D2D_Logo.svg" 
                alt="D2D Logo" 
                className="h-7 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-semibold">Sign in to your account</h1>
            </div>
            <p className="text-sm text-gray-600">
              Not a member?{' '}
              <Link href="/signup" className="text-[#06B7DB] hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="bordered"
                size="md"
                className="w-full text-base"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-[#06B7DB] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="bordered"
                size="md"
                className="w-full text-base"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#06B7DB] text-white py-2 rounded-lg hover:bg-[#05a6c7] transition-colors text-sm font-medium"
            >
              Sign in
            </button>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div id="my-signin2" className="flex justify-center"></div>
          </form>
        </div>
      </div>
      
      <div 
        className="hidden md:block flex-1 bg-cover bg-center transition-all duration-2000 ease-in-out relative rounded-2xl overflow-hidden"
        style={{ 
          backgroundImage: imageLoaded ? `url(${images[currentImageIndex]})` : 'none',
          position: 'relative',
          transition: 'background-image 1.5s ease-in-out'
        }}>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <div className="absolute bottom-8 right-8">
          <p className="text-white/90 text-sm tracking-wide">
            {facts[currentImageIndex]}
          </p>
        </div>
        <div className="absolute bottom-8 left-8">
          <div className="h-0.5 w-12 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;