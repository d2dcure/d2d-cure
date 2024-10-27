// components/single_variant_submission/MeltingPointView.tsx

import React, { useState } from 'react';

interface MeltingPointViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
}

const MeltingPointView: React.FC<MeltingPointViewProps> = ({
  entryData,
  setCurrentView,
}) => {
  const [tmMean, setTmMean] = useState<string>('');
  const [tmStdDev, setTmStdDev] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/updateMeltingPointValues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entryData.id,
          tm_mean: tmMean,
          tm_std_dev: tmStdDev,
        }),
      });

      if (response.ok) {
        console.log('Melting point values saved successfully');
        setIsSaved(true);
        setTimeout(() => setCurrentView('checklist'), 2000); // Redirect after a short delay
      } else {
        console.error('Failed to save melting point values');
      }
    } catch (error) {
      console.error('Error saving melting point values:', error);
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

      <h2 className="text-2xl font-bold">Melting Point Values Uploaded?</h2>

      <div className="mt-4">
        <input
          type="text"
          placeholder="Tm Mean (°C)"
          value={tmMean}
          onChange={(e) => setTmMean(e.target.value)}
          className="block w-full px-4 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="text"
          placeholder="Tm Standard Deviation (°C)"
          value={tmStdDev}
          onChange={(e) => setTmStdDev(e.target.value)}
          className="block w-full px-4 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="mt-4 flex space-x-4">
        <button
          className={`px-6 py-2 text-white font-semibold rounded ${
            isSaved ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
          }`}
          onClick={handleSave}
          disabled={!tmMean || !tmStdDev}
        >
          {isSaved ? 'Saved!' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default MeltingPointView;
