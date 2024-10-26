import React, { useState } from 'react';
import { useUser } from '@/components/UserProvider'; 
import s3 from '../../../s3config';

interface PlasmidSequenceVerifiedViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
}

const PlasmidSequenceVerifiedView: React.FC<PlasmidSequenceVerifiedViewProps> = ({
  entryData,
  setCurrentView,
}) => {
  const { user } = useUser(); 
  const [plasmidFile, setPlasmidFile] = useState<File | null>(null);

  const handlePlasmidFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setPlasmidFile(file);
  };

  const updatePlasmid = async () => {
    if (!plasmidFile) return;

    const fileExtension = plasmidFile.name.split('.').pop();
    const newFileName = `${user.user_name}-BglB-${entryData.resid}${entryData.resnum}${entryData.resmut}-${entryData.id}.${fileExtension}`;
    const newFile = new File([plasmidFile], newFileName, { type: plasmidFile.type });

    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `sequencing/${newFileName}`,
        Body: newFile,
        ContentType: plasmidFile.type,
      };
      const data = await s3.upload(params).promise();
      console.log('File uploaded successfully:', data.Location);

      const response = await fetch('/api/updateCharacterizationDataPlasmidStuff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entryData.id,
          ab1_filename: newFileName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update database');
      }

      setCurrentView('checklist');
    } catch (error) {
      console.error('Error uploading plasmid file:', error);
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
      <h2 className="text-2xl font-bold text-left">Plasmid Sequence Verified?</h2>
      <div className="flex flex-col space-y-2">
        <label className="block">
          Upload File:
          <input
            type="file"
            onChange={handlePlasmidFileChange}
            className="mt-1 block w-full p-2 bg-gray-100 border border-gray-300 rounded"
          />
        </label>
        {plasmidFile && <p>Selected file: {plasmidFile.name}</p>}
      </div>
      <div className="flex justify-start space-x-2">
        <button
          onClick={updatePlasmid}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default PlasmidSequenceVerifiedView;
