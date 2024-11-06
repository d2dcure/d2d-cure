import React, { useState, useEffect } from 'react';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import NavBar from '@/components/NavBar';
import firebaseAdmin from "../../../firebaseAdmin"; 
import { getAuth, deleteUser } from "firebase/auth";
import { auth } from "firebase-admin";
import { Button } from "@nextui-org/react";
import Link from "next/link";

function UserManagement() {
  const [institutions, setInstitutionsList] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [checkedUsers, setCheckedUsers] = useState<{ [key: number]: boolean }>({});
  const { user, loading } = useUser();
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: string }>({ key: '', direction: '' });

  useEffect(() => {
    const fetchInstitutions = async () => {
      const response = await fetch('/api/getInstitutions');
      const data = await response.json();
      //console.log(data); 
      setInstitutionsList(data);
    };

    const fetchAllUsers = async () => {
      const response = await fetch('/api/getAllUsers');
      const data = await response.json();
      setAllUsers(data);
      //console.log(data);
    };

    fetchInstitutions();
    fetchAllUsers();
  }, []);

  if (loading) {
      return <p>Loading</p>
  }

  //protect pages if status is not admin or professor
  if (!user?.status) {
      return (
          <>
              <NavBar />
              <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
                  <h1 className="text-6xl font-bold text-[#06B7DB]">🔬 Access Denied!</h1>
                  <p className="text-2xl text-gray-600 mb-8">
                      Hold on, science enthusiast! You need to log in to manage our research team.
                  </p>
                  <Link href="/login" passHref>
                      <Button color="primary" className="bg-[#06B7DB]">
                          Enter the Lab 🧪
                      </Button>
                  </Link>
              </div>
          </>
      )
  }

  if (user?.status !== "professor" && user?.status !== "ADMIN") {
      return (
          <>
              <NavBar />
              <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
                  <h1 className="text-6xl font-bold text-[#06B7DB]">🚫 Restricted Area</h1>
                  <p className="text-2xl text-gray-600 mb-8">
                      Sorry! This area is reserved for our lab leaders and administrators only.
                  </p>
                  <Link href="/dashboard" passHref>
                      <Button color="primary" className="bg-[#06B7DB]">
                          Back to Safety 🔬
                      </Button>
                  </Link>
              </div>
          </>
      )
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
    <div>
      <NavBar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ marginTop: '10px', marginBottom: '10px' }}>Welcome, {user.status}!</h1>
        <h2 style={{ marginBottom: '10px' }}>Members of labs at {user.institution}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            style={{ marginRight: '10px', marginBottom: '10px' }}
            onClick={handleApprove}
          >
            Approve
          </button>
          <button style={{ marginBottom: '10px' }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            onClick={() => {
              handleDeleteFirebase();
              handleDelete();
          }}
          >
            Delete
          </button>
        </div>
        <table>
        <thead>
              <tr>
                <th style={{ color: '#40E0D0', textDecoration: 'underline' }}>Check</th>
                <th
                  style={{ color: '#40E0D0', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => sortTable('user_name')}
                >
                  User Name
                </th>
                <th
                  style={{ color: '#40E0D0', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => sortTable('given_name')}
                >
                  Given Name
                </th>
                <th
                  style={{ color: '#40E0D0', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => sortTable('title')}
                >
                  Title
                </th>
                <th
                  style={{ color: '#40E0D0', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => sortTable('institution')}
                >
                  Institution
                </th>
                <th
                  style={{ color: '#40E0D0', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => sortTable('status')}
                >
                  Status/Role
                </th>
                <th
                  style={{ color: '#40E0D0', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => sortTable('pi')}
                >
                  PI
                </th>
                <th
                  style={{ color: '#40E0D0', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => sortTable('email')}
                >
                  Email
                </th>
                <th
                  style={{ color: '#40E0D0', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => sortTable('reg_date')}
                >
                  RegDate
                </th>
                <th
                  style={{ color: '#40E0D0', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => sortTable('approved')}
                >
                  Approved
                </th>
              </tr>
            </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id}>
                <td style={{ marginLeft: '10px' }}>
                  <input
                    type="checkbox"
                    checked={checkedUsers[user.id] || false}
                    onChange={() => handleCheckboxChange(user.id)}
                  />
                </td>
                <td>{user.user_name}</td>
                <td>{user.given_name}</td>
                <td>{user.title}</td>
                <td>{user.institution}</td>
                <td>{user.status}</td>
                <td>{user.pi}</td>
                <td>{user.email}</td>
                <td>{user.reg_date}</td>
                <td>{user.approved ? '1' : '0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;