import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../s3config'; 
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
import {Table, TableHeader, TableBody, TableColumn, TableRow, TableCell} from "@nextui-org/table";
import { Button } from "@nextui-org/button";
import { Checkbox } from "@nextui-org/checkbox";

interface ThermoAssayDataViewProps {
  setCurrentView: (view: string) => void;
  entryData: any;
  updateEntryData: (newData: any) => void;
}

const ThermoAssayDataView: React.FC<ThermoAssayDataViewProps> = ({ setCurrentView, entryData, updateEntryData }) => {
  const { user } = useUser();

  const [thermoRawDataEntryData, setThermoRawDataEntryData] = useState<any>(null);
  const [thermoData, setThermoData] = useState<string[][]>([]);
  const [originalData, setOriginalData] = useState<string[][]>([]);
  const [graphImageUrl, setGraphImageUrl] = useState<string | null>(null);
  const [csvFilename, setCsvFilename] = useState<string | null>(null);
  const [calculatedValues, setCalculatedValues] = useState({
    T50: null,
    T50_SD: null,
    k: null,
    k_SD: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedByStudent, setApprovedByStudent] = useState(false);

  // Add the sanitization messages state
  const [sanitizationMessages, setSanitizationMessages] = useState<string[]>([]);

  useEffect(() => {
    const fetchTempRawDataEntryData = async () => {
      try {
        const response = await axios.get('/api/getTempRawDataEntryData', {
          params: { parent_id: entryData.id },
        });
        
        if (response.status === 200) {
          const data = response.data;
          setCsvFilename(data.csv_filename);
          setThermoRawDataEntryData(data);
  
          // If a CSV file is already uploaded, fetch and process it
          if (data.csv_filename) {
            await fetchAndProcessCSV(data.csv_filename);
          }
        } else if (response.status === 404) {
          console.warn("No data found for the given parent_id.");
          setThermoRawDataEntryData(null); // No data found, so set it to null
        }
      } catch (error) {
        console.error('Error fetching TempRawData entry:', error);
        setThermoRawDataEntryData(null);
      }
    };
  
    if (entryData.id) {
      fetchTempRawDataEntryData();
    }
  }, [entryData.id]);

  const fetchAndProcessCSV = async (filename: string) => {
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

      const fileContent = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(csvFile);
      });

      const parsedData = Papa.parse(fileContent, { header: false }).data as any[][];
      setOriginalData(parsedData);

      const extractedTemperatures = parsedData.slice(4, 12).map((row: any) => parseFloat(row[0]));
      setTempValues(extractedTemperatures);

      const editableData = parsedData.slice(4, 12).map(row => row.slice(2, 5));
      const sanitizedData = processData(parsedData);
      
      const sanitizedEditableData = sanitizedData.slice(4, 12).map(row => row.slice(2, 5));
      setThermoData(sanitizedEditableData);

      await generateGraphFromFile(csvFile);
    } catch (error) {
      console.error('Error fetching and processing CSV file from S3:', error);
    }
  };

  const downloadCsvFile = async () => {
    if (!csvFilename) return;

    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `temperature_assays/raw/${csvFilename}`,
        Expires: 60,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = csvFilename;
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
        setCsvFilename(null);
      } else if (file.size > 500000) {
        setFileError('File must be smaller than 500 kB');
        setCsvFilename(null);
      } else {
        setFileError('');
        setCsvFilename(file.name);
        
        try {
          const fileContent = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
          });

          const parsedData = Papa.parse(fileContent, { header: false }).data as any[][];
          
          // Store the full original data
          setOriginalData(parsedData);

          // Extract temperatures from first column (rows 5-12)
          const extractedTemperatures = parsedData.slice(4, 12).map((row: any) => parseFloat(row[0]));
          setTempValues(extractedTemperatures);

          // Extract and sanitize the editable data (cells C5-C12, D5-D12, E5-E12)
          const editableData = parsedData.slice(4, 12).map(row => row.slice(2, 5));
          const sanitizedData = processData(parsedData);
          
          // Only update the editable portion with sanitized data
          const sanitizedEditableData = sanitizedData.slice(4, 12).map(row => row.slice(2, 5));
          setThermoData(sanitizedEditableData);

          // Generate graph with sanitized data
          const sanitizedCsv = Papa.unparse(sanitizedData);
          const sanitizedFile = new File([sanitizedCsv], file.name, { type: 'text/csv' });
          
          await generateGraphFromFile(sanitizedFile);
        } catch (error) {
          console.error('Error processing file:', error);
          setFileError('Failed to process file');
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const generateGraphFromEditedData = async () => {
    // Clone original data to avoid mutating state directly
    const updatedData = originalData.map((row) => [...row]);

    // Update the specific cells in the cloned original data structure
    thermoData.forEach((row, rowIndex) => {
      row.forEach((value, cellIndex) => {
        updatedData[rowIndex + 4][cellIndex + 2] = value; // Offset by 4 and 2 to match original structure
      });
    });

    // Convert updated data to CSV format and send it to backend
    const csvData = Papa.unparse(updatedData);
    const file = new File([csvData], 'edited_data.csv');
    await generateGraphFromFile(file);
  };

  const generateGraphFromFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
  
    if (entryData.resid && entryData.resnum && entryData.resmut) {
      formData.append(
        'variant-name',
        `${entryData.resid}${entryData.resnum}${entryData.resmut}`
      );
    }
  
    try {
      const response = await axios.post('https://d2dcure-ed1280e9442d.herokuapp.com/plot_temperature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'json',
      });
  
      if (response.status !== 200) {
        console.error("Failed to generate graph:", response.statusText);
        return;
      }
  
      const { T50, T50_SD, k, k_SD, image } = response.data;
  
      // Convert Base64 image string to a format that can be used in the img src
      const imageUrl = `data:image/png;base64,${image}`;
      setGraphImageUrl(imageUrl);
  
      // Store T50, T50_SD, k, and k_SD for use in handleSaveData
      setCalculatedValues({ T50, T50_SD, k, k_SD });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleCellChange = (rowIndex: number, cellIndex: number, newValue: string) => {
    const updatedData = [...thermoData];
    updatedData[rowIndex][cellIndex] = newValue;
    setThermoData(updatedData);
  };

  const handleSaveData = async () => {
    setIsSubmitting(true);
    try {
      const variant = entryData.resid + entryData.resnum + entryData.resmut;
  
      // Get values from CSV file data and entryData
      const slopeUnits = originalData[1][4]; 
      const purificationDate = originalData[2][6];
      const assayDate = originalData[2][7];
  
      // Generate filenames for CSV and plot
      const csvFilename = `${user.user_name}-BglB-${variant}-${entryData.id}-temp_assay.csv`;
      const plotFilename = `${user.user_name}-BglB-${variant}-${entryData.id}-temp_assay.png`;
  
      // Always create new CSV from current table data
      const updatedData = [...originalData]; // Clone original structure
      thermoData.forEach((row, rowIndex) => {
        row.forEach((value, cellIndex) => {
          updatedData[rowIndex + 4][cellIndex + 2] = value; // Update with current table values
        });
      });
      const csvContent = Papa.unparse(updatedData);
      const csvFileToUpload = new File([new Blob([csvContent])], csvFilename, { type: 'text/csv' });
  
      // Upload CSV file to S3
      await uploadToS3(csvFileToUpload, `temperature_assays/raw/${csvFilename}`);
  
      // Upload graph file to S3
      if (graphImageUrl) {
        const graphBlob = await fetch(graphImageUrl).then(res => res.blob());
        const graphFileToUpload = new File([graphBlob], plotFilename, { type: 'image/png' });
        await uploadToS3(graphFileToUpload, `temperature_assays/plots/${plotFilename}`);
      }
  
      // Call updateTempRawData endpoint to save metadata in the database
      await axios.post('/api/updateTempRawData', {
        user_name: user.user_name,
        variant,
        slope_units: slopeUnits,
        purification_date: purificationDate,
        assay_date: assayDate,
        csv_filename: csvFilename,
        plot_filename: plotFilename,
        parent_id: entryData.id,
        approved_by_student: approvedByStudent,
      });
  
      // Extract calculated values from the graph generation response
      const { T50, T50_SD, k, k_SD } = calculatedValues;
  
      // Call updateCharacterizationDataThermoStuff endpoint
      const response = await axios.post('/api/updateCharacterizationDataThermoStuff', {
        parent_id: entryData.id,
        T50,
        T50_SD,
        T50_k: k,
        T50_k_SD: k_SD,
      });
      if (response.status == 200) {
          console.log('Data saved successfully');
          alert('Data saved successfully!');
          const updatedEntry = response.data;
          updateEntryData(updatedEntry);
      } else {
          console.error('Error updating CharacterizationData:', response.data);
          alert('Error updating CharacterizationData');
      }
  
      setCurrentView('checklist');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to upload files to S3
  const uploadToS3 = async (file:any, s3Path:any) => {
    try {
      await s3
        .upload({
          Bucket: 'd2dcurebucket',
          Key: s3Path,
          Body: file,
          ContentType: file.type,
        })
        .promise();
    } catch (error) {
      console.error(`Error uploading to S3: ${error}`);
      throw new Error('Failed to upload file to S3');
    }
  };
  

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const [tempValues, setTempValues] = useState<any[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  // Add the data processing function
  const processData = (data: unknown) => {
    let messages: string[] = [];
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format');
      return [];
    }
    
    const typedData = data as any[][];
    
    // Check for empty rows
    let hasEmptyRows = false;
    for (let rowIndex = 4; rowIndex <= 11; rowIndex++) {
      const row = typedData[rowIndex];
      if (!row || 
          ((!row[2] || row[2] === '') && 
           (!row[3] || row[3] === '') && 
           (!row[4] || row[4] === ''))) {
        hasEmptyRows = true;
        break;
      }
    }
    
    if (hasEmptyRows) {
      messages.push("Warning: Data is missing at least one entire row. Please ensure all required data is included.");
    }

    // Handle negatives
    let hasNegatives = false;
    const noNegativesData = typedData.map((row: any[], rowIndex: number) => {
      if (rowIndex >= 4 && rowIndex <= 11) {
        return row.map((cell: any, colIndex: number) => {
          if (colIndex >= 2 && colIndex <= 4) {
            const value = parseFloat(cell);
            if (!isNaN(value) && value < 0) {
              hasNegatives = true;
              if (cell.includes('E') || cell.includes('e')) {
                return '0.00E+00';
              }
              return '0';
            }
            return cell;
          }
          return cell;
        });
      }
      return row;
    });

    if (hasNegatives) {
      messages.push("Negative values were detected and converted to zero");
    }

    // Process outliers
    let hasOutliers = false;
    const sanitizedData = noNegativesData.map((row: any[], rowIndex: number) => {
      if (rowIndex >= 4 && rowIndex <= 11) {
        const rowValues = [row[2], row[3], row[4]];
        const processedValues = detectOutliersMAD(rowValues);
        if (processedValues.some((val, idx) => val === '' && rowValues[idx] !== '')) {
          hasOutliers = true;
        }
        return [
          ...row.slice(0, 2),
          ...processedValues,
          ...row.slice(5)
        ];
      }
      return row;
    });

    if (hasOutliers) {
      messages.push("Outliers were detected and removed using the MAD method");
    }

    // Check for precision issues and impossible rates
    let previousRowAvg = Infinity;
    let previousRowSD = 0;
    
    for (let rowIndex = 4; rowIndex <= 11; rowIndex++) {
      const rowValues = sanitizedData[rowIndex].slice(2, 5)
        .map(val => {
          const num = parseFloat(val);
          return isNaN(num) ? null : num;
        })
        .filter((val): val is number => val !== null && val !== undefined);
        
      if (rowValues.length > 0) {
        const rowAvg = rowValues.reduce((a, b) => a + b, 0) / rowValues.length;
        const rowSD = Math.sqrt(
          rowValues.reduce((sq, n) => sq + Math.pow(n - rowAvg, 2), 0) / 
          (rowValues.length - 1)
        );
        const rowRelSD = (rowSD / rowAvg) * 100;

        // Check precision
        if (rowRelSD > 20) {
          messages.push(
            `Warning: Row ${['A','B','C','D','E','F','G','H'][rowIndex-4]} has poor precision ` +
            `(relative SD: ${rowRelSD.toFixed(1)}%)`
          );
        }

        // For thermo data, we expect activity to decrease as temperature increases
        if (rowAvg + rowSD < previousRowAvg - previousRowSD && previousRowAvg !== Infinity) {
          messages.push(
            `Error: Row ${['A','B','C','D','E','F','G','H'][rowIndex-4]} shows unexpected increase in activity at higher temperature. ` +
            `This may be due to noise in the measurements.`
          );
        }

        previousRowAvg = rowAvg;
        previousRowSD = rowSD;
      }
    }

    setSanitizationMessages(messages);
    return sanitizedData;
  };

  // Add the outlier detection helper function
  const detectOutliersMAD = (rowData: string[]) => {
    const validNumbers = rowData
      .map(cell => parseFloat(cell))
      .filter(num => !isNaN(num));

    if (validNumbers.length === 0) return rowData;

    // Calculate mean and standard deviation
    const mean = validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length;
    const sd = Math.sqrt(validNumbers.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (validNumbers.length - 1));
    const relativeSD = (sd / mean) * 100;

    // Only check for outliers if relative SD is above threshold
    const PRECISION_THRESHOLD = 20;
    if (relativeSD <= PRECISION_THRESHOLD) {
      return rowData;
    }

    // Calculate median and MAD
    const sortedNums = [...validNumbers].sort((a, b) => a - b);
    const median = sortedNums[Math.floor(sortedNums.length / 2)];
    const absoluteDeviations = validNumbers.map(num => Math.abs(num - median));
    const sortedDeviations = [...absoluteDeviations].sort((a, b) => a - b);
    const mad = sortedDeviations[Math.floor(sortedDeviations.length / 2)];

    return rowData.map(cell => {
      const value = parseFloat(cell);
      if (isNaN(value)) return cell;
      
      if (value < (median - 3 * mad) || value > (median + 3 * mad)) {
        return '';
      }
      return cell;
    });
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
          <h2 className="text-xl font-bold text-gray-800">Thermostability Assay Data Upload</h2>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            entryData.T50 
              ? "text-green-700 bg-green-100" 
              : "text-yellow-700 bg-yellow-100"
          }`}>
            {entryData.T50 ? "Complete" : "Incomplete"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Upload or edit thermostability assay data and generate plots
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6 space-y-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            {csvFilename && (
              <div className="mb-4">
                <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-5 h-5 text-[#06B7DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {csvFilename}
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
                        setCsvFilename(null);
                        setThermoData([]);
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

            {!csvFilename && (
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

          {thermoData.length > 0 && (
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Temperature Stability Plot</h3>
                  <button
                    onClick={generateGraphFromEditedData}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#06B7DB] hover:text-[#05a5c6] transition-colors"
                    title="Regenerate plot"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                </div>
                {graphImageUrl ? (
                  <img 
                    src={graphImageUrl} 
                    alt="Temperature Stability Plot" 
                    className="w-full h-[300px] object-contain rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-full h-[300px] bg-gray-200 rounded-lg animate-pulse" />
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Raw Data</h3>
                
                {/* Add sanitization messages above the table */}
                {sanitizationMessages.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {sanitizationMessages.map((message, index) => (
                      <div
                        key={index}
                        className="flex items-center p-4 rounded-lg bg-blue-50 border border-blue-200"
                      >
                        <svg
                          className="w-5 h-5 text-blue-500 mr-3"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-blue-700">{message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Table 
                  aria-label="Temperature assay data table"
                  classNames={{
                    wrapper: "min-h-[400px]",
                  }}
                >
                  <TableHeader>
                    <TableColumn>Row</TableColumn>
                    <TableColumn>Temp (°C)</TableColumn>
                    <TableColumn>1</TableColumn>
                    <TableColumn>2</TableColumn>
                    <TableColumn>3</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {rows.map((rowLabel, index) => (
                      <TableRow key={index}>
                        <TableCell>{rowLabel}</TableCell>
                        <TableCell>{tempValues[index]}</TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={thermoData[index]?.[0] || ''}
                            onChange={(e) => handleCellChange(index, 0, e.target.value)}
                            className="w-full bg-transparent border-b border-gray-200 focus:border-[#06B7DB] outline-none px-2 py-1"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={thermoData[index]?.[1] || ''}
                            onChange={(e) => handleCellChange(index, 1, e.target.value)}
                            className="w-full bg-transparent border-b border-gray-200 focus:border-[#06B7DB] outline-none px-2 py-1"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={thermoData[index]?.[2] || ''}
                            onChange={(e) => handleCellChange(index, 2, e.target.value)}
                            className="w-full bg-transparent border-b border-gray-200 focus:border-[#06B7DB] outline-none px-2 py-1"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {thermoRawDataEntryData && (
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
                          <span className="text-sm text-gray-500">Slope Units</span>
                          <p className="text-sm font-medium text-gray-900">
                            {thermoRawDataEntryData.slope_units?.replace(/_/g, '/')}
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
                            {thermoRawDataEntryData.purification_date ? (
                              <>Purified: {new Date(thermoRawDataEntryData.purification_date).toLocaleDateString()}</>
                            ) : 'Purification date not set'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {thermoRawDataEntryData.assay_date ? (
                              <>Assayed: {new Date(thermoRawDataEntryData.assay_date).toLocaleDateString()}</>
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
                        {thermoRawDataEntryData.user_name || 'Unknown user'} on {' '}
                        {new Date(thermoRawDataEntryData.updated).toLocaleDateString()}
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
          onClick={handleSaveData}
          className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!thermoData.length || isSubmitting}
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
            'Submit'
          )}
        </button>
        
        <span className="text-xs text-gray-500">
          Data file and plots required
        </span>
      </CardFooter>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="h-[200px]">
            <CardBody className="text-4xl pt-8 font-light overflow-hidden">
              <img 
                src="/resources/images/Microsoft_Excel-Logo.wine.svg"
                className="pl-4 pt-2 w-14 h-12 select-none pointer-events-none" 
                draggable="false"
                alt="Excel logo" 
              />
              <h1 className="text-lg pl-5 pt-2 font-regular">Temperature Assay Data</h1>
              <p className="text-xs pl-5 text-gray-500 -mt-1">(standard vertical temperature gradient)</p>
            </CardBody>
            <CardFooter>
              <Button 
                variant="bordered" 
                onPress={() => window.location.href = '/downloads/temperature_assay_single_variant_template.csv'} 
                className="w-full h-[45px] font-regular border-[2px] hover:bg-[#06B7DB] group"
                style={{ borderColor: "#06B7DB", color: "#06B7DB" }}
              >
                <span className="group-hover:text-white">Download Template</span>
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-[200px] ">
            <CardBody className="text-4xl pt-8 font-light overflow-hidden">
              <img 
                src="/resources/images/Microsoft_Excel-Logo.wine.svg"
                className="pl-4 pt-2 w-14 h-12 select-none pointer-events-none" 
                draggable="false"
                alt="Excel logo" 
              />
              <h1 className="text-lg pl-5 pt-2 font-regular">Temperature Assay Data</h1>
              <p className="text-xs pl-5 text-gray-500 -mt-1">(alternate horizontal temperature gradient)</p>
            </CardBody>
            <CardFooter>
              <Button 
                variant="bordered" 
                onPress={() => window.location.href = '/downloads/temperature_assay_single_variant_template_horizontal.csv'} 
                className="w-full h-[45px] font-regular border-[2px] hover:bg-[#06B7DB] group"
                style={{ borderColor: "#06B7DB", color: "#06B7DB" }}
              >
                <span className="group-hover:text-white">Download Template</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Card>
  );
};

export default ThermoAssayDataView;
