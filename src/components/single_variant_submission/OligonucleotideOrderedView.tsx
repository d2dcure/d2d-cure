import React, { useState } from 'react';

interface OligonucleotideOrderedViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
}

const OligonucleotideOrderedView: React.FC<OligonucleotideOrderedViewProps> = ({
  entryData,
  setCurrentView,
}) => {
  const [oligoOrdered, setOligoOrdered] = useState<any>('no');

  const updateOligoOrdered = async () => {
    try {
      const isOrdered = oligoOrdered === 'yes';
      const response = await fetch('/api/updateCharacterizationDataOligoOrdered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entryData.id,
          oligo_ordered: isOrdered,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update oligonucleotide ordered status');
      }
      setCurrentView('checklist'); // Navigate back to checklist
    } catch (error) {
      console.error('Error updating oligonucleotide ordered status:', error);
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
      <h2 className="text-2xl font-bold text-left">Oligonucleotide Ordered?</h2>
      <div className="flex flex-col space-y-2">
        <label className="block">
          Order Status:
          <select 
            value={oligoOrdered} 
            onChange={(e) => setOligoOrdered(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-100 border border-gray-300 rounded"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>
      <div className="flex justify-start space-x-2">
        <button 
          onClick={updateOligoOrdered} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default OligonucleotideOrderedView;
