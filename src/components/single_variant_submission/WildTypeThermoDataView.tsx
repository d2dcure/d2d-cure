import React, { useEffect, useState } from 'react';

interface WildTypeThermoDataViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
}

const WildTypeThermoDataView: React.FC<WildTypeThermoDataViewProps> = ({
  entryData,
  setCurrentView,
}) => {
  const [tempData, setTempData] = useState<any[]>([]);
  const [tempWTId, setTempWTId] = useState<number | null>(null);

  // Fetch thermostability assay data on mount
  useEffect(() => {
    const fetchTempData = async () => {
      try {
        const response = await fetch('/api/getCharacterizationData');
        const data = await response.json();
        const filteredData = data.filter(
          (row: any) =>
            row.institution === entryData.institution && row.resid === 'X'
        );
        const ids = filteredData
          .map((row: any) => row.temp_raw_data_id)
          .filter((id: any) => id !== 0);

        const tempDataResponse = await fetch('/api/getTempRawDataFromIDs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });

        const tempDataResult = await tempDataResponse.json();
        setTempData(tempDataResult);
      } catch (error) {
        console.error('Error fetching temp data:', error);
      }
    };

    fetchTempData();
  }, [entryData.institution]);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/updateCharacterizationDataTempWTId', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryData.id, tempWTId }),
      });

      if (response.ok) {
        console.log('WT ID saved successfully:', tempWTId);
        setCurrentView('checklist');
      } else {
        console.error('Failed to save WT ID');
      }
    } catch (error) {
      console.error('Error saving WT ID:', error);
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
      <h2 className="text-2xl font-bold text-left">
        Wild Type Thermostability Assay Data Uploaded?
      </h2>
      <div>
        <table className="min-w-full divide-y divide-gray-200 mt-4">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enzyme
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Assayed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploaded By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tempData.map((row, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  BglB
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.assay_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.user_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setTempWTId(row.id)}
                    className={`text-indigo-600 hover:text-indigo-900 ${
                      tempWTId === row.id ? 'font-bold' : ''
                    }`}
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex space-x-4">
        <button
          className="px-6 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600"
          onClick={handleSave}
          disabled={!tempWTId}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default WildTypeThermoDataView;
