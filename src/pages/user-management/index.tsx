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
import {useAsyncList} from "@react-stately/data";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faCheck } from '@fortawesome/free-solid-svg-icons'; // Use a left chevron icon

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
          <div>
              <h1>Please login to gain access to this page.</h1>
          </div>
      )
  }

  if (user?.status !== "professor" && user?.status !== "ADMIN") {
      return (
          <div>
              <h1>You do not have permission to access this page.</h1>
          </div>
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
    <>
      <NavBar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: "48px", gap: "10px"}}>
        <h1 style={{ fontSize: "40px", marginBottom: "48px", textAlign: "left", alignSelf: "flex-start" }}>Manage Students</h1>

        <Table
          aria-label="Members Table"
          style={{
            height: "auto",
            borderRadius: "12px", 
            width: "100%",
            maxWidth: "1280px",
            padding: "0 32px",
          }}
          topContent={
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              width: '100%',
              gap: '10px',
              flexWrap: 'wrap',  // Allows wrapping on smaller screens
            }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Members of labs at {user.institution}</h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  color="danger"
                  variant="bordered"
                  onClick={() => {
                    handleDeleteFirebase();
                    handleDelete();
                  }}
                  style={{
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: "0.875rem",
                    minWidth: "90px"
                  }}
                >
                  Remove User
                </Button>

                <Button
                  variant="solid"
                  onClick={handleApprove}
                  style={{
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: "0.875rem",
                    color: 'white',
                    backgroundColor: 'var(--colors-base-primary, rgba(6, 183, 219, 1))',
                    minWidth: "90px"
                  }}
                >
                  Approve
                </Button>
              </div>
            </div>
          }
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
                <TableCell>{user.approved ? <FontAwesomeIcon icon={faCheck} /> : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default UserManagement;