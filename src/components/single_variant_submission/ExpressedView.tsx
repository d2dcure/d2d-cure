import React, { useState } from 'react';

interface ExpressedViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
}

const ExpressedView: React.FC<ExpressedViewProps> = ({ entryData, setCurrentView }) => {
  const [yieldAvg, setYieldAvg] = useState<string>('');

  const updateYieldAverage = async () => {
    const roundedValue = parseFloat(parseFloat(yieldAvg).toFixed(2));
    try {
      const response = await fetch('/api/updateCharacterizationDataYieldAvg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: entryData.id,
          yield_avg: roundedValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update yield average');
      }
      setCurrentView('checklist');
    } catch (error) {
      console.error('Error updating yield average:', error);
    }
  };

  return (
    <div className="space-y-4">
      <button className="text-blue-500 hover:text-blue-700" onClick={() => setCurrentView('checklist')}>
        &lt; Back to Checklist
      </button>
      <h2 className="text-2xl font-bold">Enter Expressed Yield Average</h2>
      <input
        type="number"
        step="0.01"
        value={yieldAvg}
        onChange={(e) => setYieldAvg(e.target.value)}
        className="block w-full p-2 bg-gray-100 border border-gray-300 rounded"
        placeholder="Enter yield average"
      />

      {/* Display Current Yield Average */}
      <p className="text-lg font-semibold">
        Yield average value: {entryData.yield_avg !== null ? `${entryData.yield_avg} mg/ml` : 'N/A'}
      </p>

      {/* Save button */}
      <button
        onClick={updateYieldAverage}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save
      </button>
    </div>
  );
};

export default ExpressedView;
