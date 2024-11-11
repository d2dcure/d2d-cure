import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadFileToS3 } from "./s3Utils"; // We will create this function next

const DragAndDropUpload: React.FC = () => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
  });

  return (
    <div {...getRootProps({ className: "dropzone" })}>
      <input {...getInputProps()} />
      <p>Drag & drop a JPEG or PNG file here, or click to select a file</p>
    </div>
  );
};

export default DragAndDropUpload;
