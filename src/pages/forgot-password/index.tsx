import React, { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Input } from "@nextui-org/react";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const images = [
    '/resources/images/d2d-aboutus.png',
    '/resources/slideshow/Design-Data-class-UC-Davis 2.webp',
    '/resources/slideshow/Design-Data-pipette-UC-Davisc.avif',
    '/resources/slideshow/Design-Data-protein-UC-Davisd.avif',
    '/resources/slideshow/Design-Data-UC-Davis2.avif',
  ];

  const facts = [
    "Reset your password securely",
    "Check your email for instructions",
    "Create a strong new password",
    "Keep your account secure",
    "Access your research data safely",
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev + 1) % 100);
    }, 80);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Please check your inbox.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setError('Failed to send reset email. Please verify your email address.');
    }
  };

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
            <img 
              src="/resources/images/D2D_Logo.svg" 
              alt="D2D Logo" 
              className="h-7 mb-6"
            />
            <h1 className="text-2xl font-semibold mb-2">Reset your password</h1>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
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

            <button
              type="submit"
              className="w-full bg-[#06B7DB] text-white py-2 rounded-lg hover:bg-[#05a6c7] transition-colors text-sm font-medium"
            >
              Send reset instructions
            </button>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {success && <p className="text-green-500 text-sm text-center">{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 