import React, { useState } from 'react';
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

  const image = '/resources/images/AboustUs-LinkedinGroup.jpeg';
  const fact = "Reset your password securely";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    // More strict email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!email.trim()) {
      setError('Please enter an email address.');
      console.log('Error:', 'Please enter an email address.');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      console.log('Error:', 'Please enter a valid email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('If an account exists with this email, you will receive password reset instructions.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        setError('Invalid email format. Please enter a valid email address.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen p-4 gap-4">
      <div 
        className="block h-32 md:h-full md:w-1/2 bg-cover bg-center relative rounded-2xl overflow-hidden"
        style={{ backgroundImage: `url(${image})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <div className="absolute bottom-2 right-2">
          <p className="text-white/80 text-xs">
            {fact}
          </p>
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
              Enter your email address and we&apos;ll send you instructions to reset your password.
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

            {error && (
              <div className="animate-fadeIn p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm font-medium text-center">
                  {error}
                </p>
              </div>
            )}
            {success && (
              <div className="animate-fadeIn p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-green-600 text-sm font-medium text-center">
                  {success}
                </p>
              </div>
            )}

            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm text-gray-600 hover:text-[#06B7DB] transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 