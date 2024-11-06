import React, { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Card, Chip, Avatar, Input, Modal, ModalContent, ModalBody, Spinner, Dropdown } from "@nextui-org/react";
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useUser } from '@/components/UserProvider';
import { useDisclosure } from "@nextui-org/react";

const ProfileSettings = () => {
  const { user } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState(user?.user_name || '');

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <>
      <NavBar />
      <div className="px-4 sm:px-6 md:px-12 lg:px-24 py-6 sm:py-8 lg:py-10 bg-white">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Sidebar */}
          <div className="w-full lg:w-1/4 p-4 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r mb-6 lg:mb-0">
            {user && (
              <>
                <img
                  alt="User profile"
                  src={user.profilePic || '/resources/images/sample.jpg'}
                  className="mx-auto mb-4 rounded-lg w-full max-w-[200px] lg:max-w-full"
                />

                {/* Editable name section */}
                <div className="flex justify-between items-center mb-2">
                  {isEditing ? (
                    <Input
                      className="w-full"
                      value={editableName}
                      onChange={(e) => setEditableName(e.target.value)}
                    />
                  ) : (
                    <h2 className="text-lg sm:text-xl">{user?.user_name || 'User Name'}</h2>
                  )}
                </div>

                <div className="flex justify-between items-center mb-1">
                  <p className="text-gray-600">Email:</p>
                  <p className="text-gray-600">{user?.email || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-gray-500">Institution:</p>
                  <p className="text-gray-500">{user?.institution || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-500">Role:</p>
                  <p className="text-gray-500">{user?.status || 'N/A'}</p>
                </div>

                {/* Updated buttons section */}
                <div className="flex space-x-2 mt-2">
                  <Button
                    onClick={handleEdit}
                    className="bg-[#06B7DB] text-white rounded-lg flex-1"
                    size="sm"
                  >
                    {isEditing ? "Save" : "Edit"}
                  </Button>
                  <Button
                    className="bg-transparent text-[#06B7DB] border border-[#06B7DB] rounded-lg flex-1"
                    size="sm"
                    color="primary"
                  >
                    Logout
                  </Button>
                </div>

                {/* Only show Manage button if user is a professor/admin */}
                {(user?.status === "professor" || user?.status === "ADMIN") && (
                  <Button className="mt-4 w-full text-white bg-[#06B7DB]">Manage students</Button>
                )}
              </>
            )}
          </div>

          {/* Right Section - Variant Profiles & Gel Image Uploads */}
          <div className="w-full lg:w-3/4 p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl mb-6 sm:mb-8">My Variant Profiles</h1>
            <div className="overflow-x-auto">
              <Table aria-label="Variant Profiles" className="mb-8 sm:mb-12">
                <TableHeader>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>Enzyme</TableColumn>
                  <TableColumn>Variant</TableColumn>
                  <TableColumn>Date Created</TableColumn>
                  <TableColumn>Comments</TableColumn>
                  <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  <TableRow key="1">
                    <TableCell>
                      <Chip className="bg-[#E6F1FE] text-[#06B7DB]" variant="flat">In Progress</Chip>
                    </TableCell>
                    <TableCell>BglB</TableCell>
                    <TableCell>Q124W</TableCell>
                    <TableCell>04-04-2024</TableCell>
                    <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
                      This is practice, def delete later.
                    </TableCell>
                    <TableCell>
                      <Link href="#" className="text-[#06B7DB]">View</Link>
                    </TableCell>
                  </TableRow>
                  <TableRow key="2">
                    <TableCell>
                      <Chip className="bg-[#E6F1FE] text-[#06B7DB]" variant="flat">In Progress</Chip>
                    </TableCell>
                    <TableCell>BglB</TableCell>
                    <TableCell>Q124W</TableCell>
                    <TableCell>04-04-2024</TableCell>
                    <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
                      Need to add the kinetic assay data.
                    </TableCell>
                    <TableCell>
                      <Link href="#" className="text-[#06B7DB]">View</Link>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <h1 className="text-2xl sm:text-3xl mb-6 sm:mb-8">My Gel Image Uploads</h1>
            <div className="overflow-x-auto">
              <Table aria-label="Gel Image Uploads">
                <TableHeader>
                  <TableColumn>Gel ID</TableColumn>
                  <TableColumn>Upload Date</TableColumn>
                  <TableColumn>Associated Profile</TableColumn>
                  <TableColumn>Comments</TableColumn>
                </TableHeader>
                <TableBody>
                  <TableRow key="1">
                    <TableCell>
                      <img src="/path-to-gel-image.png" alt="Gel" style={{ width: '50px' }} />
                    </TableCell>
                    <TableCell>04-13-2022</TableCell>
                    <TableCell>Q124W</TableCell>
                    <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
                      Need to be revised
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfileSettings;
