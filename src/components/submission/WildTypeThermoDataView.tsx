import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import Papa from 'papaparse';
import s3 from '../../../s3config';
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
import {Table, TableHeader, TableBody, TableColumn, TableRow, TableCell} from "@nextui-org/table";

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

  // Function to determine if the CSV is horizontal
  const isHorizontalTemplate = (data: any[][]) => {
    return !data[2]?.[1]; // Check if B3 is empty
  };

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
          setTempAssayData(parsedData);

          if (isHorizontalTemplate(parsedData)) {
            // Extract temperature values for horizontal template
            const extractedTempValues = parsedData[1].slice(3, 15); // D2 to O2
            setTempValues(extractedTempValues);
          } else {
            // Extract temperature values for vertical template
            const extractedTempValues = parsedData.slice(4, 12).map(row => row[0]);
            setTempValues(extractedTempValues);
          }
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

  const renderThermoTable = (data: any[][]) => {
    if (isHorizontalTemplate(data)) {
      // Horizontal template logic
      return (
        <Table aria-label="Horizontal Temperature assay data table">
          <TableHeader>
            <TableColumn>Row</TableColumn>
            <TableColumn>Temp (°C)</TableColumn>
            <TableColumn>1</TableColumn>
            <TableColumn>2</TableColumn>
          </TableHeader>
          <TableBody>
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map((row, index) => {
              const temperature = data[1]?.[index + 3] || '—'; // D2, E2, ..., O2
              return (
                <TableRow key={row}>
                  <TableCell>{row}</TableCell>
                  <TableCell>{temperature}</TableCell>
                  <TableCell>{data[4]?.[index + 3] || '—'}</TableCell>
                  <TableCell>{data[5]?.[index + 3] || '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    } else {
      // Vertical template logic
      return (
        <Table aria-label="Vertical Temperature assay data table">
          <TableHeader>
            <TableColumn>Row</TableColumn>
            <TableColumn>T (°C)</TableColumn>
            <TableColumn>1</TableColumn>
            <TableColumn>2</TableColumn>
            <TableColumn>3</TableColumn>
          </TableHeader>
          <TableBody>
            {rowLabels.map((rowLabel, index) => (
              <TableRow key={index}>
                <TableCell className="whitespace-nowrap">{rowLabel}</TableCell>
                <TableCell className="whitespace-nowrap">{tempValues[index]}</TableCell>
                <TableCell>{tempAssayData[index + 4]?.[2] || ''}</TableCell>
                <TableCell>{tempAssayData[index + 4]?.[3] || ''}</TableCell>
                <TableCell>{tempAssayData[index + 4]?.[4] || ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-col items-start px-4 sm:px-6 pt-6 pb-4 border-b border-gray-100">
        <button 
          className="text-[#06B7DB] hover:text-[#05a5c6] text-sm mb-4 flex items-center gap-2 transition-colors"
          onClick={() => setCurrentView('checklist')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to checklist
        </button>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-800">Wild Type Thermostability Data</h2>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            entryData.WT_temp_raw_data_id 
              ? "text-green-700 bg-green-100" 
              : "text-yellow-700 bg-yellow-100"
          }`}>
            {entryData.WT_temp_raw_data_id ? "Complete" : "Incomplete"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Select the wild type thermostability data run in parallel with your variant
        </p>
      </CardHeader>

      <CardBody className="px-4 sm:px-6 py-6 space-y-6">
        {tempRawDataEntryData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-medium text-gray-900 mb-4">Experiment Details</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <span className="text-sm text-gray-500">Dates</span>
                          <p className="text-sm font-medium text-gray-900">
                            Purified: {new Date(tempRawDataEntryData.purification_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            Assayed: {new Date(tempRawDataEntryData.assay_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-3 border-t border-gray-200 mt-4">
                    <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <span className="text-sm text-gray-500">Last Update</span>
                      <p className="text-sm font-medium text-gray-900">
                        {tempRawDataEntryData.user_name} on {new Date(tempRawDataEntryData.updated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl flex-1">
                  <h3 className="font-medium text-gray-900 mb-4">File Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-500">Selected File:</span>
                      <button
                        onClick={downloadCSV}
                        className="text-[#06B7DB] hover:text-[#05a5c6] text-sm"
                      >
                        {tempRawDataEntryData.csv_filename}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {plotImageUrl && (
                <div className="p-4 bg-gray-50 rounded-xl h-full">
                  <img 
                    src={plotImageUrl} 
                    alt="Plot Image" 
                    className="w-full h-auto object-contain" 
                  />
                </div>
              )}
            </div>

            {tempAssayData.length > 0 && (
              <div className="overflow-x-auto">
                {renderThermoTable(tempAssayData)}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Available Wild Type Data</h3>
          <div className="overflow-x-auto">
            <Table 
              aria-label="Available wild type data"
              classNames={{
                table: "min-w-full",
              }}
            >
              <TableHeader>
                <TableColumn>Enzyme</TableColumn>
                <TableColumn>Date Assayed</TableColumn>
                <TableColumn>Uploaded By</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {tempData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="whitespace-nowrap">BglB</TableCell>
                    <TableCell className="whitespace-nowrap">{row.assay_date}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.user_name}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => updateWTRawDataId(row.id)}
                        className={`${
                          entryData.curated
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-[#06B7DB] hover:text-[#05a5c6]"
                        }`}
                        disabled={entryData.curated}
                      >
                        Select
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardBody>

      <CardFooter className="px-4 sm:px-6 pb-6 pt-6 flex justify-between items-center border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Select a wild type dataset to continue
        </span>
      </CardFooter>
    </Card>
  );
};

export default WildTypeThermoDataView;
