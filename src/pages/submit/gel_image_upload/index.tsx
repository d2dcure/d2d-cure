import React, { useCallback } from "react";
import { uploadFileToS3 } from "./s3Utils"; // We will create this function next

const DragAndDropUpload: React.FC = () => {
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
