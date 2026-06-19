import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider';
import axios from 'axios';
import Papa from 'papaparse';

import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@nextui-org/table';

/** 
 * Helper function: fetch a file from S3, returning a Blob.
 * This calls our Next.js API /api/s3?folder=<folder>&download=<filename> 
 * to get a presigned URL, then fetches that presigned URL to get the actual file.
 */
async function fetchFileFromS3(folder: string, filename: string): Promise<Blob> {
  // 1. Call your Next.js API route to get a presigned download URL
  const resp = await fetch(`/api/s3?folder=${folder}&download=${filename}`);
  if (!resp.ok) {
    throw new Error('Failed to get presigned download URL');
  }
  const { presignedUrl } = await resp.json(); // { presignedUrl, fileKey }

  // 2. Fetch the actual file from that presigned URL
  const fileResp = await fetch(presignedUrl);
  if (!fileResp.ok) {
    throw new Error('Failed to download file from S3');
  }
  return fileResp.blob();
}

interface WildTypeKineticDataViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void;
}

const WildTypeKineticDataView: React.FC<WildTypeKineticDataViewProps> = ({
  entryData,
  setCurrentView,
  updateEntryData
}) => {
  const { user } = useUser();

  const [kineticParams, setKineticParams] = useState<any[]>([]);  // a list of raw data ids with the three params for that id
  const [kineticData, setKineticData] = useState<any[]>([]);  // a list of dictionaries containing assay dates and user names 
  const [kineticRawDataEntryData, setKineticRawDataEntryData] = useState<any>(null);
  const [kineticAssayData, setKineticAssayData] = useState<any[][]>([]);
  const [plotImageUrl, setPlotImageUrl] = useState<string | null>(null);

  // Hardcoded row labels and [S] (mM) values
  const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const sValues = ['75.00', '25.00', '8.33', '2.78', '0.93', '0.31', '0.10', '0.03'];

  // 1) Fetch all "characterizationData" and filter for the user/institution + resid='X' (WT)
  // Then, save raw data ids for the kinetic assays along with the saved kinetic parameters.
  useEffect(() => {
    const fetchKineticWTData = async () => {
      const response = await fetch('/api/getCharacterizationData');
      const data = await response.json();
      const filteredData = data.filter(
        (row: any) => row.institution === user?.institution && row.resid === 'X'
      );
      const params = filteredData
        .map((row: any) => [row.raw_data_id, row.KM_avg, row.kcat_avg, row.kcat_over_KM])
        .filter((id: any) => id !== 0);  // Save an array of params, each entry containing a list of raw data id and params.
      const ids = params.map((row: any) => row[0]);  // Create a list of just the raw data ids.
      setKineticParams(params);
    };
    fetchKineticWTData();
  }, [user]);

  // 2) For each raw_data_id, fetch the actual "KineticRawData" objects
  // This will store the assay dates and the user names for each raw dataset.
  useEffect(() => {
    const fetchKineticData = async () => {
      if (kineticParams.length > 0) {
        const response = await fetch('/api/getKineticRawDataFromIDs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: kineticParams.map((row: any) => row[0]) })  // The raw data ids are index 0.
        });
        const data = await response.json();
        setKineticData(data);
      }
    };
    fetchKineticData();
  }, [kineticParams]);

  // 3) If there's a WT_raw_data_id, fetch that single "KineticRawData" object, parse CSV, get image
  useEffect(() => {
    const fetchKineticRawDataEntryData = async () => {
      try {
        const response = await axios.get('/api/getKineticRawDataEntryDataFromWTid', {
          params: { id: entryData.WT_raw_data_id }
        });
        if (response.status === 200) {
          const data = response.data;
          setKineticRawDataEntryData(data);

          // If there's a CSV file, parse it
          if (data.csv_filename) {
            await fetchAndParseCSV(data.csv_filename);
          }

          // If there's a plot image, fetch & display it
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

  /** 
   * Download the CSV from S3 and parse with Papa
   */
  const fetchAndParseCSV = async (filename: string) => {
    try {
      // 1. fetch CSV file from s3 => returns a Blob
      const blob = await fetchFileFromS3('kinetic_assays/raw', filename);
      const csvFile = new File([blob], filename, { type: 'text/csv' });

      // 2. Parse with Papa
      Papa.parse(csvFile, {
        complete: (result) => {
          setKineticAssayData(result.data as any[][]);
        },
        header: false
      });
    } catch (error) {
      console.error('Error fetching and parsing CSV file from S3:', error);
    }
  };

  /** 
   * Download the plot image from S3, convert to object URL for <img src> 
   */
  const fetchPlotImage = async (filename: string) => {
    try {
      const blob = await fetchFileFromS3('kinetic_assays/plots', filename);
      const localUrl = URL.createObjectURL(blob);
      setPlotImageUrl(localUrl);
    } catch (error) {
      console.error('Error fetching plot image from S3:', error);
    }
  };

  /** 
   * Let the user download the CSV if they want
   */
  const downloadCSV = async () => {
    if (!kineticRawDataEntryData?.csv_filename) return;
    try {
      const blob = await fetchFileFromS3('kinetic_assays/raw', kineticRawDataEntryData.csv_filename);

      // create a local URL and trigger a browser download
      const localUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = kineticRawDataEntryData.csv_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error('Error generating download link:', error);
      alert('Failed to download file. Please try again.');
    }
  };


  /**
   * When user picks a different WT raw data ID, store it in the DB 
   * then go back to checklist
   */
  const updateWTRawData = async (WT_kinetic_params: any) => {
    const WT_raw_data_id = WT_kinetic_params[0];
    const WT_KM = WT_kinetic_params[1];
    const WT_kcat = WT_kinetic_params[2];
    const WT_kcat_over_KM = WT_kinetic_params[3];
    const response = await fetch('/api/updateCharacterizationDataWTKineticData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entryData.id, WT_raw_data_id, WT_KM, WT_kcat, WT_kcat_over_KM })
    });
    if (response.ok) {
      const updatedEntry = await response.json();
      updateEntryData(updatedEntry);
      setCurrentView('checklist');
    } else {
      console.error('Failed to update data');
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
          <h2 className="text-xl font-bold text-gray-800">Wild Type Kinetic Data</h2>
          <span
            className={`text-xs font-medium rounded-full px-3 py-1 ${
              entryData.WT_raw_data_id ? 'text-green-700 bg-green-100' : 'text-yellow-700 bg-yellow-100'
            }`}
          >
            {entryData.WT_raw_data_id ? 'Complete' : 'Incomplete'}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Select the wild type kinetic data run in parallel with your variant
        </p>
      </CardHeader>

      <CardBody className="px-4 sm:px-6 py-6 space-y-6">
        {kineticRawDataEntryData && (
          <div className="space-y-6">
            {/* Top row: experiment details & file info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column: experiment details */}
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-medium text-gray-900 mb-4">Experiment Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 mt-0.5 text-gray-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <div>
                          <span className="text-sm text-gray-500">Yield</span>
                          <p className="text-sm font-medium text-gray-900">
                            {kineticRawDataEntryData.yield}{' '}
                            {kineticRawDataEntryData.yield_units?.replace(/_/g, '/')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 mt-0.5 text-gray-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                          />
                        </svg>
                        <div>
                          <span className="text-sm text-gray-500">Dilution</span>
                          <p className="text-sm font-medium text-gray-900">
                            {kineticRawDataEntryData.dilution}x
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 mt-0.5 text-gray-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <div>
                          <span className="text-sm text-gray-500">Dates</span>
                          <p className="text-sm font-medium text-gray-900">
                            Purified:{' '}
                            {new Date(kineticRawDataEntryData.purification_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            Assayed:{' '}
                            {new Date(kineticRawDataEntryData.assay_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-3 border-t border-gray-200 mt-4">
                    <svg
                      className="w-4 h-4 mt-0.5 text-gray-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <span className="text-sm text-gray-500">Last Update</span>
                      <p className="text-sm font-medium text-gray-900">
                        {kineticRawDataEntryData.user_name} on{' '}
                        {new Date(kineticRawDataEntryData.updated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CSV file info + download button */}
                <div className="p-4 bg-gray-50 rounded-xl flex-1">
                  <h3 className="font-medium text-gray-900 mb-4">File Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">Selected File:</span>
                      <button onClick={downloadCSV} className="text-[#06B7DB] hover:text-[#05a5c6] text-sm">
                        {kineticRawDataEntryData.csv_filename}
                      </button>
                    </div>

                    <div className="flex items-start gap-2 pt-3 border-t border-gray-200">
                      <svg
                        className="w-5 h-5 text-gray-400 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">
                          Need to change the wild type data?
                          <br />
                          Scroll down to view and select from available wild type datasets.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column: plot image, if any */}
              {plotImageUrl && (
                <div className="p-4 bg-gray-50 rounded-xl h-full">
                  <img src={plotImageUrl} alt="Plot Image" className="w-full h-auto object-contain" />
                </div>
              )}
            </div>

            {/* The Papa-parsed CSV as a simple table of [S] and replicate columns */}
            {kineticAssayData.length > 0 && (
              <div className="overflow-x-auto">
                <Table
                  aria-label="Kinetic assay data table"
                  classNames={{
                    wrapper: 'min-h-[400px]',
                    table: 'min-w-full'
                  }}
                >
                  <TableHeader>
                    <TableColumn>Row</TableColumn>
                    <TableColumn>[S] (mM)</TableColumn>
                    <TableColumn>1</TableColumn>
                    <TableColumn>2</TableColumn>
                    <TableColumn>3</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {rowLabels.map((rowLabel, index) => (
                      <TableRow key={index}>
                        <TableCell>{rowLabel}</TableCell>
                        <TableCell>{sValues[index]}</TableCell>
                        <TableCell>{kineticAssayData[index + 4]?.[2] || ''}</TableCell>
                        <TableCell>{kineticAssayData[index + 4]?.[3] || ''}</TableCell>
                        <TableCell>{kineticAssayData[index + 4]?.[4] || ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* List of available WT datasets */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Available Wild Type Data</h3>
          <div className="overflow-x-auto">
            <Table
              aria-label="Available wild type data"
              classNames={{
                table: 'min-w-full'
              }}
            >
              <TableHeader>
                <TableColumn>Enzyme</TableColumn>
                <TableColumn>Date Assayed</TableColumn>
                <TableColumn>Uploaded By</TableColumn>
                <TableColumn><i>k</i><sub>cat</sub>/<i>K</i><sub>M</sub> (mᴍ<sup>−1</sup>min<sup>−1</sup>)</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {kineticData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>BglB</TableCell>
                    <TableCell>{row.assay_date}</TableCell>
                    <TableCell>{row.user_name}</TableCell>
                    <TableCell>{kineticParams[index][3] /*4th item in array is the kcat/KM*/}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => updateWTRawData(kineticParams[index])}
                        className={`${
                          entryData.curated
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-[#06B7DB] hover:text-[#05a5c6]'
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
        <span className="text-xs text-gray-500">Select a wild type dataset to continue</span>
      </CardFooter>
    </Card>
  );
};

export default WildTypeKineticDataView;
