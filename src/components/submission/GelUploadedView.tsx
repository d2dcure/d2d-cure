import React, { useEffect, useState, useCallback } from 'react';
import s3 from '../../../s3config';
import { useUser } from '@/components/UserProvider';
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
import { useRouter } from 'next/router';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@nextui-org/table";
import { useDropzone } from "react-dropzone";
import { Spinner } from "@nextui-org/react";
import { DeleteIcon } from "@nextui-org/shared-icons";
import Toast from '@/components/Toast';

interface GelUploadedViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

// Add new form data interface
interface UploadFormData {
  userName: string;
  institution: string;
  date: string;
}

const GelUploadedView: React.FC<GelUploadedViewProps> = ({
  entryData,
  setCurrentView,
  updateEntryData
}) => {
  const { user } = useUser();
  const router = useRouter();
  const [gelImages, setGelImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [view, setView] = useState<'choose' | 'upload' | 'select'>('choose');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toastInfo, setToastInfo] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({
    show: false,
    type: 'info',
    message: ''
  });
  const [formData, setFormData] = useState<UploadFormData>({
    userName: user?.user_name || '',
    institution: user?.institution || '',
    date: new Date().toISOString().split('T')[0]
  });

  // Update form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        userName: user.user_name || '',
        institution: user.institution || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchGelImages = async () => {
      const params = {
        Bucket: 'd2dcurebucket',
        Prefix: `gel-images/${entryData.institution}`,
      };
      try {
        const data = await s3.listObjectsV2(params).promise();
        if (data && data.Contents) {
          setGelImages(
            data.Contents.map((file) => ({
              key: file.Key,
              url: `https://${params.Bucket}.s3.amazonaws.com/${file.Key}`,
            }))
          );
          if (entryData.gel_filename) {
            const initial = data.Contents.find(
              (file:any) => file.Key.split('/').pop() === entryData.gel_filename
            );
            if (initial && initial.Key) {
              setInitialImage(`https://${params.Bucket}.s3.amazonaws.com/${initial.Key}`);
              setSelectedImage(initial.Key); // Preselect current image if it exists
            }
          }
        }
      } catch (err) {
        console.error('Error fetching gel images:', err);
        setError('Failed to fetch gel images.');
      }
    };

    fetchGelImages();
  }, [entryData.institution, entryData.gel_filename]);

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
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    }
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const dateObj = new Date(formData.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '-');

    const newFileName = `${formData.institution}-${entryData.resid}${entryData.resnum}${entryData.resmut}-${formData.userName}-${formattedDate}.${selectedFile.type.split('/')[1]}`;
    
    const params = {
      Bucket: 'd2dcurebucket',
      Key: `gel-images/${newFileName}`,
      Body: selectedFile,
    };

    try {
      await s3.upload(params).promise();
      setUploadedFileName(newFileName);
      setSelectedImage(`gel-images/${newFileName}`);
      setInitialImage(`https://${params.Bucket}.s3.amazonaws.com/gel-images/${newFileName}`);
      await handleSave();
      
      // Update the entry data locally
      updateEntryData({
        ...entryData,
        gel_filename: newFileName
      });

      setToastInfo({
        show: true,
        type: 'success',
        message: 'File uploaded and linked successfully'
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      setToastInfo({
        show: true,
        type: 'error',
        message: 'Failed to upload file'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const filenameToSave = selectedImage || uploadedFileName;

    if (!filenameToSave) {
      setError('Please select or upload an image before saving.');
      return;
    }

    try {
      const response = await fetch('/api/updateCharacterizationDataGelFilename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryData.id, gel_filename: filenameToSave.split('/').pop() }),
      });

      if (response.ok) {
        const updatedEntry = await response.json();
        updateEntryData(updatedEntry);
        setCurrentView('checklist');
      } else {
        console.error('Failed to update gel filename');
        setError('Failed to save the selected image.');
      }
    } catch (error) {
      console.error('Error saving gel filename:', error);
      setError('An error occurred while saving the selected image.');
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-4 border-b border-gray-100">
        <button 
          className="text-[#06B7DB] hover:text-[#05a5c6] text-sm mb-4 flex items-center gap-2 transition-colors"
          onClick={() => {
            if (view === 'choose') {
              setCurrentView('checklist');
            } else {
              setView('choose');
            }
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {view === 'choose' ? 'Back to checklist' : 'Back to options'}
        </button>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-800">
            {view === 'choose' ? 'Gel Image Upload' : 
             view === 'upload' ? 'Upload New Gel Image' : 'Select Existing Gel Image'}
          </h2>
          {view === 'choose' && (
            <span className={`text-xs font-medium rounded-full px-3 py-1 ${
              entryData.gel_filename 
                ? "text-green-700 bg-green-100" 
                : "text-yellow-700 bg-yellow-100"
            }`}>
              {entryData.gel_filename ? "Complete" : "Incomplete"}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {view === 'choose' 
            ? 'Choose how you would like to add your gel image'
            : view === 'upload' 
              ? 'Upload a new gel image from your computer'
              : 'Select from your previously uploaded gel images'}
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6">
        {view === 'choose' ? (
          <CardBody className="px-6 py-6">
            {initialImage ? (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Currently Selected Image</h3>
                </div>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={initialImage} 
                        alt="Selected gel" 
                        className="h-16 w-16 object-cover rounded"
                      />
                      <span className="text-sm text-gray-600">
                        {selectedImage?.split('/').pop()}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setInitialImage(null);
                        setSelectedImage(null);
                        updateEntryData({ ...entryData, gel_filename: null });
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setView('upload')}
                className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#06B7DB] 
                  hover:bg-blue-50/50 transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#06B7DB]/10 text-[#06B7DB] group-hover:bg-[#06B7DB]/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Upload New Gel Image</h3>
                    <p className="text-sm text-gray-500">
                      Upload a new gel image from your computer
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setView('select')}
                className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#06B7DB] 
                  hover:bg-blue-50/50 transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#06B7DB]/10 text-[#06B7DB] group-hover:bg-[#06B7DB]/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Select from Existing Images</h3>
                    <p className="text-sm text-gray-500">
                      Choose from previously uploaded gel images
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </CardBody>
        ) : view === 'upload' ? (
          <div className="grid grid-cols-1 gap-6 mb-6">
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
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
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
                          setPreview(null);
                          setSelectedFile(null);
                        }}
                        className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
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
                        <input {...getInputProps()} />
                        <p>Drag and drop a file here, or click to select</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 50MB</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Up to 50MB
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={`inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl text-white ${
                  !selectedFile || uploading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#06B7DB] hover:bg-[#05a5c6]'
                } transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2`}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload Image'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Table aria-label="Gel images table">
              <TableHeader>
                <TableColumn>PREVIEW</TableColumn>
                <TableColumn>FILENAME</TableColumn>
                <TableColumn>UPLOAD DATE</TableColumn>
                <TableColumn>ACTION</TableColumn>
              </TableHeader>
              <TableBody>
                {gelImages.map((image, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <img src={image.url} alt="" className="h-16 w-16 object-cover rounded" />
                    </TableCell>
                    <TableCell>{image.key.split('/').pop()}</TableCell>
                    <TableCell>

-                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => {
                          setSelectedImage(image.key);
                          setInitialImage(image.url);
                          handleSave();
                        }}
                        className="text-[#06B7DB] hover:text-[#05a5c6]"
                      >
                        Select
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardBody>

      <Toast
        show={toastInfo.show}
        type={toastInfo.type}
        title={toastInfo.type.charAt(0).toUpperCase() + toastInfo.type.slice(1)}
        message={toastInfo.message}
        onClose={() => setToastInfo(prev => ({ ...prev, show: false }))}
      />
    </Card>
  );
};

export default GelUploadedView;
