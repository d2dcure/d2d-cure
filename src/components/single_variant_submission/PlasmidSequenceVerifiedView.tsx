import React, { useState } from 'react';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../s3config';

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

  const handlePlasmidFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (fileType !== 'ab1') {
        setFileError('Only .ab1 files are allowed');
        setPlasmidFile(null);
      } else if (file.size > 500000) {
        setFileError('Sequencing data files must be smaller than 500 kB');
        setPlasmidFile(null);
      } else {
        setFileError('');
        setPlasmidFile(file);
      }
    }
  };

  const updatePlasmid = async () => {
    if (!plasmidFile) {
      setFileError('*A data file must be uploaded');
      return;
    }

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
      setCurrentView('checklist'); // Navigate back to checklist

    } catch (error) {
      console.error('Error during file upload or database update:', error);
      setFileError('There was an error uploading the file or updating the database. Please try again.');
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

  return (
    <div className="space-y-4">
      <button
        className="text-blue-500 hover:text-blue-700"
        onClick={() => setCurrentView('checklist')}
      >
        &lt; Back to Checklist
      </button>
      <h2 className="text-2xl font-bold">Plasmid Sequence Verified?</h2>

      <label className="block">
        Upload File:
        <input
          type="file"
          onChange={handlePlasmidFileChange}
          className="mt-1 block w-full p-2 bg-gray-100 border rounded"
        />
      </label>
      {fileError && <p className="text-red-500">{fileError}</p>}

      <p className="text-lg font-semibold">
        Plasmid verified: {entryData.plasmid_verified ? 'Yes' : 'No'}
      </p>
      <p className="text-lg font-semibold">
        AB1 Filename: {entryData.ab1_filename || 'N/A'}{' '}
        {entryData.ab1_filename && (
          <span
            className="text-blue-500 hover:underline cursor-pointer"
            onClick={() => downloadFile(entryData.ab1_filename)}
          >
            (download)
          </span>
        )}
      </p>

      <button
        onClick={updatePlasmid}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save
      </button>
    </div>
  );
};

export default PlasmidSequenceVerifiedView;
