import React, { useState, useEffect, useRef } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Card, Chip, Avatar, Input, Modal, ModalContent, ModalBody, Spinner, Dropdown, CardBody } from "@nextui-org/react";
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useUser } from '@/components/UserProvider';
import { useDisclosure } from "@nextui-org/react";
import { AuthChecker } from '@/components/AuthChecker';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../firebaseConfig.js"; // Make sure this path matches your Firebase config
import NotificationPopup from '@/components/NotificationPopup';

const ProfileSettings = () => {
  const { user, loading } = useUser();
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState(user?.user_name || '');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editableGivenName, setEditableGivenName] = useState('');
  const [editableEmail, setEditableEmail] = useState('');
  const [isUserInfoEditing, setIsUserInfoEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Load profile image when user data is available
  useEffect(() => {
    if (user?.image_filename) {
      // Construct the S3 URL for the profile image
      const imageUrl = `https://d2dcurebucketprod.s3.amazonaws.com/profile-pics/${user.image_filename}`;
      setProfileImageUrl(imageUrl);
    } else {
      setProfileImageUrl(null);
    }
  }, [user]);

  // Initialize editable fields when user data loads
  useEffect(() => {
    if (user) {
      setEditableGivenName(user.given_name || '');
      setEditableEmail(user.email || '');
      //setEditableAltEmail(user.alt_email || '');
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handlePasswordReset = async () => {
    try {
      if (!user?.email) {
        setNotificationMessage("No email address found");
        setShowNotification(true);
        return;
      }
      await sendPasswordResetEmail(auth, user.email);
      setNotificationMessage("Password reset email sent! Please check your inbox.");
      setShowNotification(true);
    } catch (error: any) {
      setNotificationMessage(error.message || "Failed to send reset email");
      setShowNotification(true);
    }
  };

  // Function to trigger file selection
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  // Function to handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validation
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setNotificationMessage("File size should be less than 5MB");
      setShowNotification(true);
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/jpg'].includes(file.type)) {
      setNotificationMessage("Only JPG, PNG, and GIF files are allowed");
      setShowNotification(true);
      return;
    }
    
    setUploading(true);
    
    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      // Generate filename - username plus timestamp
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const newFileName = `${user?.user_name.replace(/\s+/g, '-')}-${timestamp}.${fileExt}`;
      
      // Upload to S3
      const s3Response = await fetch(`/api/s3?folder=profile-pics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newFileName,
          fileBase64: base64
        })
      });
      
      if (!s3Response.ok) {
        throw new Error('Failed to upload image to storage');
      }
      
      const { url } = await s3Response.json();
      
      // Update database
      const dbResponse = await fetch('/api/updateUserProfileImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          imageFilename: newFileName
        })
      });
      
      if (!dbResponse.ok) {
        throw new Error('Failed to update profile image in database');
      }
      
      // Update UI
      setProfileImageUrl(url);
      setNotificationMessage("Profile picture updated successfully!");
      setShowNotification(true);
      
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setNotificationMessage("Failed to update profile picture. Please try again.");
      setShowNotification(true);
    } finally {
      setUploading(false);
    }
  };
  
  // Helper to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Add validation function
  const validateEmail = (email: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // Add function to handle save
  const handleSaveUserInfo = async () => {
    // Validate email
    if (!validateEmail(editableEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError('');
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/updateUserInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          givenName: editableGivenName,
          email: editableEmail,
          currentEmail: user?.email
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user information');
      }
      
      setIsUserInfoEditing(false);
      setNotificationMessage('User information updated successfully!');
      setShowNotification(true);
      
    } catch (error) {
      console.error('Error updating user information:', error);
      setNotificationMessage('Failed to update user information. Please try again.');
      setShowNotification(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Rest of your existing component code here
  return (
    <>
      <NotificationPopup
        show={showNotification}
        onClose={() => setShowNotification(false)}
        title="Notification"
        message={notificationMessage}
      />
      <NavBar />
      <AuthChecker minimumStatus="student">
        <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 mb-10 bg-white">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs className="mb-2">
              <BreadcrumbItem href="/">Home</BreadcrumbItem>
              <BreadcrumbItem href="/user-settings">User Settings</BreadcrumbItem>
            </Breadcrumbs>

            <div className="pt-8">
              <h1 className="mb-4 text-2xl md:text-3xl lg:text-4xl font-inter dark:text-white">
                Account Settings
              </h1>
            </div>

            <div className="flex flex-col lg:flex-row min-h-screen">
              {/* Add sticky positioning to left sidebar */}
              <div className="w-full lg:w-1/4 pt-6 lg:pr-8 mb-6 lg:mb-0">
                <div className="lg:sticky lg:top-4">
                  {user && (
                    <div className="bg-white dark:bg-gray-900 shadow-lg-top-top">
                      <div className="p-6 md:p-8">
                        <div className="flex flex-col">
                          <div className="relative">
                            <img
                              alt="User profile"
                              src={profileImageUrl || '/resources/images/sample.jpg'}
                              className="w-full max-w-[200px] lg:max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                // Fallback to default image if S3 image fails to load
                                const target = e.target as HTMLImageElement;
                                target.src = '/resources/images/sample.jpg';
                              }}
                              onClick={handleImageClick}
                            />
                            
                            {uploading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                              </div>
                            )}
                            
                            {!uploading && (
                              <div 
                                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 rounded-lg transition-all duration-200"
                                onClick={handleImageClick}
                              >
                                <div className="text-white opacity-0 hover:opacity-100 transition-opacity duration-200">
                                  Click to change
                                </div>
                              </div>
                            )}
                            
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/jpeg,image/png,image/gif,image/jpg"
                              onChange={handleFileChange}
                            />
                          </div>
                          
                          {/* Small text under the image */}
                          <p className="text-xs text-gray-500 mt-1 mb-3">
                            Click to change profile picture
                          </p>

                          <h2 className="text-2xl font-normal mb-2 mt-2 text-left">{user?.user_name}</h2>
                          
                          <div className="w-full space-y-3">
                            <div>
                              <p className="text-gray-500 text-sm">Given Name</p>
                              <p className="text-black">{user?.given_name || 'not provided'}</p>
                            </div>

                            <div>
                              <p className="text-gray-500 text-sm">Title</p>
                              <p className="text-black">
                                {user?.status === "student" 
                                  ? `${user?.status || 'Student'} of ${user?.pi}`
                                  : user?.status || 'Professor'}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-500 text-sm">Institution</p>
                              <p className="text-black">{user?.institution || 'missing data'}</p>
                            </div>

                            <div>
                              <p className="text-gray-500 text-sm">Email</p>
                              <p className="text-black">{user?.email || 'missing data'}</p>
                            </div>

                            <div>
                              <p className="text-gray-500 text-sm">Alternative Email</p>
                              <p className="text-black">{user?.alt_email || 'not provided'}</p>
                            </div>
                          </div>

                          {/* Only show Manage button if user is a professor/admin */}
                          {(user?.status === "professor" || user?.status === "ADMIN") && (
                            <>
                              <Link href="/user-management">
                                <Button className="mt-4 w-full text-white bg-[#06B7DB]">
                                  Manage students
                                </Button>
                              </Link>
                              <Link href="/institution-management">
                                <Button className="mt-4 w-full text-white bg-[#06B7DB]">
                                  Manage Institutions
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Section - Profile Settings */}
              <div className="w-full pt-6 lg:w-3/4">
                <Card className="bg-white dark:bg-gray-900 shadow-lg-top w-full">
                  <CardBody className="p-6 md:p-8">
                    <h1 className="text-2xl sm:text-3xl">Account Settings</h1>
                    <p className="text-gray-500 mb-4">Update your account settings here.</p>
                    <form className='mt-4'>
                      <div className="grid grid-cols-1 gap-6 mb-6">
                        <div>
                          <label className="block text-gray-700 dark:text-white mb-2">Username</label>
                          <Input
                            type="text"
                            radius="sm"
                            placeholder="Your Username"
                            value={user?.user_name || ''}
                            className="w-full"
                            isDisabled
                          />
                          <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                        </div>
                        <div>
                          <label className="block text-gray-700 dark:text-white mb-2">Given Full Name</label>
                          <Input
                            type="text"
                            radius="sm"
                            placeholder="Your Full Name"
                            value={isUserInfoEditing ? editableGivenName : (user?.given_name || '')}
                            onChange={(e) => setEditableGivenName(e.target.value)}
                            className="w-full"
                            isDisabled={!isUserInfoEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 dark:text-white mb-2">Email</label>
                          <Input
                            type="email"
                            radius="sm"
                            placeholder="Your Email"
                            value={isUserInfoEditing ? editableEmail : (user?.email || '')}
                            onChange={(e) => setEditableEmail(e.target.value)}
                            className="w-full"
                            isDisabled={!isUserInfoEditing}
                            color={emailError ? "danger" : "default"}
                          />
                          {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                        </div>
                        <div>
                          <label className="block text-gray-700 dark:text-white mb-2">Institution</label>
                          <Input
                            type="text"
                            radius="sm"
                            placeholder="Your Institution"
                            value={user?.institution || ''}
                            className="w-full"
                            isDisabled
                          />
                          <p className="text-xs text-gray-500 mt-1">Please contact support to change institution</p>
                        </div>
                      </div>
                      
                      {/* Add edit/save buttons */}
                      <div className="flex justify-end gap-2 mt-4">
                        {!isUserInfoEditing ? (
                          <Button 
                            color="primary"
                            className="bg-[#06B7DB] text-white"
                            onClick={() => setIsUserInfoEditing(true)}
                          >
                            Edit Information
                          </Button>
                        ) : (
                          <>
                            <Button 
                              color="default"
                              variant="bordered"
                              onClick={() => {
                                setIsUserInfoEditing(false);
                                setEditableGivenName(user?.given_name || '');
                                setEditableEmail(user?.email || '');
                                setEmailError('');
                              }}
                              disabled={isSaving}
                            >
                              Cancel
                            </Button>
                            <Button 
                              color="primary"
                              className="bg-[#06B7DB] text-white"
                              onClick={handleSaveUserInfo}
                              isLoading={isSaving}
                            >
                              Save Changes
                            </Button>
                          </>
                        )}
                      </div>
                    </form>

                    {/* Add registration date information */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 italic">
                        Member of D2D network since {user?.reg_date ? new Date(user.reg_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </CardBody>
                </Card>

                {/* Enhanced password reset card */}
                <Card className="mt-10 shadow-lg-top">
                  <CardBody className="p-6 md:p-8">
                    <div className="flex flex-col space-y-4">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-normal">Forgot Password?</h1>
                        <p className="text-gray-500 mt-2 text-base leading-relaxed">
                          No worries! Click the button below to receive a password reset link via email. 
                          Follow the link to securely reset your password.
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          A reset link will be sent to your registered email address
                        </p>
                        <Button 
                          className="bg-[#06B7DB] text-white px-6"
                          size="md"
                          onClick={handlePasswordReset}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </AuthChecker>
      <Footer />
    </>
  );
};

export default ProfileSettings;
