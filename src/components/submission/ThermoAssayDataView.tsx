import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { useUser } from '@/components/UserProvider';
import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Checkbox } from '@nextui-org/checkbox';
import Image from 'next/image';

interface ThermoAssayDataViewProps {
  setCurrentView: (view: string) => void;
  entryData: any;
  updateEntryData: (newData: any) => void;
}

const ThermoAssayDataView: React.FC<ThermoAssayDataViewProps> = ({
  setCurrentView,
  entryData,
  updateEntryData
}) => {
  const { user } = useUser();

  const [thermoRawDataEntryData, setThermoRawDataEntryData] = useState<any>(null);

  // 2D array that we keep as the "original" entire CSV structure
  const [originalData, setOriginalData] = useState<string[][]>([]);

  // The user-editable portion (just the numeric data cells)
  const [thermoData, setThermoData] = useState<string[][]>([]);
  const [tempValues, setTempValues] = useState<any[]>([]);

  // "vertical" or "horizontal"
  const [templateType, setTemplateType] = useState<'vertical' | 'horizontal' | null>(null);

  // Graph image from backend
  const [graphImageUrl, setGraphImageUrl] = useState<string | null>(null);

  // Name of the CSV in S3
  const [csvFilename, setCsvFilename] = useState<string | null>(null);

  // T50, etc.
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

  // For warnings about negatives/outliers
  const [sanitizationMessages, setSanitizationMessages] = useState<string[]>([]);

  // -------------------------------
  // 1) HELPER: Download from S3
  //    GET /api/s3?folder=temperature_assays/raw&download=<filename>
  // -------------------------------
  async function fetchFileFromS3(folder: string, fileName: string): Promise<Blob> {
    // Ask our Next.js API route for a presigned download URL
    const resp = await fetch(`/api/s3?folder=${folder}&download=${fileName}`);
    if (!resp.ok) {
      throw new Error('Failed to get presigned download URL');
    }
    const { presignedUrl } = await resp.json(); // { presignedUrl, fileKey }

    // Then fetch the actual file from that presignedUrl
    const fileResp = await fetch(presignedUrl);
    if (!fileResp.ok) {
      throw new Error('Failed to download file from S3');
    }
    return fileResp.blob();
  }

  // -------------------------------
  // 2) HELPER: Upload a File (Base64) to S3
  //    POST /api/s3?folder=<folder>
  // -------------------------------
  async function uploadFileToS3(folder: string, newFileName: string, fileBase64: string) {
    const resp = await fetch(`/api/s3?folder=${folder}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newFileName, fileBase64 }),
    });
    if (!resp.ok) {
      throw new Error('Failed to upload file to S3');
    }
    return resp.json(); // { message, objectKey, url }
  }

  // Utility: Convert any Blob to base64
  async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string; // e.g. data:<type>;base64,<...>
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(blob);
    });
  }

  // A small helper to unify "data:image/png;base64,stuff"
  const getImageUrl = (base64String: string) => {
    if (!base64String) return '';
    if (base64String.startsWith('data:image')) {
      return base64String;
    }
    return `data:image/png;base64,${base64String}`;
  };

  // -------------------------------------------------------------------
  //   1) Download & Process the CSV from S3 => parse it => set state
  // -------------------------------------------------------------------
  const fetchAndProcessCSV = useCallback(async (filename: string) => {
    try {
      // 1. Download CSV from S3 as a Blob
      const blob = await fetchFileFromS3('temperature_assays/raw', filename);

      // 2. Convert Blob to File, parse with Papa
      const csvFile = new File([blob], filename, { type: 'text/csv' });
      const fileContent = await fileToText(csvFile);
      const parsedData = Papa.parse(fileContent, { header: false }).data as any[][];

      // 3. Store in state
      setCsvFilename(filename);
      setOriginalData(parsedData);

      // 4. Detect template type
      const isVertical = parsedData?.[2]?.[1] === 'Row';
      setTemplateType(isVertical ? 'vertical' : 'horizontal');

      // 5. Extract data from the CSV => setThermoData
      if (isVertical) {
        extractVerticalData(parsedData);
      } else {
        extractHorizontalData(parsedData);
      }

      // 6. Sanitize the data (negatives, outliers)
      const sanitizedData = processData(parsedData, isVertical);

      // Based on template, re-slice to create `thermoData`
      if (isVertical) {
        const sanitizedEditableData = sanitizedData.slice(4, 12).map(row => row.slice(2, 5));
        setThermoData(sanitizedEditableData);
      } else {
        const { dataRows } = getHorizontalDataRows(sanitizedData);
        setThermoData(dataRows.map(row => row.dataCells));
      }

      // 7. Generate graph from the sanitized CSV
      const sanitizedCsv = Papa.unparse(sanitizedData);
      const sanitizedFile = new File([sanitizedCsv], filename, { type: 'text/csv' });
      await generateGraphFromFile(sanitizedFile);

      // 8. Set `thermoRawDataEntryData` from partial CSV (like slope_units, etc.)
      if (isVertical) {
        setThermoRawDataEntryData({
          slope_units: parsedData[1]?.[4],
          purification_date: parsedData[2]?.[6],
          assay_date: parsedData[2]?.[7],
          user_name: user?.user_name,
          updated: new Date().toISOString(),
        });
      } else {
        setThermoRawDataEntryData({
          slope_units: parsedData[5]?.[1],
          purification_date: parsedData[7]?.[1],
          assay_date: parsedData[8]?.[1],
          user_name: user?.user_name,
          updated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching and processing CSV file from S3:', error);
    }
  }, [user]);

  // If there's an existing CSV, load & parse it
  useEffect(() => {
    async function fetchTempRawDataEntryData() {
      if (!entryData.id) return;
      try {
        const response = await axios.get('/api/getTempRawDataEntryData', {
          params: { parent_id: entryData.id }
        });
        if (response.status === 200) {
          const data = response.data;
          setThermoRawDataEntryData(data);
    
          if (data.csv_filename && data.csv_filename !== entryData.temp_raw_data_filename) {
            await fetchAndProcessCSV(data.csv_filename);
          }
        }
      } catch (error) {
        // If it's a 404, this just means there's no data yet, which is expected for first-time users
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          console.log('No temperature data found for this entry yet - this is normal for new entries');
          // Set state to default/empty values if needed
          setThermoRawDataEntryData(null);
        } else {
          // Log other errors but don't show them to the user
          console.error('Error fetching temperature data:', error);
        }
      }
    }
  
    fetchTempRawDataEntryData();
  }, [entryData.id]);

  // Helper: convert File -> text
  async function fileToText(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // -------------------------------------------------------------------
  //   2) If user drags/drops a local CSV file => parse & show
  // -------------------------------------------------------------------
  const handleFile = async (file: File) => {
    if (!file) return;
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'csv') {
      setFileError('Only .csv files are allowed');
      setCsvFilename(null);
      return;
    } else if (file.size > 500000) {
      setFileError('File must be smaller than 500 kB');
      setCsvFilename(null);
      return;
    }

    setFileError('');
    setCsvFilename(file.name);

    try {
      const fileContent = await fileToText(file);
      const parsedData = Papa.parse(fileContent, { header: false }).data as any[][];

      setOriginalData(parsedData);

      // Determine template type
      const isVertical = (parsedData?.[2]?.[1] === 'Row');
      setTemplateType(isVertical ? 'vertical' : 'horizontal');

      if (isVertical) {
        extractVerticalData(parsedData);
      } else {
        extractHorizontalData(parsedData);
      }

      // Then sanitize
      const sanitizedData = processData(parsedData, isVertical);

      if (isVertical) {
        const sanitizedEditableData = sanitizedData.slice(4, 12).map(row => row.slice(2, 5));
        setThermoData(sanitizedEditableData);
      } else {
        const { dataRows } = getHorizontalDataRows(sanitizedData);
        setThermoData(dataRows.map(row => row.dataCells));
      }

      // Generate plot from sanitized CSV
      const sanitizedCsv = Papa.unparse(sanitizedData);
      const sanitizedFile = new File([sanitizedCsv], file.name, { type: 'text/csv' });
      await generateGraphFromFile(sanitizedFile);

      // Set `thermoRawDataEntryData` from partial data
      if (isVertical) {
        setThermoRawDataEntryData({
          slope_units: parsedData[1]?.[4],
          purification_date: parsedData[2]?.[6],
          assay_date: parsedData[2]?.[7],
          user_name: user?.user_name,
          updated: new Date().toISOString(),
        });
      } else {
        setThermoRawDataEntryData({
          slope_units: parsedData[5]?.[1],
          purification_date: parsedData[7]?.[1],
          assay_date: parsedData[8]?.[1],
          user_name: user?.user_name,
          updated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setFileError('Failed to process file');
    }
  };

  // Drag-drop event handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // -------------------------------------------------------------------
  //   3) Download CSV from S3
  // -------------------------------------------------------------------
  const downloadCsvFile = async () => {
    if (!csvFilename) return;
    try {
      const blob = await fetchFileFromS3('temperature_assays/raw', csvFilename);

      // Trigger a browser download for the Blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = csvFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating download link:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // -------------------------------------------------------------------
  //   4) Graph Generation (upload CSV to Flask & get plot)
  // -------------------------------------------------------------------
  async function generateGraphFromFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    if (entryData.resid && entryData.resnum && entryData.resmut) {
      formData.append('variant-name', `${entryData.resid}${entryData.resnum}${entryData.resmut}`);
    }

    try {
      const response = await axios.post(
        'https://d2dcure-ed1280e9442d.herokuapp.com/plot_temperature',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          responseType: 'json',
        }
      );

      if (response.status !== 200) {
        console.error('Failed to generate graph:', response.statusText);
        return;
      }

      const { T50, T50_SD, k, k_SD, image } = response.data;
      setGraphImageUrl(`data:image/png;base64,${image}`);
      setCalculatedValues({ T50, T50_SD, k, k_SD });
    } catch (error) {
      console.error('Error generating temperature plot:', error);
    }
  }

  // For the user pressing "Regenerate" after editing cells
  const generateGraphFromEditedData = async () => {
    const updatedData = rebuildCsvFromEdits();
    const csvData = Papa.unparse(updatedData);
    const file = new File([csvData], 'edited_data.csv', { type: 'text/csv' });
    await generateGraphFromFile(file);
  };

  // -------------------------------------------------------------------
  //   5) Rebuild CSV from user-edits in thermoData
  // -------------------------------------------------------------------
  function rebuildCsvFromEdits(): string[][] {
    const updatedData = originalData.map(row => [...row]);
    if (!templateType) return updatedData;

    if (templateType === 'vertical') {
      // For vertical, user edits are in rows 4..11 => columns 2..4
      for (let rowIndex = 0; rowIndex < thermoData.length; rowIndex++) {
        for (let colIndex = 0; colIndex < thermoData[rowIndex].length; colIndex++) {
          updatedData[rowIndex + 4][colIndex + 2] = thermoData[rowIndex][colIndex];
        }
      }
    } else {
      // For horizontal, columns are determined by getHorizontalDataRows
      const { tempArray } = getHorizontalDataRows(originalData);
      for (let rowIndex = 0; rowIndex < thermoData.length; rowIndex++) {
        const col = tempArray[rowIndex]?.colIndex;
        if (col == null) continue;
        // row=4 => first data, row=5 => second
        updatedData[4][col] = thermoData[rowIndex][0];
        if (thermoData[rowIndex].length > 1) {
          updatedData[5][col] = thermoData[rowIndex][1];
        }
      }
    }

    return updatedData;
  }

  // -------------------------------------------------------------------
  //   6) The user can edit cells in the table => update thermoData
  // -------------------------------------------------------------------
  const handleCellChange = (rowIndex: number, cellIndex: number, newValue: string) => {
    const updatedData = [...thermoData];
    updatedData[rowIndex][cellIndex] = newValue;
    setThermoData(updatedData);
  };

  // -------------------------------------------------------------------
  //   7) handleSaveData: finalize => upload CSV & plot => update DB
  // -------------------------------------------------------------------
  const handleSaveData = async () => {
    setIsSubmitting(true);
    try {
      const variant = `${entryData.resid}${entryData.resnum}${entryData.resmut}`;

      // We need slope_units, purification_date, assay_date 
      // from different rows depending on template
      let slopeUnits = '';
      let purificationDate = '';
      let assayDate = '';

      if (templateType === 'vertical') {
        slopeUnits = originalData[1]?.[4] ?? '';
        purificationDate = originalData[2]?.[6] ?? '';
        assayDate = originalData[2]?.[7] ?? '';
      } else {
        slopeUnits = originalData[5]?.[1] ?? '';
        purificationDate = originalData[7]?.[1] ?? '';
        assayDate = originalData[8]?.[1] ?? '';
      }

      // 1) Rebuild CSV from user edits
      const updatedData = rebuildCsvFromEdits();
      const csvContent = Papa.unparse(updatedData);

      // 2) Create final filenames
      const baseFileName = `${user?.user_name || 'unknown'}-BglB-${variant}-${entryData.id}-temp_assay`;
      const newCsvFilename = `${baseFileName}.csv`;
      const newPlotFilename = `${baseFileName}.png`;

      // 3) Upload CSV to S3 => convert to base64 first
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const csvBase64 = await blobToBase64(csvBlob);
      await uploadFileToS3('temperature_assays/raw', newCsvFilename, csvBase64);

      // 4) If we have a graph, upload that too
      if (graphImageUrl) {
        const graphBlob = await fetch(graphImageUrl).then(res => res.blob());
        const graphBase64 = await blobToBase64(graphBlob);
        await uploadFileToS3('temperature_assays/plots', newPlotFilename, graphBase64);
      }

      // 5) Update DB for the raw data
      const response = await axios.post('/api/updateTempRawData', {
        user_name: user?.user_name,
        variant,
        slope_units: slopeUnits,
        purification_date: purificationDate,
        assay_date: assayDate,
        csv_filename: newCsvFilename,
        plot_filename: newPlotFilename,
        parent_id: entryData.id,
        approved_by_student: approvedByStudent
      });

      // 6) Then update T50, etc. - now with temp_raw_data_id
      if (response.status === 200) {
        const { tempRawDataId } = response.data;
        const { T50, T50_SD, k, k_SD } = calculatedValues;
        
        const updateResponse = await axios.post('/api/updateCharacterizationDataThermoStuff', {
          parent_id: entryData.id,
          T50,
          T50_SD,
          T50_k: k,
          T50_k_SD: k_SD,
          temp_raw_data_id: tempRawDataId
        });

        if (updateResponse.status === 200) {
          alert('Data saved successfully!');
          const updatedEntry = updateResponse.data;
          updateEntryData(updatedEntry);
        } else {
          console.error('Error updating CharacterizationData:', updateResponse.data);
          alert('Error updating CharacterizationData');
        }
      } else {
        console.error('Error updating TempRawData:', response.data);
        alert('Error updating TempRawData');
      }

      setCurrentView('checklist');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------
  //   8) Helper for reading horizontal data (temperatures in row=1 => col=3..14)
  // -------------------------------------------------------------------
  function getHorizontalDataRows(parsedData: any[][]) {
    const tempRowIndex = 1;
    const firstTempCol = 3;
    const maxTempCols = 15;
    let tempArray: { temp?: number; colIndex: number }[] = [];

    for (let c = firstTempCol; c < maxTempCols && c < (parsedData[tempRowIndex]?.length ?? 0); c++) {
      if (parsedData[tempRowIndex][c] !== '' && parsedData[tempRowIndex][c] != null) {
        tempArray.push({
          temp: parseFloat(parsedData[tempRowIndex][c]),
          colIndex: c
        });
      }
    }

    const firstDataRow = 4; 
    const secondDataRow = 5; 

    let dataRows = tempArray.map((t) => {
      const col = t.colIndex;
      const val1 = parsedData[firstDataRow]?.[col] ?? '';
      const val2 = parsedData[secondDataRow]?.[col] ?? '';
      return {
        temperature: t.temp,
        dataCells: [String(val1), String(val2)]
      };
    });

    return { tempArray, dataRows };
  }

  // -------------------------------------------------------------------
  //   9) Extract vertical data
  // -------------------------------------------------------------------
  function extractVerticalData(parsedData: any[][]) {
    // rows 4..11 => col=0 is temp
    const extractedTemperatures = parsedData.slice(4, 12).map(row => parseFloat(row[0]));
    setTempValues(extractedTemperatures);
    const editableData = parsedData.slice(4, 12).map(row => row.slice(2, 5));
    setThermoData(editableData);
  }

  // -------------------------------------------------------------------
  //   10) Extract horizontal data
  // -------------------------------------------------------------------
  function extractHorizontalData(parsedData: any[][]) {
    const { tempArray, dataRows } = getHorizontalDataRows(parsedData);
    setTempValues(tempArray.map(t => t.temp ?? ''));
    setThermoData(dataRows.map(row => row.dataCells));
  }

  // -------------------------------------------------------------------
  //   11) Data sanitization
  // -------------------------------------------------------------------
  function processData(parsedData: any[][], isVertical: boolean) {
    let messages: string[] = [];
    if (!Array.isArray(parsedData)) {
      console.error('Invalid data format');
      return parsedData;
    }

    let hasNegatives = false;
    let hasOutliers = false;
    let hasEmptyRows = false;

    // Row/col ranges differ
    let rowRange: number[] = [];
    let colRange: number[] = [];

    if (isVertical) {
      rowRange = [4, 5, 6, 7, 8, 9, 10, 11]; // 8 rows
      colRange = [2, 3, 4]; // 3 columns
    } else {
      rowRange = [4, 5]; // 2 rows
      colRange = [];
      // Build colRange from row=1 => col=3..14 if not empty
      for (let c = 3; c <= 14; c++) {
        if (parsedData[1] && parsedData[1][c] !== '' && parsedData[1][c] != null) {
          colRange.push(c);
        }
      }
    }

    function sanitizeRowOrColumn(values: string[]): string[] {
      // 1) Convert negatives => 0
      const replacedNegatives = values.map(val => {
        const num = parseFloat(val);
        if (!isNaN(num) && num < 0) {
          hasNegatives = true;
          return '0';
        }
        return val;
      });
      // 2) Outlier detection
      const processed = detectOutliersMAD(replacedNegatives);
      if (processed.some((v, idx) => v === '' && replacedNegatives[idx] !== '')) {
        hasOutliers = true;
      }
      return processed;
    }

    if (isVertical) {
      rowRange.forEach((r) => {
        const rowSlice = parsedData[r].slice(2, 5);
        const isEmptyRow = rowSlice.every(cell => cell === '' || cell == null);
        if (isEmptyRow) hasEmptyRows = true;

        const sanitizedSlice = sanitizeRowOrColumn(rowSlice);
        for (let i = 0; i < sanitizedSlice.length; i++) {
          parsedData[r][i+2] = sanitizedSlice[i];
        }
      });
    } else {
      colRange.forEach((c) => {
        const cells = [parsedData[4][c], parsedData[5][c]];
        const isEmpty = cells.every(x => x === '' || x == null);
        if (isEmpty) hasEmptyRows = true;

        const sanitized = sanitizeRowOrColumn(cells);
        parsedData[4][c] = sanitized[0];
        if (cells.length > 1) {
          parsedData[5][c] = sanitized[1];
        }
      });
    }

    if (hasEmptyRows) {
      messages.push('Warning: Some rows/columns are completely empty. Please ensure data is provided.');
    }
    if (hasNegatives) {
      messages.push('Negative values were detected and converted to zero.');
    }
    if (hasOutliers) {
      messages.push('Outliers were detected and removed using the MAD method.');
    }

    setSanitizationMessages(messages);
    return parsedData;
  }

  // Outlier detection (MAD)
  function detectOutliersMAD(values: string[]) {
    const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    if (nums.length === 0) return values;

    const meanVal = nums.reduce((a, b) => a + b, 0) / nums.length;
    const sd = Math.sqrt(nums.reduce((sq, n) => sq + Math.pow(n - meanVal, 2), 0) / (nums.length - 1));
    const relSD = (sd / meanVal) * 100;
    const THRESHOLD = 20;
    if (relSD <= THRESHOLD) {
      return values; // no outlier removal
    }

    // If above threshold, do median + MAD approach
    const sortedNums = [...nums].sort((a, b) => a - b);
    const median = sortedNums[Math.floor(sortedNums.length / 2)];
    const absDev = nums.map(n => Math.abs(n - median));
    const sortedDev = absDev.sort((a, b) => a - b);
    const mad = sortedDev[Math.floor(sortedDev.length / 2)];

    // Mark outliers as ''
    return values.map((v) => {
      const val = parseFloat(v);
      if (isNaN(val)) return v;
      if (val < (median - 3 * mad) || val > (median + 3 * mad)) {
        return '';
      }
      return v;
    });
  }

  // -------------------------------------------------------------------
  //   Render
  // -------------------------------------------------------------------
  const verticalRowLabels = ['A','B','C','D','E','F','G','H'];
  const horizontalRowLabels = ['A','B','C','D','E','F','G','H','I','J','K','L'];

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
          <span
            className={`text-xs font-medium rounded-full px-3 py-1 ${
              entryData.T50 ? 'text-green-700 bg-green-100' : 'text-yellow-700 bg-yellow-100'
            }`}
          >
            {entryData.T50 ? 'Complete' : 'Incomplete'}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Upload or edit thermostability assay data and generate plots
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6 space-y-6">
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            {csvFilename && (
              <div className="mb-4">
                <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg
                      className="w-5 h-5 text-[#06B7DB]"
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{csvFilename}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={downloadCsvFile}
                      className="text-xs font-medium text-[#06B7DB] bg-[#06B7DB]/10 px-3 py-1.5 rounded-full hover:bg-[#06B7DB]/20 transition-colors inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download
                    </button>
                    <button
                      onClick={() => {
                        setCsvFilename(null);
                        setThermoData([]);
                        setGraphImageUrl(null);
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
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
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
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
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
                    <p className="text-sm text-gray-500">or drag and drop</p>
                  </div>
                </div>
              </div>
            )}

            {fileError && (
              <div className="mt-2 text-sm flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-md">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {fileError}
              </div>
            )}
          </div>

          {/* If we have parsed data, show the UI */}
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

              {/* The single plot */}
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
                  <Image
                    src={getImageUrl(graphImageUrl)}
                    alt="Temperature Plot"
                    width={400}
                    height={300}
                    className="w-full max-w-[800px] max-h-[300px] mx-auto object-contain rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-full h-[300px] bg-gray-200 rounded-lg animate-pulse" />
                )}
              </div>

              {/* Raw Data Table */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Raw Data</h3>
                {sanitizationMessages.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {sanitizationMessages.map((message, idx) => (
                      <div
                        key={idx}
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

                {/* Vertical vs. Horizontal table */}
                {templateType === 'vertical' && (
                  <table className="min-w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                        <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp (°C)</th>
                        <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1</th>
                        <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2</th>
                        <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {verticalRowLabels.map((rowLabel, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">
                            {rowLabel}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">
                            {tempValues[index]}
                          </td>
                          {thermoData[index]?.map((val, colIdx) => (
                            <td key={colIdx} className="border border-gray-200 px-4 py-2">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleCellChange(index, colIdx, e.target.value)}
                                className="w-full bg-transparent border-b border-gray-300 focus:border-[#06B7DB] outline-none px-2 py-1 text-sm"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {templateType === 'horizontal' && (
                  <table className="min-w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                        <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp (°C)</th>
                        <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1</th>
                        <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {thermoData.map((rowValues, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">
                            {horizontalRowLabels[index] || ''}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">
                            {tempValues[index] ?? ''}
                          </td>
                          {rowValues.map((val, colIdx) => (
                            <td key={colIdx} className="border border-gray-200 px-4 py-2">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleCellChange(index, colIdx, e.target.value)}
                                className="w-full bg-transparent border-b border-gray-300 focus:border-[#06B7DB] outline-none px-2 py-1 text-sm"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Experiment details */}
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
                            {thermoRawDataEntryData.purification_date
                              ? <>Purified: {new Date(thermoRawDataEntryData.purification_date).toLocaleDateString()}</>
                              : 'Purification date not set'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {thermoRawDataEntryData.assay_date
                              ? <>Assayed: {new Date(thermoRawDataEntryData.assay_date).toLocaleDateString()}</>
                              : 'Assay date not set'}
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
                        {thermoRawDataEntryData.user_name || 'Unknown user'} on{' '}
                        {new Date(thermoRawDataEntryData.updated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4 mt-4">
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

      {/* Submit Button */}
      <CardFooter className="px-6 pb-6 pt-6 flex justify-between items-center border-t border-gray-100">
        <button
          onClick={handleSaveData}
          className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!thermoData.length || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            'Submit'
          )}
        </button>

        <span className="text-xs text-gray-500">Data file and plots required</span>
      </CardFooter>

      {/* Template downloads */}
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
              <Image
                src="/resources/images/Microsoft_Excel-Logo.wine.svg"
                alt="Excel logo"
                width={56}
                height={48}
                className="w-12 h-12 sm:w-14 sm:h-12 select-none pointer-events-none"
                draggable={false}
              />
              <h1 className="text-lg pl-5 pt-2 font-regular">Temperature Assay Data</h1>
              <p className="text-xs pl-5 text-gray-500 -mt-1">(standard vertical temperature gradient)</p>
            </CardBody>
            <CardFooter>
              <Button
                variant="bordered"
                onPress={() => (window.location.href = '/downloads/temperature_assay_single_variant_template.xlsx')}
                className="w-full h-[45px] font-regular border-[2px] hover:bg-[#06B7DB] group"
                style={{ borderColor: '#06B7DB', color: '#06B7DB' }}
              >
                <span className="group-hover:text-white">Download Template</span>
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-[200px] ">
            <CardBody className="text-4xl pt-8 font-light overflow-hidden">
              <Image
                src="/resources/images/Microsoft_Excel-Logo.wine.svg"
                alt="Excel logo"
                width={56}
                height={48}
                className="w-12 h-12 sm:w-14 sm:h-12 select-none pointer-events-none"
                draggable={false}
              />
              <h1 className="text-lg pl-5 pt-2 font-regular">Temperature Assay Data</h1>
              <p className="text-xs pl-5 text-gray-500 -mt-1">(alternate horizontal temperature gradient)</p>
            </CardBody>
            <CardFooter>
              <Button
                variant="bordered"
                onPress={() => (window.location.href = '/downloads/temperature_assay_single_variant_template_horizontal.xlsx')}
                className="w-full h-[45px] font-regular border-[2px] hover:bg-[#06B7DB] group"
                style={{ borderColor: '#06B7DB', color: '#06B7DB' }}
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
