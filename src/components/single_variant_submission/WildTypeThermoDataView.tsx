import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import Papa from 'papaparse';
import s3 from '../../../s3config';

interface WildTypeThermoDataViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

const WildTypeThermoDataView: React.FC<WildTypeThermoDataViewProps> = ({
  entryData,
  setCurrentView,
  updateEntryData
}) => {
  const [tempData, setTempData] = useState<any[]>([]);
  const [tempRawDataEntryData, setTempRawDataEntryData] = useState<any>(null);
  const [tempAssayData, setTempAssayData] = useState<any[][]>([]);
  const [plotImageUrl, setPlotImageUrl] = useState<string | null>(null);

  const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const [tempValues, setTempValues] = useState<any[]>([]);

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

  useEffect(() => {
    const fetchTempRawDataEntryData = async () => {
      try {
        const response = await axios.get('/api/getTempRawDataEntryDataFromWTid', {
          params: { id: entryData.WT_temp_raw_data_id },
        });
        if (response.status === 200) {
          const data = response.data;
          setTempRawDataEntryData(data);

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

    if (entryData.WT_temp_raw_data_id) {
      fetchTempRawDataEntryData();
    }
  }, [entryData.WT_temp_raw_data_id]);

  const fetchAndParseCSV = async (filename: string) => {
    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `temperature_assays/raw/${filename}`,
        Expires: 60,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      const response = await fetch(url);
      const blob = await response.blob();
      const csvFile = new File([blob], filename, { type: 'text/csv' });

      Papa.parse(csvFile, {
        complete: (result) => {
          const parsedData = result.data as any[][];

          // Extract cells A5 through A12 for tempValues
          const extractedTempValues = parsedData.slice(4, 12).map(row => row[0]);
          setTempValues(extractedTempValues);

          setTempAssayData(parsedData);
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
        Key: `temperature_assays/plots/${filename}`,
        Expires: 60,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      setPlotImageUrl(url);
    } catch (error) {
      console.error('Error fetching plot image from S3:', error);
    }
  };

  const downloadCSV = async () => {
    if (!tempRawDataEntryData?.csv_filename) return;
    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `temperature_assays/raw/${tempRawDataEntryData.csv_filename}`,
        Expires: 60,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);

      const link = document.createElement('a');
      link.href = url;
      link.download = tempRawDataEntryData.csv_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating download link:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const updateWTRawDataId = async (selectedId: number) => {
    try {
      const response = await fetch('/api/updateCharacterizationDataWTTempRawDataId', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryData.id, WT_temp_raw_data_id: selectedId }),
      });

      if (response.ok) {
        console.log('WT ID saved successfully:', selectedId);
        const updatedEntry = await response.json();
        updateEntryData(updatedEntry);
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
      <p>Corresponding CSV: {tempRawDataEntryData?.csv_filename || 'N/A'}</p>
      {tempRawDataEntryData?.csv_filename && (
          <button
            onClick={downloadCSV}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Download
          </button>
      )}

      {tempAssayData.length > 0 && (
        <div className="overflow-auto mt-4">
          <table className="table-auto border-collapse border border-gray-400 w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-400 px-4 py-2">Row</th>
                <th className="border border-gray-400 px-4 py-2">T (°C)</th>
                <th className="border border-gray-400 px-4 py-2">1</th>
                <th className="border border-gray-400 px-4 py-2">2</th>
                <th className="border border-gray-400 px-4 py-2">3</th>
              </tr>
            </thead>
            <tbody>
              {rowLabels.map((rowLabel:any, index:any) => (
                <tr key={index}>
                  <td className="border border-gray-400 px-4 py-2">{rowLabel}</td>
                  <td className="border border-gray-400 px-4 py-2">{tempValues[index]}</td>
                  {[2, 3, 4].map((col) => (
                    <td key={col} className="border border-gray-400 px-4 py-2">
                      {tempAssayData[index + 4]?.[col] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p>Protein purified on {tempRawDataEntryData.purification_date} and assayed on {tempRawDataEntryData.assay_date}.</p>
          <p>Data uploaded by {tempRawDataEntryData.user_name} and last updated on {tempRawDataEntryData.updated}</p>
        </div>
      )}

      {plotImageUrl && (
        <div className="mt-4">
          <img src={plotImageUrl} alt="Plot Image" className="w-1/2" />
        </div>
      )}

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
                    onClick={() => updateWTRawDataId(row.id)}
                    className="text-indigo-600 hover:text-indigo-900 font-bold"
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

export default WildTypeThermoDataView;
