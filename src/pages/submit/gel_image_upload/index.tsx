// TODO: rename file before uploading to S3, something like [variant]-[institution]-[username].png 


import React, { useCallback } from "react";
import s3 from "../../../../s3config"; 
import { useUser } from '@/components/UserProvider'; 

const BUCKET_NAME = "d2dcurebucket"; 

const DragAndDropUpload: React.FC = () => {
  const uploadFileToS3 = (file: File) => {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `gel-images/${file.name}`,
      Body: file,
    };

    s3.upload(params, (err: any, data: any) => {
      if (err) {
        console.error("Error uploading file:", err);
        alert("Error uploading file.");
      } else {
        console.log("File uploaded successfully:", data.Location);
        alert(`File uploaded successfully: ${data.Location}`);
      }
    });
  };

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // Check if file is a JPEG or PNG
      if (file.type === "image/jpeg" || file.type === "image/png") {
        console.log("File is a JPEG or PNG. Proceeding with upload...");
        uploadFileToS3(file);
      } else {
        alert("Only JPEG and PNG files are allowed!");
      }
    }
  }, []);

  return (
    <div>
      <input type="file" accept=".jpeg,.jpg,.png" onChange={onFileChange} />
      <p>Click to select a JPEG or PNG file</p>
    </div>
  );
};

export default DragAndDropUpload;
