import React, { useState } from 'react';
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
                          <img
                            alt="User profile"
                            src={user.profilePic || '/resources/images/sample.jpg'}
                            className="w-full max-w-[200px] lg:max-w-full rounded-lg mb-2"
                          />

                          <h2 className="text-2xl font-normal mb-2 mt-2 text-left">{user?.user_name || 'First Last'}</h2>
                          
                          <div className="w-full space-y-3">
                            <div>
                              <p className="text-gray-500 text-sm">Username</p>
                              <p className="text-black">{user?.user_name || 'Username'}</p>
                            </div>

                            <div>
                              <p className="text-gray-500 text-sm">Title</p>
                              <p className="text-black">{user?.status || 'Professor'}</p>
                            </div>

                            <div>
                              <p className="text-gray-500 text-sm">Institution</p>
                              <p className="text-black">{user?.institution || 'UC Davis'}</p>
                            </div>

                            <div>
                              <p className="text-gray-500 text-sm">Email</p>
                              <p className="text-black">{user?.email || 'firstlast@ucdavis.edu'}</p>
                            </div>
                          </div>

                          {/* Only show Manage button if user is a professor/admin */}
                          {(user?.status === "professor" || user?.status === "ADMIN") && (
                            <Link href="/user-management">
                              <Button className="mt-4 w-full text-white bg-[#06B7DB]">
                                Manage students
                              </Button>
                            </Link>
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
                    <h1 className="text-2xl sm:text-3xl">Personal Information</h1>
                    <p className="text-gray-500 mb-4">Update your personal details here.</p>
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
                        </div>
                        <div>
                          <label className="block text-gray-700 dark:text-white mb-2">Given Full Name</label>
                          <Input
                            type="text"
                            radius="sm"
                            placeholder="Your Full Name"
                            value={user?.given_name || ''}
                            className="w-full"
                            isDisabled
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 dark:text-white mb-2">Email</label>
                          <Input
                            type="email"
                            radius="sm"
                            placeholder="Your Email"
                            value={user?.email || ''}
                            className="w-full"
                            isDisabled
                          />
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
                        </div>
                      </div>
                    </form>
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
