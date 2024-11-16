import React, { useState, useEffect } from 'react';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import NavBar from '@/components/NavBar';
import firebaseAdmin from "../../../firebaseAdmin"; 
import { getAuth, deleteUser } from "firebase/auth";
import { auth } from "firebase-admin";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@nextui-org/table";
import { Button, Link, Checkbox} from "@nextui-org/react";
import StatusChip from '@/components/StatusChip';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { AuthChecker } from '@/components/AuthChecker';

function UserManagement() {
  const [institutions, setInstitutionsList] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [checkedUsers, setCheckedUsers] = useState<{ [key: number]: boolean }>({});
  const { user, loading } = useUser();
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: string }>({ key: '', direction: '' });
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'top' | 'bottom' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await fetch('/api/getInstitutions');
        if (!response.ok) {
          throw new Error(`Failed to fetch institutions: ${response.statusText}`);
        }
        const data = await response.json();
        setInstitutionsList(data);
      } catch (err) {
        console.error('Error fetching institutions:', err);
        setError('Failed to load institutions. Please try again later.');
      }
    };

    const fetchAllUsers = async () => {
      try {
        const response = await fetch('/api/getAllUsers');
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        const data = await response.json();
        setAllUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      }
    };

    fetchInstitutions();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToBottom(window.scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPosition = (position: 'top' | 'bottom') => {
    setIsScrolling(true);
    setScrollDirection(position);
    
    if (position === 'top') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      const tableElement = document.getElementById('user-management-table');
      if (tableElement) {
        const tableBottom = tableElement.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;
        const scrollTarget = window.pageYOffset + tableBottom - windowHeight + 100;
        
        window.scrollTo({
          top: scrollTarget,
          behavior: 'smooth'
        });
      }
    }

    setTimeout(() => {
      setIsScrolling(false);
      setScrollDirection(null);
    }, 1000);
  };

  if (loading) {
      return <p>Loading</p>
  }

  //filter users based on university name
const filteredUsers: any[] = [];
  for(let i = 0; i<allUsers.length; i++){
    if(user.institution == allUsers[i].institution){
      filteredUsers.push(allUsers[i]);
    }
  }
  console.log("Filtered Users", filteredUsers);

    // Sorting function
    const sortTable = (key: string) => {
      let direction = 'ascending';
      if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      setSortConfig({ key, direction });
    };
  
    // Sorting logic
    const sortedUsers = [...filteredUsers].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });


  const handleCheckboxChange = (userId: number) => {
    setCheckedUsers((prevState) => ({
      ...prevState,
      [userId]: !prevState[userId],
    }));
  };

  const handleApprove = async () => {
    const updatedUsers = allUsers.map((user) => ({
      ...user,
      approved: checkedUsers[user.id] ? true : user.approved,
    }));

    setAllUsers(updatedUsers);
    try {
      const updatedUsers = await Promise.all(
        Object.keys(checkedUsers).map(async (userIdKey: string) => {
          const userId = parseInt(userIdKey); 
          await fetch('/api/approveUsers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              checkedUsers: {
                [userId]: checkedUsers[userId], 
              },
            }),
          });
          return {
            id: userId,
            approved: checkedUsers[userId],
          };
        })
      );
  
      console.log("Updated Users: ", updatedUsers);
    } catch (error) {
      console.error('Error approving user:', error);
    }
  

  
    };

  const handleDelete = async () => {
    //only fill array with users that are not checked
    const updatedUsers = allUsers.filter(user => !checkedUsers[user.id]);
    setAllUsers(updatedUsers);

    try {
      const deletedUsers = await fetch('/api/deleteUsers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkedUsers,
        }),
      }).then(res => res.json());
  
      console.log("Deleted Users: ", deletedUsers);
      
  
    } catch (error) {
      console.error('Error deleting users:', error);
    }
  };

