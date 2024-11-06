import React, { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Card, Chip, Avatar, Input, Modal, ModalContent, ModalBody, Spinner, Dropdown, CardBody } from "@nextui-org/react";
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useUser } from '@/components/UserProvider';
import { useDisclosure } from "@nextui-org/react";
import { AuthChecker } from '@/components/AuthChecker';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";

const ProfileSettings = () => {
  const { user, loading } = useUser();
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState(user?.user_name || '');

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };



  // Rest of your existing component code here
  return (
    <>
      <NavBar />
      <AuthChecker minimumStatus="student">
        <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 mb-10 bg-white">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs className="mb-2">
              <BreadcrumbItem>Home</BreadcrumbItem>
              <BreadcrumbItem>Account Settings</BreadcrumbItem>
            </Breadcrumbs>

            <div className="pt-8">
              <h1 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
                Account Settings
              </h1>
            </div>

            <div className="flex flex-col lg:flex-row min-h-screen">
              {/* Add sticky positioning to left sidebar */}
              <div className="w-full lg:w-1/4 pt-6 lg:pr-8 mb-6 lg:mb-0">
                <div className="lg:sticky lg:top-4">
                  {user && (
                    <Card className="bg-white dark:bg-gray-900 shadow-lg-top">
                      <CardBody className="p-6 md:p-8">
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
                              <p className="text-black">{user?.username || 'Username'}</p>
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
                            <Button className="mt-4 w-full text-white bg-[#06B7DB]">
                              Manage students
                            </Button>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </div>

              {/* Right Section - Profile Settings */}
              <div className="w-full pt-6 lg:w-3/4">
                <Card className="bg-white dark:bg-gray-900 shadow-lg-top w-full max-w-4xl">
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
                            value={user?.username || ''}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 dark:text-white mb-2">Given Full Name</label>
                          <Input
                            type="text"
                            radius="sm"
                            placeholder="Your Full Name"
                            value={user?.user_name || ''}
                            className="w-full"
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

                      
                      <div className="flex justify-end space-x-2">
                            <Button 
                              variant="bordered"
                              className="border-[#06B7DB] text-[#06B7DB]"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              className="bg-[#06B7DB] text-white"
                            >
                              Update Profile
                            </Button>
                          </div>
                    </form>

                    </CardBody>
                    </Card>

                    <Card className="mt-10">
                      <CardBody className="p-6 md:p-8">
                        <h1 className="text-2xl sm:text-3xl">Password</h1>
                        <p className="text-gray-500 mb-4">Change your account password here.</p>
                        <form className='mt-4'>
                        <div className="grid grid-cols-1 gap-6 mb-6">
                            <div>
                              <label className="block text-gray-700 dark:text-white mb-2">Current Password</label>
                              <Input
                                type="password"
                                radius="sm"
                                placeholder="Enter current password"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 dark:text-white mb-2">New Password</label>
                              <Input
                                type="password"
                                radius="sm"
                                placeholder="Enter new password"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 dark:text-white mb-2">Confirm New Password</label>
                              <Input
                                type="password"
                                radius="sm"
                                placeholder="Confirm new password"
                                className="w-full"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="bordered"
                              className="border-[#06B7DB] text-[#06B7DB]"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              className="bg-[#06B7DB] text-white"
                            >
                              Update Password
                            </Button>
                          </div>
                        </form>
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
