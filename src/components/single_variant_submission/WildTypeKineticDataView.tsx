import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider'; // Importing the user hook

interface WildTypeKineticDataViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
}

const WildTypeKineticDataView: React.FC<WildTypeKineticDataViewProps> = ({ entryData, setCurrentView }) => {
  const { user } = useUser(); // Accessing user directly from the context
  const [kineticRawDataIds, setKineticRawDataIds] = useState<number[]>([]);
  const [kineticWTId, setKineticWTId] = useState<any>(0);
  const [kineticData, setKineticData] = useState<any[]>([]);

  // Fetch and filter kinetic data
  useEffect(() => {
    const fetchKineticWTData = async () => {
      const response = await fetch('/api/getCharacterizationData');
      const data = await response.json();
      const filteredData = data.filter(
        (row: any) => row.institution === user?.institution && row.resid === 'X'
      );
      const ids = filteredData.map((row: any) => row.raw_data_id).filter((id: any) => id !== 0);
      setKineticRawDataIds(ids);
    };

    fetchKineticWTData();
  }, [user]);

  // Fetch kinetic raw data based on IDs
  useEffect(() => {
    const fetchKineticData = async () => {
      if (kineticRawDataIds.length > 0) {
        const response = await fetch('/api/getKineticRawDataFromIDs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: kineticRawDataIds }),
        });
        const data = await response.json();
        setKineticData(data);
      }
    };

    fetchKineticData();
  }, [kineticRawDataIds]);

  // Update selected wild-type raw data ID
  const updateWTRawDataId = async (WT_raw_data_id: any) => {
    const response = await fetch('/api/updateCharacterizationDataWTRawDataId', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entryData.id, WT_raw_data_id }),
    });
    if (response.ok) setCurrentView('checklist');
    else console.error('Failed to update data');
  };

  return (
    <div className="space-y-4">
      <button className="text-blue-500 hover:text-blue-700" onClick={() => setCurrentView('checklist')}>
        &lt; Back to Checklist
      </button>
      <h2 className="text-2xl font-bold text-left">Wild Type Kinetic Data Uploaded?</h2>
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
            {kineticData.map((row, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">BglB</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.assay_date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.user_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => updateWTRawDataId(row.id)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WildTypeKineticDataView;
