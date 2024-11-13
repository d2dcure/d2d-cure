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
  
    const createUser = async (email:any, password:any) => {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log(`User created: ${email}`);
      } catch (error:any) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`User already exists: ${email}`);
        } else {
          console.error(`Error creating user ${email}:`, error);
        }
      }
    };
  
    const migrateUsers = async () => {
      for (let user of users) {
        await createUser(user.email, user.password);
        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
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
          <button onClick={migrateUsers}>Migrate Users to Firebase</button>
        </div>
      );

}

export default Migration;