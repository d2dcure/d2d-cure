import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/UserProvider';
import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card';
import { ArrowLeftIcon, FileTextIcon, DownloadIcon, XIcon, LoaderIcon, AlertTriangleIcon } from 'lucide-react';

/**
 * Helper to get a presigned download URL from /api/s3, then fetch the file
 */
async function fetchFileFromS3(folder: string, filename: string): Promise<Blob> {
  // 1. Call our Next.js API to get a presigned URL
  const resp = await fetch(`/api/s3?folder=${folder}&download=${filename}`);
  if (!resp.ok) {
    throw new Error('Failed to get presigned download URL');
  }
  const { presignedUrl } = await resp.json(); // { presignedUrl, fileKey }

  // 2. Download the actual file from that presigned URL
  const fileResp = await fetch(presignedUrl);
  if (!fileResp.ok) {
    throw new Error('Failed to download file from S3');
  }
  return fileResp.blob();
}

/**
 * Helper to upload a file as base64 to /api/s3
 */
async function uploadFileToS3(folder: string, newFileName: string, fileBase64: string) {
  const resp = await fetch(`/api/s3?folder=${folder}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newFileName, fileBase64 })
  });
  if (!resp.ok) {
    throw new Error('Failed to upload file to S3');
  }
  return resp.json(); // { message, objectKey, url }
}

/** Convert a Blob (or File) to base64 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // e.g. data:<type>;base64,<...>
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


interface PlasmidSequenceVerifiedViewProps {
	enzyme: string;
	entryData: any;
	setCurrentView: (view: string) => void;
	updateEntryData: (newData: any) => void;
}


const PlasmidSequenceVerifiedView: React.FC<PlasmidSequenceVerifiedViewProps> = ({
	enzyme,
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

  // On component mount, if there's an existing ab1_filename, show it
  useEffect(() => {
    if (entryData.ab1_filename) {
      setSelectedFileName(entryData.ab1_filename);
      setShowUploadBox(false); 
    }
  }, [entryData.ab1_filename]);

  /** Validate & store the chosen .ab1 file */
  const handleFile = (file: File) => {
    if (file) {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (fileType !== 'ab1') {
        setFileError('Only .ab1 files are allowed');
        setPlasmidFile(null);
        setSelectedFileName(null);
        setShowUploadBox(true);
      } else if (file.size > 500_000) {
        setFileError('File must be smaller than 500 kB');
        setPlasmidFile(null);
        setSelectedFileName(null);
        setShowUploadBox(true);
      } else {
        setFileError('');
        setPlasmidFile(file);
        setSelectedFileName(file.name);
        setShowUploadBox(false);
      }
    }
  };

  /** Handle file selection from <input type="file" /> */
  const handlePlasmidFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) handleFile(file);
  };

  /** Drag events */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
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

  /** 
   * Upload the .ab1 file => store in S3 => update DB
   */
  const updatePlasmid = async () => {
    if (!plasmidFile) {
      setFileError('*A data file must be uploaded');
      return;
    }
    setIsSubmitting(true);

    // Build the final name for your S3 key
    const newFileName = `${user?.user_name ?? 'unknown'}-${enzyme}-${
      entryData.resid
    }${entryData.resnum}${entryData.resmut}-${entryData.id}.ab1`;

    try {
      // 1) Convert the .ab1 file to base64
      const fileBase64 = await blobToBase64(plasmidFile);

      // 2) Upload to S3 => folder = "sequencing"
      await uploadFileToS3('sequencing', newFileName, fileBase64);
      alert('File uploaded successfully!');

      // 3) Update the database
      const response = await fetch('/api/updateCharacterizationDataPlasmidStuff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
		enzyme: enzyme,
          id: entryData.id,
          plasmid_verified: true,
          ab1_filename: newFileName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update entry data in the database');
      }

      const updatedEntry = await response.json();
      updateEntryData(updatedEntry);
      setShowUploadBox(false);
	  setCurrentView('checklist');
    } catch (error) {
      console.error('Error during file upload or database update:', error);
      setFileError(
        'There was an error uploading the file or updating the database. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 
   * Download existing file from S3 
   */
  const downloadFile = async (filename: string) => {
    try {
      // 1) fetch the ab1 file from /api/s3 => get presigned URL => fetch => Blob
      const blob = await fetchFileFromS3('sequencing', filename);

      // 2) Trigger a browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating download link:', error);
      setFileError('Could not generate download link. Please try again.');
    }
  };

  const clearSelection = () => {
    setPlasmidFile(null);
    setSelectedFileName(null);
    setFileError('');
    setShowUploadBox(true);
  };

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-4 border-b border-gray-100">
        <button
          className="text-[#06B7DB] hover:text-[#05a5c6] text-sm mb-4 flex items-center gap-2 transition-colors"
          onClick={() => setCurrentView('checklist')}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to checklist
        </button>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-800">Plasmid Sequence Verified</h2>
          <span
            className={`text-xs font-medium rounded-full px-3 py-1 ${
              entryData.plasmid_verified ? 'text-green-700 bg-green-100' : 'text-yellow-700 bg-yellow-100'
            }`}
          >
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Sequencing File</label>
            <div>
              {selectedFileName && (
                <div className="mb-4">
                  <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileTextIcon className="w-5 h-5 text-[#06B7DB]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{selectedFileName}</p>
                        {plasmidFile && (
                          <p className="text-xs text-gray-500">
                            {(plasmidFile.size / 1024).toFixed(1)} kB
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* If this file matches what's in the DB, show "Download" */}
                      {selectedFileName === entryData.ab1_filename && (
                        <button
                          onClick={() => downloadFile(selectedFileName)}
                          className="text-xs font-medium text-[#06B7DB] bg-[#06B7DB]/10 px-3 py-1.5 rounded-full hover:bg-[#06B7DB]/20 transition-colors inline-flex items-center gap-1"
                        >
                          <DownloadIcon className="w-4 h-4" />
                          Download
                        </button>
                      )}
                      <button
                        onClick={clearSelection}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Remove file"
                      >
                        <XIcon className="w-5 h-5" />
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
                    <FileTextIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
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
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {fileError && (
              <div className="mt-2 text-sm flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-md">
                <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
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
            disabled={!plasmidFile || isSubmitting || entryData.curated}
          >
            {isSubmitting ? (
              <>
                <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Submitting
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>

        <span className="text-xs text-gray-500">Only .ab1 files under 500 kB are accepted</span>
      </CardFooter>
    </Card>
  );
};

export default PlasmidSequenceVerifiedView;
