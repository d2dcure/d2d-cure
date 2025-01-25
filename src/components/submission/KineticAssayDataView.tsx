import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { useUser } from '@/components/UserProvider';
import { useRouter } from 'next/router';
import s3 from '../../../s3config'; 
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
import {Table, TableHeader, TableBody, TableColumn, TableRow, TableCell} from "@nextui-org/table";
import {Button} from "@nextui-org/button";
import { Checkbox } from "@nextui-org/checkbox";

interface KineticAssayDataViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

const KineticAssayDataView: React.FC<KineticAssayDataViewProps> = ({
  entryData,
  setCurrentView,
  updateEntryData
}) => {
  const { user } = useUser();
  const router = useRouter();

  const [kineticAssayData, setKineticAssayData] = useState<any[][]>([]);
  const [mentenImageUrl, setMentenImageUrl] = useState<string | null>(null);
  const [lineweaverImageUrl, setLineweaverImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [kineticConstants, setKineticConstants] = useState({
    kcat: null,
    kcat_SD: null,
    KM: null,
    KM_SD: null,
    kcat_over_KM: null,
    kcat_over_KM_SD: null,
  });

  const [kineticRawDataEntryData, setKineticRawDataEntryData] = useState<any>(null);

  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%236b7280' font-family='sans-serif' font-size='16'%3EGraph will appear here%3C/text%3E%3C/svg%3E";

  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');

  // Add a new state for loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [approvedByStudent, setApprovedByStudent] = useState(false);

  useEffect(() => {
    const fetchKineticRawDataEntryData = async () => {
      try {
        const response = await axios.get('/api/getKineticRawDataEntryData', {
          params: { parent_id: entryData.id },
        });
        if (response.status === 200) {
          const data = response.data;
          setKineticRawDataEntryData(data);

          console.log(data.csv_filename)
          if (data.csv_filename) {
            // Fetch the CSV file from S3 and process it
            await fetchAndProcessCSV(data.csv_filename);
          }
        }
      } catch (error) {
        console.error('Error fetching KineticRawData entry:', error);
      }
    };

    if (entryData.id) {
      fetchKineticRawDataEntryData();
    }
  }, [entryData.id]);

  const fetchAndProcessCSV = async (filename: string) => {
    try {
      // Generate signed URL using AWS SDK
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `kinetic_assays/raw/${filename}`,
        Expires: 60, // URL expires in 60 seconds
      };

      const url = await s3.getSignedUrlPromise('getObject', params);

      // Fetch the CSV file using the signed URL
      const response = await fetch(url);
      const blob = await response.blob();
      const csvFile = new File([blob], filename, { type: 'text/csv' });

      setFile(csvFile);

      // Parse the CSV file
      Papa.parse(csvFile, {
        complete: (result) => {
          console.log('Parsed Result:', result);
          setKineticAssayData(result.data as any[][]);
        },
        header: false,
      });

      // Generate graphs from the file
      await generateGraphFromFile(csvFile);
    } catch (error) {
      console.error('Error fetching and processing CSV file from S3:', error);
    }
  };

  const downloadCsvFile = async () => {
    if (!file) return;

    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `kinetic_assays/raw/${file.name}`,
        Expires: 60,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating download link:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleFile = async (file: File) => {
    if (file) {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (fileType !== 'csv') {
        setFileError('Only .csv files are allowed');
        setFile(null);
      } else if (file.size > 500000) { // 500kB
        setFileError('File must be smaller than 500 kB');
        setFile(null);
      } else {
        setFileError('');
        setFile(file);

        // Wait for Papa parse to complete before generating graph
        await new Promise<void>((resolve) => {
          Papa.parse(file, {
            complete: (result) => {
              console.log('Parsed Result:', result);
              setKineticAssayData(result.data as any[][]);
              resolve();
            },
            header: false,
          });
        });

        // Generate graph immediately after parsing
        try {
          await generateGraphFromFile(file);
        } catch (error) {
          console.error('Error generating graphs:', error);
          setFileError('Failed to generate graphs from file');
        }
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const generateGraphFromFile = async (selectedFile: File) => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append(
      'variant-name',
      `${entryData.resid}${entryData.resnum}${entryData.resmut}`
    );

    try {
      const response = await axios.post('https://d2dcure-ed1280e9442d.herokuapp.com/plot_kinetic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      const responseData = response.data;
      setMentenImageUrl(`data:image/png;base64,${responseData.menten_plot}`);
      setLineweaverImageUrl(`data:image/png;base64,${responseData.lineweaver_plot}`);

      setKineticConstants({
        kcat: responseData.kcat,
        kcat_SD: responseData.kcat_SD,
        KM: responseData.KM,
        KM_SD: responseData.KM_SD,
        kcat_over_KM: responseData.kcat_over_KM,
        kcat_over_KM_SD: responseData.kcat_over_KM_SD,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const generateGraphFromTable = async () => {
    // Convert the kineticAssayData back to CSV
    const csvContent = Papa.unparse(kineticAssayData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const editedFile = new File([blob], 'edited_data.csv', { type: 'text/csv' });

    const formData = new FormData();
    formData.append('file', editedFile);
    formData.append(
      'variant-name',
      `${entryData.resid}${entryData.resnum}${entryData.resmut}`
    );

    try {
      const response = await axios.post('https://d2dcure-ed1280e9442d.herokuapp.com/plot_kinetic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true, // fix
      });

      const responseData = response.data;
      setMentenImageUrl(`data:image/png;base64,${responseData.menten_plot}`);
      setLineweaverImageUrl(`data:image/png;base64,${responseData.lineweaver_plot}`);

      setKineticConstants({
        kcat: responseData.kcat,
        kcat_SD: responseData.kcat_SD,
        KM: responseData.KM,
        KM_SD: responseData.KM_SD,
        kcat_over_KM: responseData.kcat_over_KM,
        kcat_over_KM_SD: responseData.kcat_over_KM_SD,
      });
    } catch (error) {
      console.error('Error generating graph from table data:', error);
    }
  };

  const generateFilename = (baseName: string, suffix: string = '', extension: string) => {
    const variant = `${entryData.resid}${entryData.resnum}${entryData.resmut}`;
    return `${user.user_name}-BglB-${variant}-${entryData.id}${suffix}.${extension}`;
  };

  const base64ToBlob = (base64Data: string, contentType: string) => {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Collect necessary data
      const user_name = user.user_name;
      const variant = `${entryData.resid}${entryData.resnum}${entryData.resmut}`;
      const slope_units = kineticAssayData[1][4];
      const yield_value = entryData.yield_avg;
      const yield_units = kineticAssayData[1][6];
      const dilution = kineticAssayData[2][7];
      let purification_date = kineticAssayData[2][8];
      if (purification_date && purification_date.includes('#')) {
        purification_date = null;
      }
      let assay_date = kineticAssayData[2][9];
      if (assay_date && assay_date.includes('#')) {
        assay_date = null;
      }
      const parent_id = entryData.id;

      // Kinetic constants
      const { kcat, kcat_SD, KM, KM_SD, kcat_over_KM, kcat_over_KM_SD } = kineticConstants;

      // Prepare data to send
      const dataToSend = {
        user_name,
        variant,
        slope_units,
        yield: yield_value,
        yield_units,
        dilution,
        purification_date,
        assay_date,
        parent_id,
        kcat,
        kcat_SD,
        KM,
        KM_SD,
        kcat_over_KM,
        kcat_over_KM_SD,
        csv_filename: '',
        plot_filename: '',
        approved_by_student: approvedByStudent,
      };

      // Generate filenames
      const csvFilename = generateFilename('', '', 'csv');
      const mentenPlotFilename = generateFilename('', '', 'png');
      const lineweaverPlotFilename = generateFilename('', '-LB', 'png');

      // Always create CSV from current table data
      const csvContent = Papa.unparse(kineticAssayData);
      const csvFileToUpload = new File([new Blob([csvContent])], csvFilename, { type: 'text/csv' });

      // Upload CSV to S3
      await s3
        .upload({
          Bucket: 'd2dcurebucket',
          Key: `kinetic_assays/raw/${csvFilename}`,
          Body: csvFileToUpload,
          ContentType: 'text/csv',
        })
        .promise();

      if (!mentenImageUrl || !lineweaverImageUrl) {
        alert('Plots are not available for upload.');
        return;
      }

      // Convert Base64 plots to Blobs
      const mentenPlotBlob = base64ToBlob(mentenImageUrl.split(',')[1], 'image/png');
      const lineweaverPlotBlob = base64ToBlob(lineweaverImageUrl.split(',')[1], 'image/png');

      // Upload Menten plot to S3
      await s3
        .upload({
          Bucket: 'd2dcurebucket',
          Key: `kinetic_assays/plots/${mentenPlotFilename}`,
          Body: mentenPlotBlob,
          ContentType: 'image/png',
        })
        .promise();

      // Upload Lineweaver plot to S3
      await s3
        .upload({
          Bucket: 'd2dcurebucket',
          Key: `temp/${lineweaverPlotFilename}`,
          Body: lineweaverPlotBlob,
          ContentType: 'image/png',
        })
        .promise();

      // Update the filenames in dataToSend
      dataToSend.csv_filename = csvFilename;
      dataToSend.plot_filename = mentenPlotFilename;

      // First, save to KineticRawData
      const response1 = await axios.post('/api/updateKineticRawData', dataToSend);

      if (response1.status === 200) {
        const raw_data_id = response1.data.kineticRawDataId;
        setKineticRawDataEntryData(response1.data);

        // Now update CharacterizationData
        const response2 = await axios.post('/api/updateCharacterizationDataKineticStuff', {
          parent_id,
          kcat,
          kcat_SD,
          KM,
          KM_SD,
          kcat_over_KM,
          kcat_over_KM_SD,
          raw_data_id,
          yield: yield_value,
        });

        if (response2.status === 200) {
          // Success
          console.log('Data saved successfully');
          alert('Data saved successfully');
          const updatedEntry = response2.data;
          updateEntryData(updatedEntry);
        } else {
          console.error('Error updating CharacterizationData:', response2.data);
          alert('Error updating CharacterizationData');
        }
      } else {
        console.error('Error saving KineticRawData:', response1.data);
        alert('Error saving KineticRawData');
      }
    } catch (error: any) {
      console.error('Error saving data:', error);
      alert('Error saving data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const updatedData = [...kineticAssayData];
    updatedData[rowIndex][colIndex] = event.target.value;
    setKineticAssayData(updatedData);
  };

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-4 border-b border-gray-100">
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
          <h2 className="text-xl font-bold text-gray-800">Kinetic Assay Data Upload</h2>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            entryData.KM_avg 
              ? "text-green-700 bg-green-100" 
              : "text-yellow-700 bg-yellow-100"
          }`}>
            {entryData.KM_avg ? "Complete" : "Incomplete"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Upload or edit kinetic assay data and generate plots
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6 space-y-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            {file && (
              <div className="mb-4">
                <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-5 h-5 text-[#06B7DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} kB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={downloadCsvFile}
                      className="text-xs font-medium text-[#06B7DB] bg-[#06B7DB]/10 px-3 py-1.5 rounded-full hover:bg-[#06B7DB]/20 transition-colors inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                    <button
                      onClick={() => {
                        setFile(null);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      title="Remove file"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!file && (
              <div
                className={`
                  flex flex-col justify-center px-6 py-4
                  border-2 ${isDragging ? 'border-[#06B7DB]' : 'border-gray-300'}
                  border-dashed rounded-lg
                  transition-colors relative
                  ${isDragging ? 'bg-[#06B7DB]/5' : 'bg-gray-50'}
                `}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400 mb-2"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex flex-col items-center">
                    <label className="cursor-pointer text-sm font-medium text-[#06B7DB] hover:text-[#05a5c6]">
                      Upload a file
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFile(file);
                        }}
                        className="sr-only"
                        accept=".csv"
                      />
                    </label>
                    <p className="text-sm text-gray-500">
                      or drag and drop
                    </p>
                  </div>
                </div>
              </div>
            )}

            {fileError && (
              <div className="mt-2 text-sm flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-md">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {fileError}
              </div>
            )}
          </div>

          {kineticAssayData.length > 0 && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-start">
                  <span className="pr-3 bg-white text-sm font-medium text-gray-500">
                    Analysis Results
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Michaelis-Menten Plot</h3>
                    <button
                      onClick={generateGraphFromTable}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#06B7DB] hover:text-[#05a5c6] transition-colors"
                      title="Regenerate both plots"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </button>
                  </div>
                  {mentenImageUrl ? (
                    <img 
                      src={mentenImageUrl} 
                      alt="Michaelis-Menten Plot" 
                      className="w-full h-[300px] object-contain rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-[300px] bg-gray-200 rounded-lg animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Lineweaver-Burk Plot</h3>
                    <div className="w-[76px]"></div>
                  </div>
                  {lineweaverImageUrl ? (
                    <img 
                      src={lineweaverImageUrl} 
                      alt="Lineweaver-Burk Plot" 
                      className="w-full h-[300px] object-contain rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-[300px] bg-gray-200 rounded-lg animate-pulse" />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Raw Data</h3>
                <Table 
                  aria-label="Kinetic assay data table"
                  classNames={{
                    wrapper: "min-h-[400px]",
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
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((rowLabel, index) => (
                      <TableRow key={index}>
                        <TableCell>{rowLabel}</TableCell>
                        <TableCell>
                          {['75.00', '25.00', '8.33', '2.78', '0.93', '0.31', '0.10', '0.03'][index]}
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={kineticAssayData[index + 4]?.[2] || ''}
                            onChange={(e) => handleInputChange(e, index + 4, 2)}
                            className="w-full bg-transparent border-b border-gray-200 focus:border-[#06B7DB] outline-none px-2 py-1"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={kineticAssayData[index + 4]?.[3] || ''}
                            onChange={(e) => handleInputChange(e, index + 4, 3)}
                            className="w-full bg-transparent border-b border-gray-200 focus:border-[#06B7DB] outline-none px-2 py-1"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={kineticAssayData[index + 4]?.[4] || ''}
                            onChange={(e) => handleInputChange(e, index + 4, 4)}
                            className="w-full bg-transparent border-b border-gray-200 focus:border-[#06B7DB] outline-none px-2 py-1"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {kineticRawDataEntryData && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="font-medium text-gray-900">Experiment Details</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div>
                          <span className="text-sm text-gray-500">Yield</span>
                          <p className="text-sm font-medium text-gray-900">
                            {kineticRawDataEntryData.yield} {kineticRawDataEntryData.yield_units?.replace(/_/g, '/')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
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
                        <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <span className="text-sm text-gray-500">Dates</span>
                          <p className="text-sm font-medium text-gray-900">
                            {kineticRawDataEntryData.purification_date ? (
                              <>Purified: {new Date(kineticRawDataEntryData.purification_date).toLocaleDateString()}</>
                            ) : 'Purification date not set'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {kineticRawDataEntryData.assay_date ? (
                              <>Assayed: {new Date(kineticRawDataEntryData.assay_date).toLocaleDateString()}</>
                            ) : 'Assay date not set'}
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
                        {kineticRawDataEntryData.user_name || 'Unknown user'} on {' '}
                        {new Date(kineticRawDataEntryData.updated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                isSelected={approvedByStudent}
                onValueChange={setApprovedByStudent}
                size="sm"
              >
                <span className="text-sm text-gray-600">
                  I approve this data and agree to attach my name to it
                </span>
              </Checkbox>
            </div>
            </>
          )}
        </div>
      </CardBody>

      <CardFooter className="px-6 pb-6 pt-6 flex justify-between items-center border-t border-gray-100">
        <button 
          onClick={handleSave}
          className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!kineticAssayData.length || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
        
        <span className="text-xs text-gray-500">
          Data file and plots required
        </span>
      </CardFooter>

      {/* Template card section */}
      <div className="px-6 pb-6">
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-start">
            <span className="pr-3 bg-white text-sm font-medium text-gray-500">
              Template Files
            </span>
          </div>
        </div>

        {/* Updated responsive card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          <Card className="min-h-[200px] w-full">
            <CardBody className="pt-8 font-light overflow-hidden">
              <div className="flex items-start space-x-4">
                <img 
                  src="/resources/images/Microsoft_Excel-Logo.wine.svg"
                  className="w-12 h-12 sm:w-14 sm:h-12 select-none pointer-events-none" 
                  draggable="false"
                  alt="Excel logo" 
                />
                <div className="flex-1">
                  <h1 className="text-base sm:text-lg font-regular">
                    Kinetic Assay Data
                  </h1>
                  <p className="text-sm text-gray-500 mt-2">
                    Download the template for kinetic assay data submission
                  </p>
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <Button 
                variant="bordered" 
                onPress={() => window.location.href = '/downloads/kinetic_assay_single_variant_template.csv'} 
                className="w-full h-11 font-regular border-2 hover:bg-[#06B7DB] group transition-all"
                style={{ borderColor: "#06B7DB", color: "#06B7DB" }}
              >
                <span className="group-hover:text-white flex items-center justify-center gap-2">
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                    />
                  </svg>
                  Download Template
                </span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Card>
  );
};

export default KineticAssayDataView;
