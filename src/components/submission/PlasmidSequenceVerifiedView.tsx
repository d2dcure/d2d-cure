import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../s3config';
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";

interface PlasmidSequenceVerifiedViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

const PlasmidSequenceVerifiedView: React.FC<PlasmidSequenceVerifiedViewProps> = ({
  entryData,
  setCurrentView,
  updateEntryData
}) => {
  const { user } = useUser();
  const [plasmidFile, setPlasmidFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadBox, setShowUploadBox] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set initial filename from entryData when component mounts
  useEffect(() => {
    if (entryData.ab1_filename) {
      setSelectedFileName(entryData.ab1_filename);
      setShowUploadBox(false); // Hide upload box if there's an existing file
    }
  }, [entryData.ab1_filename]);

  const handleFile = (file: File) => {
    if (file) {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (fileType !== 'ab1') {
        setFileError('Only .ab1 files are allowed');
        setPlasmidFile(null);
        setSelectedFileName(null);
        setShowUploadBox(true); // Show upload box if file is invalid
      } else if (file.size > 500000) { // 500kB
        setFileError('File must be smaller than 500 kB');
        setPlasmidFile(null);
        setSelectedFileName(null);
        setShowUploadBox(true); // Show upload box if file is too large
      } else {
        setFileError('');
        setPlasmidFile(file);
        setSelectedFileName(file.name);
        setShowUploadBox(false); // Hide upload box when valid file is selected
      }
    }
  };

  const handlePlasmidFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) handleFile(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const updatePlasmid = async () => {
    if (!plasmidFile) {
      setFileError('*A data file must be uploaded');
      return;
    }

    setIsSubmitting(true);
    const newFileName = `${user.user_name}-BglB-${entryData.resid}${entryData.resnum}${entryData.resmut}-${entryData.id}.ab1`;

    try {
      // Step 1: Upload file to S3
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `sequencing/${newFileName}`,
        Body: plasmidFile,
        ContentType: plasmidFile.type,
      };
      await s3.upload(params).promise();
      alert('File uploaded successfully!');

      // Step 2: Update the database via the API endpoint
      const response = await fetch('/api/updateCharacterizationDataPlasmidStuff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entryData.id,
          ab1_filename: newFileName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update entry data in the database');
      }
      
      const updatedEntry = await response.json();
      updateEntryData(updatedEntry);
      setShowUploadBox(false);

    } catch (error) {
      console.error('Error during file upload or database update:', error);
      setFileError('There was an error uploading the file or updating the database. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadFile = async (filename: string) => {
    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `sequencing/${filename}`,
        Expires: 60, // URL expires in 60 seconds
      };
      const url = await s3.getSignedUrlPromise('getObject', params);
      window.open(url, '_blank'); // Open the URL in a new tab to trigger download
    } catch (error) {
      console.error('Error generating download link:', error);
      setFileError('Could not generate download link. Please try again.');
    }
  };

  const clearSelection = () => {
    setPlasmidFile(null);
    setSelectedFileName(null);
    setFileError('');
    setShowUploadBox(true); // Show upload box when selection is cleared
  };

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-4 border-b border-gray-100">
        <button 
          className="text-[#06B7DB] hover:text-[#05a5c6] text-sm mb-4 flex items-center gap-2 transition-colors"
          onClick={() => setCurrentView('checklist')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to checklist
        </button>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-800">Plasmid Sequence Verified</h2>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            entryData.plasmid_verified 
              ? 'text-green-700 bg-green-100' 
              : 'text-yellow-700 bg-yellow-100'
          }`}>
            {entryData.plasmid_verified ? 'Complete' : 'Incomplete'}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Upload your .ab1 sequencing file to verify the plasmid sequence
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Sequencing File
            </label>
            <div>
              {selectedFileName && (
                <div className="mb-4">
                  <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <svg className="w-5 h-5 text-[#06B7DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedFileName}
                        </p>
                        {plasmidFile && (
                          <p className="text-xs text-gray-500">
                            {(plasmidFile.size / 1024).toFixed(1)} kB
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedFileName === entryData.ab1_filename && (
                        <button
                          onClick={() => downloadFile(selectedFileName)}
                          className="text-xs font-medium text-[#06B7DB] bg-[#06B7DB]/10 px-3 py-1.5 rounded-full hover:bg-[#06B7DB]/20 transition-colors inline-flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      )}
                      <button
                        onClick={clearSelection}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Remove file"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showUploadBox && (
                <div
                  className={`
                    flex flex-col justify-center px-6 py-4
                    border-2 ${isDragging ? 'border-[#06B7DB]' : 'border-gray-300'}
                    border-dashed rounded-lg
                    transition-colors relative
                    ${isDragging ? 'bg-[#06B7DB]/5' : 'bg-gray-50'}
                  `}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <svg
                      className="mx-auto h-8 w-8 text-gray-400 mb-2"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <label className="cursor-pointer text-sm font-medium text-[#06B7DB] hover:text-[#05a5c6]">
                        Upload a file
                        <input
                          type="file"
                          onChange={handlePlasmidFileChange}
                          className="sr-only"
                          accept=".ab1"
                        />
                      </label>
                      <p className="text-sm text-gray-500">
                        or drag and drop
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {fileError && (
              <div className="mt-2 text-sm flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-md">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {fileError}
              </div>
            )}
          </div>
        </div>
      </CardBody>

      <CardFooter className="px-6 pb-6 pt-6 flex justify-between items-center border-t border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={updatePlasmid}
            className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!plasmidFile || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C9.545 0 5.965 3.93 4.95 8.87c-.197.813.302 1.623.805 2.126A8.07 8.07 0 0112 20c.966 0 1.897-.165 2.754-.479 1.952-1.07 3.36-2.59 3.81-4.574C18.728 13.186 16.524 11 14 11h-2v2h2c.567 0 1.098.149 1.574.426.476.277.815.684 1.005 1.184.427 1.17 1.057 2.097 1.993 2.823 1.329 1.322 2.878 2.002 4.597 2.002 1.719 0 3.268-.68 4.597-2.002 1.329-1.322 2.002-2.878 2.002-4.597 0-1.719-.68-3.268-2.002-4.597-1.329-1.322-2.878-2.002-4.597-2.002-1.719 0-3.268.68-4.597 2.002z"></path>
                </svg>
                Submitting
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
        
        <span className="text-xs text-gray-500">
          Only .ab1 files under 500 kB are accepted
        </span>
      </CardFooter>
    </Card>
  );
};

export default PlasmidSequenceVerifiedView;
