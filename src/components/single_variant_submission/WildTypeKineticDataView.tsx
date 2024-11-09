import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider'; 
import axios from 'axios';
import Papa from 'papaparse';
import s3 from '../../../s3config';

interface WildTypeKineticDataViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

const WildTypeKineticDataView: React.FC<WildTypeKineticDataViewProps> = ({ entryData, setCurrentView, updateEntryData }) => {
  const { user } = useUser();
  const [kineticRawDataIds, setKineticRawDataIds] = useState<number[]>([]);
  const [kineticData, setKineticData] = useState<any[]>([]);
  const [kineticRawDataEntryData, setKineticRawDataEntryData] = useState<any>(null);
  const [kineticAssayData, setKineticAssayData] = useState<any[][]>([]);
  const [plotImageUrl, setPlotImageUrl] = useState<string | null>(null);

  // Hardcoded row labels and [S] (mM) values
  const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const sValues = ['75.00', '25.00', '8.33', '2.78', '0.93', '0.31', '0.10', '0.03'];

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

  useEffect(() => {
    const fetchKineticRawDataEntryData = async () => {
      try {
        const response = await axios.get('/api/getKineticRawDataEntryDataFromWTid', {
          params: { id: entryData.WT_raw_data_id },
        });
        if (response.status === 200) {
          const data = response.data;
          setKineticRawDataEntryData(data);

          if (data.csv_filename) {
            await fetchAndParseCSV(data.csv_filename);
          }

          if (data.plot_filename) {
            await fetchPlotImage(data.plot_filename);
          }
        }
      } catch (error) {
        console.error('Error fetching KineticRawData entry:', error);
      }
    };

    if (entryData.WT_raw_data_id) {
      fetchKineticRawDataEntryData();
    }
  }, [entryData.WT_raw_data_id]);

  const fetchAndParseCSV = async (filename: string) => {
    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `kinetic_assays/raw/${filename}`,
        Expires: 60,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      const response = await fetch(url);
      const blob = await response.blob();
      const csvFile = new File([blob], filename, { type: 'text/csv' });

      Papa.parse(csvFile, {
        complete: (result) => {
          setKineticAssayData(result.data as any[][]);
        },
        header: false,
      });
    } catch (error) {
      console.error('Error fetching and parsing CSV file from S3:', error);
    }
  };

  const fetchPlotImage = async (filename: string) => {
    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `kinetic_assays/plots/${filename}`,
        Expires: 60,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      setPlotImageUrl(url);
    } catch (error) {
      console.error('Error fetching plot image from S3:', error);
    }
  };

  const downloadCSV = async () => {
    if (!kineticRawDataEntryData?.csv_filename) return;
    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `kinetic_assays/raw/${kineticRawDataEntryData.csv_filename}`,
        Expires: 60,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);

      const link = document.createElement('a');
      link.href = url;
      link.download = kineticRawDataEntryData.csv_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating download link:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const updateWTRawDataId = async (WT_raw_data_id: any) => {
    const response = await fetch('/api/updateCharacterizationDataWTRawDataId', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entryData.id, WT_raw_data_id }),
    });
    if (response.ok)
    {
      const updatedEntry = await response.json();
      updateEntryData(updatedEntry);
      setCurrentView('checklist');
    } 
    else console.error('Failed to update data');
  };

  return (
    <div className="space-y-4">
      <button className="text-blue-500 hover:text-blue-700" onClick={() => setCurrentView('checklist')}>
        &lt; Back to Checklist
      </button>
      <h2 className="text-2xl font-bold text-left">Wild Type Kinetic Data Uploaded?</h2>
      <p>Corresponding CSV: {kineticRawDataEntryData?.csv_filename || 'N/A'}</p>
      {kineticRawDataEntryData?.csv_filename && (
          <button
            onClick={downloadCSV}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Download
          </button>
      )}

      {kineticAssayData.length > 0 && (
        <div className="overflow-auto mt-4">
          <table className="table-auto border-collapse border border-gray-400 w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-400 px-4 py-2">Row</th>
                <th className="border border-gray-400 px-4 py-2">[S] (mM)</th>
                <th className="border border-gray-400 px-4 py-2">1</th>
                <th className="border border-gray-400 px-4 py-2">2</th>
                <th className="border border-gray-400 px-4 py-2">3</th>
              </tr>
            </thead>
            <tbody>
              {rowLabels.map((rowLabel, index) => (
                <tr key={index}>
                  <td className="border border-gray-400 px-4 py-2">{rowLabel}</td>
                  <td className="border border-gray-400 px-4 py-2">{sValues[index]}</td>
                  {[2, 3, 4].map((col) => (
                    <td key={col} className="border border-gray-400 px-4 py-2">
                      {kineticAssayData[index + 4]?.[col] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p>Yield: {kineticRawDataEntryData.yield} {kineticRawDataEntryData.yield_units}</p>
          <p className="mb-2">Dilution: {kineticRawDataEntryData.dilution}x</p>
          <p>Protein purified on {kineticRawDataEntryData.purification_date} and assayed on {kineticRawDataEntryData.assay_date}.</p>
          <p>Data uploaded by {kineticRawDataEntryData.user_name} and last updated on {kineticRawDataEntryData.updated}</p>
        </div>
      )}

      {plotImageUrl && (
        <div className="mt-4">
          <img src={plotImageUrl} alt="Plot Image" className="w-1/2" />
        </div>
      )}

      <p>Select the user name of the peer who uploaded the WT raw data run in parallel with variant BglB {entryData.resid + entryData.resnum + entryData.resmut} from {user.institution}: </p>
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
