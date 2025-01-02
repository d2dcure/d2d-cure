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
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    filename: string;
    institution?: string;
    userName?: string;
    fileDate?: string;
  } | null>(null);

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
        setToastInfo({
          show: true,
          type: 'success',
          message: 'Gel image updated successfully'
        });
        setView('choose');
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
                      <div className="relative group">
                        <img 
                          src={initialImage} 
                          alt="Selected gel" 
                          className="h-16 w-16 object-cover rounded cursor-pointer"
                        />
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-50 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          onClick={() => setPreviewImage({
                            url: initialImage,
                            filename: selectedImage?.split('/').pop() || 'Image',
                            institution: entryData.institution,
                            userName: user?.user_name,
                            fileDate: new Date().toLocaleDateString('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              year: '2-digit'
                            })
                          })}
                        >
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </div>
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
                <TableColumn>INSTITUTION</TableColumn>
                <TableColumn>UPLOADED BY</TableColumn>
                <TableColumn>DATE</TableColumn>
                <TableColumn>ACTION</TableColumn>
              </TableHeader>
              <TableBody>
                {gelImages.map((image, index) => {
                  const filename = image.key.split('/').pop() || '';
                  const [institution, userName, datePart] = filename.split('-');
                  const fileDate = datePart ? datePart.split('.')[0] : 'N/A';
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <img 
                          src={image.url} 
                          alt="" 
                          className="h-16 w-16 object-cover rounded cursor-pointer" 
                          onClick={() => {
                            const filename = image.key.split('/').pop() || 'Image';
                            const [institution, userName, datePart] = filename.split('-');
                            const fileDate = datePart ? datePart.split('.')[0] : 'N/A';
                            
                            setPreviewImage({
                              url: image.url,
                              filename,
                              institution,
                              userName,
                              fileDate
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>{image.key.split('/').pop()}</TableCell>
                      <TableCell>{institution || 'N/A'}</TableCell>
                      <TableCell>{userName || 'N/A'}</TableCell>
                      <TableCell>{fileDate || 'N/A'}</TableCell>
                      <TableCell>
                        <button
                          onClick={async () => {
                            const filename = image.key.split('/').pop();
                            setSelectedImage(image.key);
                            setInitialImage(image.url);
                            
                            // Update the entry data with the new filename
                            const updatedData = {
                              ...entryData,
                              gel_filename: filename
                            };
                            
                            try {
                              const response = await fetch('/api/updateCharacterizationDataGelFilename', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  id: entryData.id, 
                                  gel_filename: filename 
                                }),
                              });

                              if (response.ok) {
                                const updatedEntry = await response.json();
                                updateEntryData(updatedEntry);
                                setView('choose');
                                setToastInfo({
                                  show: true,
                                  type: 'success',
                                  message: 'Gel image updated successfully'
                                });
                              } else {
                                throw new Error('Failed to update gel filename');
                              }
                            } catch (err) {
                              console.error('Error updating gel filename:', err);
                              setToastInfo({
                                show: true,
                                type: 'error',
                                message: 'Failed to update gel image'
                              });
                            }
                          }}
                          className="text-[#06B7DB] hover:text-[#05a5c6]"
                        >
                          Select
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white rounded-xl flex flex-col lg:flex-row w-full max-w-[95vw] lg:max-w-6xl 
              max-h-[95vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Preview */}
            <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center p-4 relative min-h-[300px]">
              <img
                src={previewImage.url}
                alt="Gel Image Preview"
                className="max-w-full max-h-[40vh] lg:max-h-[80vh] object-contain rounded-lg shadow-md"
              />
            </div>

            {/* Info Card */}
            <div className="w-full lg:w-[400px] p-4 sm:p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-800">Image Details</h3>
                  <p className="text-sm text-gray-500 mt-1">View image information</p>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setPreviewImage(null)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-600">Filename</label>
                  <p className="font-medium break-words mt-1 text-gray-800">{previewImage.filename}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-600">Institution</label>
                    <p className="font-medium mt-1 text-gray-800">{previewImage.institution || 'N/A'}</p>
                  </div>

                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-600">Date</label>
                    <p className="font-medium mt-1 text-gray-800">{previewImage.fileDate || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-600">Uploaded By</label>
                  <p className="font-medium mt-1 text-gray-800">{previewImage.userName || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default GelUploadedView;
