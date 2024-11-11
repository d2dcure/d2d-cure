import React, { useState, useEffect } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Input } from "@nextui-org/react";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [validCode, setValidCode] = useState(false);
  const router = useRouter();
  const { oobCode } = router.query; // Firebase passes the action code in the URL

  useEffect(() => {
    const verifyCode = async () => {
      if (oobCode && typeof oobCode === 'string') {
        try {
          await verifyPasswordResetCode(auth, oobCode);
          setValidCode(true);
        } catch (error) {
          setError('Invalid or expired reset link. Please request a new one.');
        }
        setLoading(false);
      }
    };

    if (oobCode) {
      verifyCode();
    }
  }, [oobCode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password should be at least 6 characters long');
      return;
    }

    if (!oobCode || typeof oobCode !== 'string') {
      setError('Missing reset code');
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess('Password successfully reset!');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setError('Failed to reset password. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Verifying reset link...</p>
      </div>
    );
  }

  if (!validCode) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Link 
          href="/forgot-password" 
          className="text-sm text-[#06B7DB] hover:underline"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="w-full max-w-[400px] bg-white p-6 rounded-2xl">
        <div className="mb-8">
          <img 
            src="/resources/images/D2D_Logo.svg" 
            alt="D2D Logo" 
            className="h-7 mb-6"
          />
          <h1 className="text-2xl font-semibold mb-2">Set new password</h1>
          <p className="text-sm text-gray-600">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              variant="bordered"
              size="md"
              className="w-full"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              variant="bordered"
              size="md"
              className="w-full"
              placeholder="Confirm new password"
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              className="w-full bg-[#06B7DB] text-white py-2 rounded-lg hover:bg-[#05a6c7] transition-colors text-sm font-medium"
            >
              Reset Password
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 