const handleDeleteFirebase = async () => {
    const usersToDelete = Object.keys(checkedUsers)
      .filter((userId: string) => checkedUsers[parseInt(userId, 10)]);

      const userEmails = usersToDelete.map(userId => {
        const user = allUsers.find(u => u.id === parseInt(userId, 10));
        return user ? user.email : null;
      });
    
      const validEmails = userEmails.filter(email => email !== null);
    
      console.log('User Emails:', validEmails);

    

    try {
      const response = await fetch('/api/firebaseDelete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usersToDelete, validEmails }),
      });
      if (response.ok) {
        console.log('Users deleted successfully');
      } else {
        console.error('Failed to delete users:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting users:', error);
    }
  };
  
  return (
    <AuthChecker minimumStatus="professor">
      <NavBar />
      <div className="px-3 md:px-4 lg:px-15 py-4 lg:py-10 mb-10 bg-white">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {/* Scroll notification */}
        {isScrolling && scrollDirection && (
          <div className="fixed top-4 right-4 bg-white/80 backdrop-blur-md border border-gray-200 
            text-gray-600 px-3 py-1.5 rounded-lg shadow-sm z-50 animate-fade-in text-xs">
            Scrolling to {scrollDirection}
          </div>
        )}

        {/* Scroll buttons */}
        {showScrollToBottom && (
          <button
            onClick={() => scrollToPosition('bottom')}
            className="fixed bottom-6 right-6 bg-white/80 backdrop-blur-md border border-gray-200 
              text-[#06B7DB] hover:text-[#06B7DB]/80 hover:bg-white/90 
              p-1.5 rounded-lg shadow-sm transition-all z-50 h-7 w-7 
              flex items-center justify-center"
            aria-label="Scroll to bottom"
          >
            <FaArrowDown size={12} />
          </button>
        )}

        {!showScrollToBottom && (
          <button
            onClick={() => scrollToPosition('top')}
            className="fixed bottom-6 right-6 bg-white/80 backdrop-blur-md border border-gray-200 
              text-[#06B7DB] hover:text-[#06B7DB]/80 hover:bg-white/90 
              p-1.5 rounded-lg shadow-sm transition-all z-50 h-7 w-7 
              flex items-center justify-center"
            aria-label="Scroll to top"
          >
            <FaArrowUp size={12} />
          </button>
        )}

        <div className="max-w-7xl mx-auto">
          <Breadcrumbs className="mb-4">
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/user-settings">User Settings</BreadcrumbItem>
            <BreadcrumbItem>User Management</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-3">
            <h1 className="mb-4 text-4xl md:text-4xl lg:text-4xl font-inter dark:text-white">
              User Management
            </h1>
            <p className="text-gray-500 mb-8">Members of labs at {user.institution}</p>

            <div className="flex justify-end gap-2 mb-4">
              <Button
                color="danger"
                variant="bordered"
                onClick={() => {
                  handleDeleteFirebase();
                  handleDelete();
                }}
                className="rounded-lg text-sm"
              >
                Remove User
              </Button>
              <Button
                className="bg-[#06B7DB] text-white rounded-lg text-sm"
                onClick={handleApprove}
              >
                Approve
              </Button>
            </div>

            <div id="user-management-table">
              <Table
                aria-label="Members Table"
                classNames={{
                  wrapper: "min-h-[400px]",
                }}
              >
                <TableHeader>
                  <TableColumn width="40">Check</TableColumn>
                  <TableColumn width="40" onClick={() => setSortConfig({ key: 'user_name', direction: 'ascending' })}>Username</TableColumn>
                  <TableColumn width="40">Given Name</TableColumn>
                  <TableColumn width="40">Title</TableColumn>
                  <TableColumn width="40">Institution</TableColumn>
                  <TableColumn width="40">Status/Role</TableColumn>
                  <TableColumn width="40">PI</TableColumn>
                  <TableColumn width="40">Email</TableColumn>
                  <TableColumn width="40">Registered Date</TableColumn>
                  <TableColumn width="40">Approved</TableColumn>
                </TableHeader>

                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          isSelected={checkedUsers[user.id] || false}
                          onChange={() => setCheckedUsers(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                        />
                      </TableCell>
                      <TableCell>{user.user_name}</TableCell>
                      <TableCell>{user.given_name}</TableCell>
                      <TableCell>{user.title}</TableCell>
                      <TableCell>{user.institution}</TableCell>
                      <TableCell>{user.status}</TableCell>
                      <TableCell>{user.pi}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.reg_date}</TableCell>
                      <TableCell>
                        <StatusChip 
                          status={user.approved ? 'approved' : 'pending_approval'} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </AuthChecker>
  );
}

export default UserManagement;