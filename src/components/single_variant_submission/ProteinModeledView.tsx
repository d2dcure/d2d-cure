import React, { useState } from 'react';

interface ProteinModeledViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

const ProteinModeledView: React.FC<ProteinModeledViewProps> = ({ entryData, setCurrentView, updateEntryData }) => {
  const [WT, setWT] = useState<string>('');
  const [variant, setVariant] = useState<string>('');
  const [wtScoreWarning, setWTScoreWarning] = useState('');
  const [variantScoreWarning, setVariantScoreWarning] = useState('');
  const [deltaScoreWarning, setDeltaScoreWarning] = useState('');

  const expectedWTScore = -1089.697; // Example expected score

  const validateScores = () => {
    let isValid = true;

    // WT Score Validation
    if (parseFloat(WT) !== expectedWTScore) {
      setWTScoreWarning(
        `The expected score for the WT enzyme is ${expectedWTScore}. Please confirm and resubmit.`
      );
      isValid = false;
    } else {
      setWTScoreWarning(''); // Clear warning if valid
    }

    // Check if WT score and Variant score are identical
    if (parseFloat(WT) === parseFloat(variant)) {
      setVariantScoreWarning(
        'It is highly unlikely for both WT and Variant scores to be the same. Please confirm.'
      );
      isValid = false;
    } else {
      setVariantScoreWarning(''); // Clear warning if valid
    }

    // Delta Score Validation (within -20 to 20 range)
    const delta = parseFloat(variant) - parseFloat(WT);
    if (delta < -20 || delta > 20) {
      setDeltaScoreWarning(
        'Variants rarely express if the change in score is greater than 20. Please review the values.'
      );
      isValid = false;
    } else {
      setDeltaScoreWarning(''); // Clear warning if valid
    }

    return isValid;
  };

  const updateRosettaScore = async () => {
    if (!validateScores()) return; // Stop if validation fails

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

      const updatedEntry = await response.json();
      updateEntryData(updatedEntry);
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

      {/* Input Fields */}
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
        {wtScoreWarning && <p className="text-red-500">{wtScoreWarning}</p>}

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
        {variantScoreWarning && <p className="text-red-500">{variantScoreWarning}</p>}
      </div>

      {/* Current Rosetta Score */}
      <p className="text-lg font-semibold">
        Current Rosetta score value: {entryData.Rosetta_score !== null ? entryData.Rosetta_score : 'N/A'}
      </p>

      {/* Delta Score Warning */}
      {deltaScoreWarning && <p className="text-red-500">{deltaScoreWarning}</p>}

      {/* Save Button */}
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
