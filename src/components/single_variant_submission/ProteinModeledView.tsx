import React, { useState } from 'react';

interface ProteinModeledViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
}

const ProteinModeledView: React.FC<ProteinModeledViewProps> = ({ entryData, setCurrentView }) => {
  const [WT, setWT] = useState<string>('');
  const [variant, setVariant] = useState<string>('');

  const updateRosettaScore = async () => {
    try {
      const response = await fetch('/api/updateCharacterizationDataRosettaScore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entryData.id,
          Rosetta_score: parseFloat(variant) - parseFloat(WT),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update Rosetta score');
      }
      setCurrentView('checklist'); // Go back to checklist after saving
    } catch (error) {
      console.error('Error updating Rosetta score:', error);
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
      <h2 className="text-2xl font-bold text-left">Foldit Scores</h2>
      <div className="flex flex-col space-y-2">
        <label className="block">
          WT (starting) score:
          <input 
            type="text" 
            value={WT} 
            onChange={(e) => setWT(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-100 border border-gray-300 rounded"
            placeholder="Enter WT score"
          />
        </label>
        <label className="block">
          Variant (ending) score:
          <input 
            type="text" 
            value={variant} 
            onChange={(e) => setVariant(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-100 border border-gray-300 rounded"
            placeholder="Enter Variant score"
          />
        </label>
      </div>
      <div className="flex justify-start space-x-2">
        <button 
          onClick={updateRosettaScore}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default ProteinModeledView;
