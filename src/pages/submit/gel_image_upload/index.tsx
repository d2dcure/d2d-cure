import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@nextui-org/react";
import { DeleteIcon } from "@nextui-org/shared-icons";
import { useUser } from "@/components/UserProvider";
import { AuthChecker } from "@/components/AuthChecker";
import NavBar from "@/components/NavBar";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { useRouter } from "next/router";
import Toast from "@/components/Toast";
import Footer from "@/components/Footer";

/** 
 * Converts a File object to base64 (without the data: prefix).
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is something like "data:image/png;base64,AAAA..."
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a base64-encoded file to S3 by calling your Next.js API:
 * POST /api/s3?folder=gel-images
 *  { newFileName, fileBase64 }
 */
async function uploadFileToS3(
  folder: string,
  newFileName: string,
  fileBase64: string
) {
  const endpoint = `/api/s3?folder=${encodeURIComponent(folder)}`;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newFileName, fileBase64 }),
  });
  if (!resp.ok) {
    throw new Error(
      `Failed to upload file to /api/s3 (folder=${folder}): ${resp.statusText}`
    );
  }
  return resp.json(); // { message, objectKey, url }
}

const DragAndDropUpload: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uniqueLabel, setUniqueLabel] = useState("");
  const [toastInfo, setToastInfo] = useState<{
    show: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({
    show: false,
    type: "info",
    title: "",
    message: "",
  });

  // formData for user/institution/date
  const [formData, setFormData] = useState({
    userName: user?.user_name || "",
    institution: user?.institution || "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        userName: user.user_name || "",
        institution: user.institution || "",
      }));
    }
  }, [user]);

  // Handle the dropped file from react-dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif"],
    },
  });

  // Clears the current file
  const handleDeleteFile = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  // Main upload handler
  const handleUpload = async () => {
    if (!selectedFile) {
      setToastInfo({
        show: true,
        type: "error",
        title: "No File Selected",
        message: "Please select a file to upload",
      });
      return;
    }
    if (!uniqueLabel.trim()) {
      setToastInfo({
        show: true,
        type: "error",
        title: "Unique Identifier Required",
        message: "Please enter a unique label for the gel.",
      });
      return;
    }

    setIsUploading(true);
    try {
      // For the final file name
      const dateObj = new Date(formData.date);
      const formattedDate = dateObj
        .toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })
        .replace(/\//g, "-");

      // e.g. institution-uniqueLabel-username-mm-dd-yy.ext
      const extension = selectedFile.type.split("/")[1] || "png";
      const newFileName = `${formData.institution}-${uniqueLabel}-${formData.userName}-${formattedDate}.${extension}`;

      // Convert file to base64
      const fileBase64 = await fileToBase64(selectedFile);
      // Upload to /api/s3?folder=gel-images
      await uploadFileToS3("gel-images", newFileName, fileBase64);

      // Show success toast
      setToastInfo({
        show: true,
        type: "success",
        title: "Upload Successful",
        message: `File "${newFileName}" has been uploaded successfully`,
      });

      // Reset state
      setPreview(null);
      setSelectedFile(null);
      setUniqueLabel("");
    } catch (error) {
      console.error("Error uploading file:", error);
      setToastInfo({
        show: true,
        type: "error",
        title: "Upload Failed",
        message: "Failed to upload file. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <NavBar />
      <AuthChecker minimumStatus="student">
        <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs className="mb-2">
              <BreadcrumbItem href="/">Home</BreadcrumbItem>
              <BreadcrumbItem href="/submit">
                Data Analysis &amp; Submission
              </BreadcrumbItem>
              <BreadcrumbItem href="/submit/gel_image_upload">
                Gel Image Upload
              </BreadcrumbItem>
            </Breadcrumbs>

            <div className="pt-8">
              <h1 className="text-2xl md:text-2xl lg:text-4xl font-inter dark:text-white mb-4">
                Gel Image Upload
              </h1>
              <p className="text-gray-500 mb-8">
                Upload an image file of your SDS-PAGE gel. Please ensure that
                the lanes are properly labeled.
              </p>

              <div className="max-w-2xl space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Name
                    </label>
                    <input
                      type="text"
                      value={formData.userName}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution
                    </label>
                    <input
                      type="text"
                      value={formData.institution}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unique Label
                    </label>
                    <input
                      type="text"
                      value={uniqueLabel}
                      onChange={(e) => setUniqueLabel(e.target.value)}
                      placeholder="Enter unique identifier"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#06B7DB] focus:ring-1 focus:ring-[#06B7DB] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Gel Image
                    </label>
                    <div {...getRootProps()}>
                      {preview ? (
                        <div className="mt-1 p-4 border border-gray-300 rounded-md">
                          <div className="relative w-full h-48">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFile();
                              }}
                              className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors duration-200"
                              aria-label="Delete attachment"
                            >
                              <DeleteIcon className="h-5 w-5 text-gray-600" />
                            </button>
                            <img
                              src={preview}
                              alt="Preview"
                              className="w-full h-full object-contain rounded-lg"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <div className="flex text-sm text-gray-600">
                              <span className="relative cursor-pointer rounded-md font-medium text-[#06B7DB] hover:text-[#05a5c6]">
                                Upload a file
                                <input {...getInputProps()} />
                              </span>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 50MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Up to 50 MB</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    className="bg-[#06B7DB] text-white flex-1"
                    onClick={handleUpload}
                    disabled={isUploading || !selectedFile}
                  >
                    {isUploading ? "Uploading..." : "Upload Gel Image"}
                  </Button>

                  <Button
                    className="bg-gray-100 text-gray-700 flex-1 hover:bg-gray-200"
                    onClick={() => router.push("/submit/gel_image_upload/all")}
                  >
                    View All Gel Images
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Toast
          show={toastInfo.show}
          type={toastInfo.type}
          title={toastInfo.title}
          message={toastInfo.message}
          onClose={() =>
            setToastInfo((prev) => ({
              ...prev,
              show: false,
            }))
          }
        />
      </AuthChecker>
      <Footer />
    </>
  );
};

export default DragAndDropUpload;
