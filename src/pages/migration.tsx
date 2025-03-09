// FIREBASE USERS MIGRATION SCRIPT 

import React, { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';


const Migration = () => {
    const [users, setUsers] = useState<any[]>([]);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/getAllUsers');
          const data = await response.json();
          setUsers(data);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
  
      fetchData();
    }, []);
  
    const createUser = async (email: any, password: any) => {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log(`User created: ${email}`);
      } catch (error: any) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            console.log(`User already exists: ${email}`);
            break;
          case 'auth/invalid-email':
            console.error(`Invalid email format: ${email}`);
            break;
          case 'auth/weak-password':
            console.error(`Password is too weak for user: ${email}`);
            break;
          case 'auth/operation-not-allowed':
            console.error('Email/password accounts are not enabled.');
            break;
          case 'auth/network-request-failed':
            console.error('Network error occurred.');
            break;
          case 'auth/too-many-requests':
            console.error('Too many requests. Please try again later.');
            break;
          default:
            console.error(`Error creating user ${email}:`, error);
        }
      }
    };
  
    const migrateUsers = async () => {
      const startIndex = 1000; // Start from the 50th user (index 49 in zero-based index)
      for (let i = startIndex; i < users.length; i++) {
        const user = users[i];
        await createUser(user.email, user.password);
        await new Promise(resolve => setTimeout(resolve, 250)); // 0.25 sec delay
      }
    };

    const deleteAllUsers = async () => {
      try {
        const response = await fetch('/api/deleteAllUsers', {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete users');
        }
        console.log('All users deleted successfully');
      } catch (error) {
        console.error('Error deleting users:', error);
      }
    };

    return (
        <div>
          <h1>Users</h1>
          {/* <ul>
            {users.map((user, index) => (
              <li key={index}>{user.email}</li> // Assuming 'name' is a field in the Users table
            ))}
          </ul> */}
          {/*<button onClick={migrateUsers}>Migrate Users to Firebase</button>*/}
          {/*<button onClick={deleteAllUsers}>Delete All Users</button>*/}
        </div>
      );

}

export default Migration;