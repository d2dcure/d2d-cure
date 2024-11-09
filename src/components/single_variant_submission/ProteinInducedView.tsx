import React, { useState } from 'react';

interface ProteinInducedViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

const ProteinInducedView: React.FC<ProteinInducedViewProps> = ({ entryData, setCurrentView, updateEntryData }) => {
  const [induced, setInduced] = useState('no');

  const updateProteinInduced = async () => {
    const isExpressed = induced === 'yes';
    try {
      const response = await fetch('/api/updateCharacterizationDataExpressed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: entryData.id,
          expressed: isExpressed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update protein induced status');
      }
      
      const updatedEntry = await response.json();
      updateEntryData(updatedEntry);
      setCurrentView('checklist');
    } catch (error) {
      console.error('Error updating protein induced status:', error);
    }
  };

  return (
    <div className="space-y-4">
      <button className="text-blue-500 hover:text-blue-700" onClick={() => setCurrentView('checklist')}>
        &lt; Back to Checklist
      </button>
      <h2 className="text-2xl font-bold">Protein Induced?</h2>
      <select
        value={induced}
        onChange={(e) => setInduced(e.target.value)}
        className="block w-full p-2 bg-gray-100 border border-gray-300 rounded"
      >
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>

      {/* Display Current Protein Induced Status */}
      <p className="text-lg font-semibold">
        Protein induced: {entryData.expressed === true ? 'Yes' : 'No'}
      </p>

      {/* Save button */}
      <button
        onClick={updateProteinInduced}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save
      </button>
    </div>
  );
};

export default ProteinInducedView;
