// This page needs to be redone so that the upload goes to AWS S3. See submit/single-variant/[id].tsx

import React, { useState, ChangeEvent } from 'react';
import axios from 'axios';
import { useUser } from '@/components/UserProvider';
import { AuthChecker } from '@/components/AuthChecker';
import NavBar from '@/components/NavBar';

function GelImage() {
  const { user } = useUser();

  const headingStyle = {
    fontFamily: 'Vetrena MF Thin, sans-serif',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  };

  const textBlockStyle = {
    fontFamily: 'Vetrena MF Thin, sans-serif',
    fontWeight: 'normal',
    color: '#333',
  };

  const [selectedFile, setSelectedFile] = useState<File|null>(null);
  const [gelID, setGelID] = useState<string>('');

  const handlegelIDChange = (event: ChangeEvent<HTMLInputElement>) => {
    setGelID(event.target.value);
  };

  const handleFileChange = (event:any) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedFile || !gelID) {
      alert("Please select a file and enter a Gel ID.");
      return;
    }
  
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const username = user?.user_name; 
    // Extract the file extension
    const fileExtension = selectedFile.name.split('.').pop();
    // Construct the filename with the original file extension
    const filename = `${date}_${username}_${gelID}.${fileExtension}`;
  
    const formData = new FormData();
    formData.append("file", selectedFile, filename);
  
    try {
      const response = await axios.post('http://localhost:5002/uploadGEL', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log("attempting to upload file... by user: " + user?.email);
      if (response.status === 200) {
        //alert the user that the file was uploaded successfully by current user's email
        alert("File uploaded successfully by username: " + user?.username);
        console.log("File uploaded successfully by username: " + user?.username);
        console.log("users username is " + user?.username);
      } else {
        alert("File upload failed.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file.");
    }
  };
  

  return (
    <>
      <NavBar />
      <AuthChecker minimumStatus="student">
        <div>
          <h2 style={headingStyle}>Gel Upload</h2>
          <input type="file" onChange={handleFileChange} />
          <div style={textBlockStyle}>Enter GEL ID:</div>
          <input type="text" onChange={handlegelIDChange} />
          <div style={{position: 'relative', top: '20px'}}>
            <button onClick={handleSubmit}>Upload</button>
          </div>
        </div>
      </AuthChecker>
    </>
  );
}

export default GelImage;