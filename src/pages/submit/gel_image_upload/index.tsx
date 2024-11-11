import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadFileToS3 } from "./s3Utils"; // We will create this function next

const DragAndDropUpload: React.FC = () => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (file) {
      // Check if file is a JPEG
      if (file.type === "image/jpeg") {
        console.log("File is a JPEG. Proceeding with upload...");
        uploadFileToS3(file);
      } else {
        alert("Only JPEG files are allowed!");
      }
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
  });

  return (
    <div {...getRootProps({ className: "dropzone" })}>
      <input {...getInputProps()} />
      <p>Drag & drop a JPEG file here, or click to select a file</p>
    </div>
  );
};

export default DragAndDropUpload;