import s3 from "../../s3config.js";
import { useUser } from '@/components/UserProvider';

const BUCKET_NAME = "d2dcurebucket"; // Replace with your S3 bucket name

export const uploadFileToS3 = (file: File, gelId: string) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: `gel-images/${gelId}/${file.name}`,
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