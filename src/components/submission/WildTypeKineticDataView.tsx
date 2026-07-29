import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider';
import axios from 'axios';
import Link from 'next/link';
import Papa from 'papaparse';
import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@nextui-org/table';
import { AlertTriangleIcon } from 'lucide-react';

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
	enzyme: string;
	entryData: any;
	setCurrentView: (view: string) => void;
	updateEntryData: (newData: any) => void;
}


const WildTypeKineticDataView: React.FC<WildTypeKineticDataViewProps> = ({
	enzyme,
	entryData,
	setCurrentView,
	updateEntryData
}) => {
  const { user } = useUser();

  const [kineticRawDataIds, setKineticRawDataIds] = useState<number[]>([]);
  const [kineticData, setKineticData] = useState<any[]>([]);
  const [kineticRawDataEntryData, setKineticRawDataEntryData] = useState<any>(null);
  const [kineticAssayData, setKineticAssayData] = useState<any[][]>([]);
  const [plotImageUrl, setPlotImageUrl] = useState<string | null>(null);

  // Hardcoded row labels and [S] (mM) values
  const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const sValues = ['75.00', '25.00', '8.33', '2.78', '0.93', '0.31', '0.10', '0.03'];

  // 1) Fetch all "characterizationData" and filter for your user/institution + resid='X'
  useEffect(() => {
    const fetchKineticWTData = async () => {
      const response = await fetch(`/api/getCharacterizationData?enzyme=${enzyme}`);
      const data = await response.json();
      const filteredData = data.filter(
        (row: any) => row.institution === user?.institution && row.resid === 'X'
      );
      const ids = filteredData
        .map((row: any) => row.raw_data_id)
        .filter((id: any) => id !== 0);
      setKineticRawDataIds(ids);
    };
    fetchKineticWTData();
  }, [enzyme, user]);

  // 2) For each raw_data_id, fetch the actual "KineticRawData" objects
  useEffect(() => {
    const fetchKineticData = async () => {
      if (kineticRawDataIds.length > 0) {
        const response = await fetch('/api/getKineticRawDataFromIDs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enzyme: enzyme, ids: kineticRawDataIds })
        });
        const data = await response.json();
        setKineticData(data);
      }
    };
    fetchKineticData();
  }, [enzyme, kineticRawDataIds]);

  // 3) If there's a WT_raw_data_id, fetch that single "KineticRawData" object, parse CSV, get image
  useEffect(() => {
    const fetchKineticRawDataEntryData = async () => {
      try {
        const response = await axios.get('/api/getKineticRawDataEntryDataFromWTid', {
          params: { enzyme: enzyme, id: entryData.WT_raw_data_id }
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
  }, [enzyme, entryData.WT_raw_data_id]);

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
  const updateWTRawDataId = async (WT_raw_data_id: any) => {
    const response = await fetch('/api/updateCharacterizationDataWTRawDataId', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enzyme: enzyme, id: entryData.id, WT_raw_data_id })
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
          <AlertTriangleIcon className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" />
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
                        <AlertTriangleIcon
                          className="w-4 h-4 mt-0.5 text-gray-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                         />
                        <div>
                          <span className="text-sm text-gray-500">Yield</span>
                          <p className="text-sm font-medium text-gray-900">
                            {kineticRawDataEntryData.yield}{' '}
                            {kineticRawDataEntryData.yield_units?.replace(/_/g, '/')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <AlertTriangleIcon
                          className="w-4 h-4 mt-0.5 text-gray-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                         />
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
                        <AlertTriangleIcon
                          className="w-4 h-4 mt-0.5 text-gray-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                         />
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
                    <AlertTriangleIcon
                      className="w-4 h-4 mt-0.5 text-gray-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                     />
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
                      <AlertTriangleIcon
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                       />
                      <span className="text-sm text-gray-500">Selected File:</span>
                      <button onClick={downloadCSV} className="text-[#06B7DB] hover:text-[#05a5c6] text-sm">
                        {kineticRawDataEntryData.csv_filename}
                      </button>
                    </div>

                    <div className="flex items-start gap-2 pt-3 border-t border-gray-200">
                      <AlertTriangleIcon
                        className="w-5 h-5 text-gray-400 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                       />
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
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {kineticData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{enzyme}</TableCell>
                    <TableCell>{row.assay_date}</TableCell>
                    <TableCell>{row.user_name}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => updateWTRawDataId(row.id)}
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
		  <div className="flex gap-2">
			&hellip;Or
			<Link href="/submit?wild_type=1" passHref>
					create a new wild-type dataset or add kinetic assay data to an existing WT dataset.
			</Link>
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