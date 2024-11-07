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
  <h1 style={{
      fontSize: "40px", 
      lineHeight: "28px", 
      width: "333px", 
      gap: "10px", 
      marginBottom: "48px", 
      textAlign: "left", 
      alignSelf: "flex-start"
  }}>
      Manage Students
  </h1>

  <Table
    aria-label="Members Table"

    style={{
      height: "auto",
      borderRadius: "12px", 
      width: "1280px",
      paddingTop: "18px", 
      paddingRight: "32px",
      paddingLeft: "32px",
      gap: "10px"
    }}
    topContent = {(
      <>
        <div style={{
        display: 'flex', // Use flexbox
        justifyContent: 'space-between', // Space between elements
        alignItems: 'center', // Center vertically
        marginBottom: '10px', // Optional: margin for spacing
      }}>
        <h2 style={{ margin: 0, marginTop: "10px", marginLeft: "10px" }}>Members of labs at {user.institution}</h2>
        <div style={{
          display: 'flex', // Use flexbox for buttons
          justifyContent: 'flex-end' // Align buttons to the right
        }}>
          <Button
            color="danger"
            variant="bordered"
            size="md"
            onClick={() => {
              handleDeleteFirebase();
              handleDelete();
            }}
            style={{
              borderRadius: '12px',
              width: '100px',
              height: '40px',
              borderWidth: '2px',
              paddingRight: '16px',
              marginTop: "10px",
              marginRight: "20px",
              gap: '12px'
            }}
          >
            Remove User
          </Button>

          <Button
            size="md" // Medium button size
            variant="solid" // Solid variant
            onClick={handleApprove}
            style={{
              marginRight: '10px', // Space between buttons
              borderRadius: '12px',
              width: '100px',
              height: '40px',
              paddingRight: '16px',
              paddingLeft: '16px',
              gap: '12px',
              color: 'white',
              marginTop: "10px",
              backgroundColor: 'var(--colors-base-primary, rgba(6, 183, 219, 1))'
            }}
          >
            Approve
          </Button>
        </div>
      </div>
      </>
    )}
  >


    <TableHeader>
      <TableColumn width = "40">Check</TableColumn>
      <TableColumn width = "40" onClick={() => sortTable('user_name')} style={{ cursor: 'pointer' }}>Username</TableColumn>
      <TableColumn width = "40" onClick={() => sortTable('given_name')} style={{ cursor: 'pointer' }}>Given Name</TableColumn>
      <TableColumn width = "40" onClick={() => sortTable('title')} style={{ cursor: 'pointer' }}>Title</TableColumn>
      <TableColumn width = "40" onClick={() => sortTable('institution')} style={{ cursor: 'pointer' }}>Institution</TableColumn>
      <TableColumn width = "40" onClick={() => sortTable('status')} style={{ cursor: 'pointer' }}>Status/Role</TableColumn>
      <TableColumn width = "40" onClick={() => sortTable('pi')} style={{ cursor: 'pointer' }}>PI</TableColumn>
      <TableColumn width = "40" onClick={() => sortTable('email')} style={{ cursor: 'pointer' }}>Email</TableColumn>
      <TableColumn width = "40" onClick={() => sortTable('reg_date')} style={{ cursor: 'pointer' }}>Registered Date</TableColumn>
      <TableColumn width = "40" onClick={() => sortTable('approved')} style={{ cursor: 'pointer' }}>Approved</TableColumn>
    </TableHeader>
    
    <TableBody>
      {sortedUsers.map((user) => (
        <TableRow key={user.id}>
          <TableCell>
            <Checkbox
              isSelected={checkedUsers[user.id] || false}
              onChange={() => handleCheckboxChange(user.id)}
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
            {user.approved ? <FontAwesomeIcon icon={faCheck} /> : ''}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
</>
  );
}

export default UserManagement;