import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../s3config'; 
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
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

  // 2D array that we keep as the "original" entire CSV structure
  const [originalData, setOriginalData] = useState<string[][]>([]);

  // The user-editable portion (just the numeric data cells) 
  // This can have 8 or 12 rows depending on vertical vs. horizontal
  // and either 3 or 2 columns for data
  const [thermoData, setThermoData] = useState<string[][]>([]);

  // The temperature values for each row
  const [tempValues, setTempValues] = useState<any[]>([]);

  // "vertical" or "horizontal"
  const [templateType, setTemplateType] = useState<'vertical' | 'horizontal' | null>(null);

  // Graph image from backend
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

  // Messages about negative values, outliers, etc.
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
          setThermoRawDataEntryData(null);
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

  // ---------------
  // 1. Grab CSV from S3 if already uploaded
  // 2. Parse & detect template type
  // 3. Extract relevant rows/cells, do sanitization, store in state
  // ---------------
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

      // Detect template type: check B3 => parsedData[2][1]
      // If "Row", we do vertical; else horizontal
      const isVertical = (parsedData?.[2]?.[1] === 'Row');
      setTemplateType(isVertical ? 'vertical' : 'horizontal');

      if (isVertical) {
        // For vertical: use the existing logic
        extractVerticalData(parsedData);
      } else {
        // For horizontal
        extractHorizontalData(parsedData);
      }

      // After extraction, we have an unsanitized table in state (thermoData),
      // so let's process & sanitize
      const sanitizedData = processData(parsedData, isVertical);
      
      // Overwrite thermoData with sanitized portion
      if (isVertical) {
        // For vertical, sanitized portion is rows 4..12 and cols 2..5
        const sanitizedEditableData = sanitizedData.slice(4, 12).map(row => row.slice(2, 5));
        setThermoData(sanitizedEditableData);
      } else {
        // For horizontal, we have 2 data points per temperature,
        // so we rebuild from sanitized data as well
        const { dataRows, columnIndices } = getHorizontalDataRows(sanitizedData);
        setThermoData(dataRows.map(row => row.dataCells));
      }

      // Generate the graph with sanitized data
      const sanitizedCsv = Papa.unparse(sanitizedData);
      const sanitizedFile = new File([sanitizedCsv], filename, { type: 'text/csv' });
      await generateGraphFromFile(sanitizedFile);
    } catch (error) {
      console.error('Error fetching and processing CSV file from S3:', error);
    }
  };

  // -----------------------------------------------------------
  //   Handle direct user drag-drop upload & parse
  // -----------------------------------------------------------
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
          
          setOriginalData(parsedData);

          // Detect template type
          const isVertical = (parsedData?.[2]?.[1] === 'Row');
          setTemplateType(isVertical ? 'vertical' : 'horizontal');

          // Extract the relevant rows/columns
          if (isVertical) {
            extractVerticalData(parsedData);
          } else {
            extractHorizontalData(parsedData);
          }

          // Then sanitize
          const sanitizedData = processData(parsedData, isVertical);

          // For vertical, re-slice the sanitized portion
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

        } catch (error) {
          console.error('Error processing file:', error);
          setFileError('Failed to process file');
        }
      }
    }
  };

  // Helper to handle drag-drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // -----------------------------------------------------------
  //   Utility: parse vertical data from the CSV 
  //   (extract the 8 temperatures, columns 0 for temp, 2..4 for data)
  // -----------------------------------------------------------
  function extractVerticalData(parsedData: any[][]) {
    // Temperatures are rows 4..11 (8 total) in col 0
    const extractedTemperatures = parsedData.slice(4, 12).map((row) => parseFloat(row[0]));
    setTempValues(extractedTemperatures);

    // The editable data is rows 4..11, columns 2..4 => 3 columns
    const editableData = parsedData.slice(4, 12).map(row => row.slice(2, 5));
    setThermoData(editableData);
  }

  // -----------------------------------------------------------
  //   Utility: parse horizontal data from the CSV 
  //   (temperatures in row=1 => col=3..14, each has 2 data points
  //    in row=4 => col=3..14 and row=5 => col=3..14)
  // -----------------------------------------------------------
  function extractHorizontalData(parsedData: any[][]) {
    const { tempArray, dataRows } = getHorizontalDataRows(parsedData);

    // The array of temperature values for each column 
    setTempValues(tempArray.map(t => t?.temp ?? ''));
    // The user-editable data (2 columns for each temperature)
    setThermoData(dataRows.map(row => row.dataCells));
  }

  // This helper extracts the horizontal info so we can 
  // store in state or re-sanitize easily.
  function getHorizontalDataRows(parsedData: any[][]) {
    // The user said temperatures are in row=1 (2 in Excel) from col=3..14 => D..O
    // We can read until we hit an empty cell or up to col=14
    const tempRowIndex = 1;  // row=2 in Excel
    const firstTempCol = 3;  // col=D in Excel
    const maxTempCols = 15;  // col=O in Excel is index=14; slice up to 15
    let tempArray: { temp?: number, colIndex: number }[] = [];

    // Gather columns that are not empty
    for (let c = firstTempCol; c < maxTempCols && c < (parsedData[tempRowIndex]?.length ?? 0); c++) {
      if (parsedData[tempRowIndex][c] !== '' && parsedData[tempRowIndex][c] != null) {
        tempArray.push({
          temp: parseFloat(parsedData[tempRowIndex][c]),
          colIndex: c
        });
      }
    }

    // For each temperature column colIndex, 
    // data #1 is row=4 => index=3 in zero-based? Actually we want D5 => row=4 => index=4. 
    // But be mindful: "D5" => row=5 => 1-based => so zero-based is row=4. 
    // The user said the two data points are at row=5..6 => zero-based 4..5
    // so let's define them:
    const firstDataRow = 4; // row=5 in Excel
    const secondDataRow = 5; // row=6 in Excel

    let dataRows = tempArray.map((t, idx) => {
      const col = t.colIndex;
      // read the two data cells
      const val1 = parsedData[firstDataRow]?.[col] ?? '';
      const val2 = parsedData[secondDataRow]?.[col] ?? '';
      // We might store them in an array like [val1, val2].
      // We'll also store the temperature for convenience
      return {
        temperature: t.temp,
        dataCells: [String(val1), String(val2)],
      };
    });

    return { tempArray, dataRows, columnIndices: tempArray.map(t => t.colIndex) };
  }

  // -----------------------------------------------------------
  //   Generating the plot from the "edited" data
  //   (Essentially rebuild the CSV from originalData + user's edits
  //    then POST to python backend)
  // -----------------------------------------------------------
  const generateGraphFromEditedData = async () => {
    const updatedData = rebuildCsvFromEdits();

    // Convert updated data to CSV format and send it to backend
    const csvData = Papa.unparse(updatedData);
    const file = new File([csvData], 'edited_data.csv');
    await generateGraphFromFile(file);
  };

  // Actually calls the Flask endpoint with the CSV
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
      const imageUrl = `data:image/png;base64,${image}`;

      setGraphImageUrl(imageUrl);
      setCalculatedValues({ T50, T50_SD, k, k_SD });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // -----------------------------------------------------------
  //   Reconstruct the CSV from original + user edits
  //   so we can submit or regenerate the plot
  // -----------------------------------------------------------
  function rebuildCsvFromEdits() {
    // We create a clone of the original data
    const updatedData = originalData.map((row) => [...row]);

    if (!templateType) return updatedData;

    if (templateType === 'vertical') {
      // For vertical, user edits are in rows 4..11 (8 total),
      // columns 2..4 => 3 columns
      // so we place thermoData[rowIndex][colIndex] into updatedData[rowIndex+4][colIndex+2]
      for (let rowIndex = 0; rowIndex < thermoData.length; rowIndex++) {
        for (let colIndex = 0; colIndex < thermoData[rowIndex].length; colIndex++) {
          updatedData[rowIndex + 4][colIndex + 2] = thermoData[rowIndex][colIndex];
        }
      }
    } else {
      // Horizontal: we have up to 12 "rows" in thermoData, each row has 2 columns
      // The temperature columns are col=3..14 from row=1
      // The data for each temperature col c is in row=4..5 => 4 for the first cell, 5 for the second
      // So we have to match rowIndex => which column c in original
      // We re-derive which columns were used
      const { tempArray } = getHorizontalDataRows(originalData);
      // Just be sure it is the same length as thermoData
      for (let rowIndex = 0; rowIndex < thermoData.length; rowIndex++) {
        const col = tempArray[rowIndex]?.colIndex;
        if (col == null) continue;
        // first data is row=4 => updatedData[4][col], second is row=5 => updatedData[5][col]
        updatedData[4][col] = thermoData[rowIndex][0];
        updatedData[5][col] = thermoData[rowIndex][1];
      }
    }

    return updatedData;
  }

  // -----------------------------------------------------------
  //   Fired when the user edits a cell in the table
  // -----------------------------------------------------------
  const handleCellChange = (rowIndex: number, cellIndex: number, newValue: string) => {
    const updatedData = [...thermoData];
    updatedData[rowIndex][cellIndex] = newValue;
    setThermoData(updatedData);
  };

  // -----------------------------------------------------------
  //   On "Submit", we:
  //   1. Rebuild CSV & upload to S3
  //   2. Upload plot to S3
  //   3. Update the DB with CSV/plot filenames, T50, etc.
  // -----------------------------------------------------------
  const handleSaveData = async () => {
    setIsSubmitting(true);
    try {
      const variant = entryData.resid + entryData.resnum + entryData.resmut;
  
      // We need slope_units, purification_date, assay_date from different cells 
      // depending on vertical vs horizontal
      let slopeUnits = '';
      let purificationDate = '';
      let assayDate = '';

      if (templateType === 'vertical') {
        slopeUnits = originalData[1]?.[4] ?? '';
        purificationDate = originalData[2]?.[6] ?? '';
        assayDate = originalData[2]?.[7] ?? '';
      } else {
        // Horizontal
        // the user says date purified is B8 => row=7 col=1
        // date assayed is B9 => row=8 col=1
        purificationDate = originalData[7]?.[1] ?? '';
        assayDate = originalData[8]?.[1] ?? '';
        // Slope units was not explicitly stated for horizontal.
        // If your template places them somewhere else, set accordingly.
        // Otherwise we can try the same location or set an empty string.
        slopeUnits = originalData[1]?.[4] ?? ''; 
      }

      // Rebuild CSV with user's current edits
      const updatedData = rebuildCsvFromEdits();
      const csvContent = Papa.unparse(updatedData);

      // Create final filenames
      const csvFilename = `${user.user_name}-BglB-${variant}-${entryData.id}-temp_assay.csv`;
      const plotFilename = `${user.user_name}-BglB-${variant}-${entryData.id}-temp_assay.png`;

      // Upload CSV file to S3
      const csvFileToUpload = new File([new Blob([csvContent])], csvFilename, { type: 'text/csv' });
      await uploadToS3(csvFileToUpload, `temperature_assays/raw/${csvFilename}`);
  
      // Upload graph file to S3 (if we have a graph)
      if (graphImageUrl) {
        const graphBlob = await fetch(graphImageUrl).then(res => res.blob());
        const graphFileToUpload = new File([graphBlob], plotFilename, { type: 'image/png' });
        await uploadToS3(graphFileToUpload, `temperature_assays/plots/${plotFilename}`);
      }
  
      // Update the DB for the raw data
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
  
      // Then update T50 etc.
      const { T50, T50_SD, k, k_SD } = calculatedValues;
  
      const response = await axios.post('/api/updateCharacterizationDataThermoStuff', {
        parent_id: entryData.id,
        T50,
        T50_SD,
        T50_k: k,
        T50_k_SD: k_SD,
      });

      if (response.status === 200) {
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

  // Helper function to upload file to S3
  const uploadToS3 = async (file: File, s3Path: string) => {
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

  // -----------------------------------------------------------
  //  Download the existing CSV from S3
  // -----------------------------------------------------------
  const downloadCsvFile = async () => {
    if (!csvFilename) return;
    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `temperature_assays/raw/${csvFilename}`,
        Expires: 60,
      };
      const url = await s3.getSignedUrlPromise('getObject', params);

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

  // -----------------------------------------------------------
  //   The sanitization function 
  //   (Same logic for negatives, outliers, etc.)
  //   We do an if (templateType==='vertical') for row slicing or else for horizontal
  //   Or we can simply run the same logic if all the data is in "parsedData".
  //   Then inside we skip rows or do additional checks.
  // -----------------------------------------------------------
  const processData = (data: unknown, isVertical: boolean) => {
    let messages: string[] = [];
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format');
      return [];
    }
    
    const typedData = data as any[][];

    // We apply the same outlier detection, negative-value checks, etc.
    // The difference: for vertical, the relevant numeric cells are rows 4..11 => columns 2..4
    // For horizontal, they're row=4..5 => columns 3..14, repeated across columns.
    // We'll do a *global pass*, focusing specifically on rows or columns in either template.

    let hasNegatives = false;
    let hasOutliers = false;
    let hasEmptyRows = false;

    // Because we want to give consistent warnings, we do an inclusive approach.
    // For vertical: we expect 8 rows of data from row=4..11
    // For horizontal: 2 rows of data, columns 3..14, repeated. We'll handle that carefully below.

    // We'll define which row/col ranges are "expected" for data.
    let rowRange: number[] = [];
    let colRange: number[] = [];
    if (isVertical) {
      rowRange = [4,5,6,7,8,9,10,11]; // 8 rows
      colRange = [2,3,4];            // 3 columns
    } else {
      rowRange = [4,5];             // horizontal has 2 "data" rows
      colRange = [];
      // We'll pick columns from D..O => 3..14 
      // but only up to however many columns have data
      for (let c = 3; c <= 14; c++) {
        // optional check if typedData[1][c] is not empty => we have a temp => so we keep c
        if (typedData[1] && typedData[1][c] !== '' && typedData[1][c] != null) {
          colRange.push(c);
        }
      }
    }

    // We'll flatten out these relevant cells, detect negatives/outliers, etc.
    // You could do row-by-row checks if needed. We'll just do a simpler approach:
    // (1) Replace negative with zero
    // (2) Attempt outlier detection for each row or each column? 
    //     The original code did row-based checks for vertical. 
    // For horizontal, we'll do it for each "column" set, because each temperature is a column.

    // Let's define a small helper that processes a list of numeric strings with the same logic:
    function sanitizeRowOrColumn(numericCells: string[]): string[] {
      // Convert negatives, detect outliers, etc. 
      let replacedNegatives = numericCells.map(val => {
        const num = parseFloat(val);
        if (!isNaN(num) && num < 0) {
          hasNegatives = true;
          return '0'; 
        }
        return val;
      });
      // Then outlier detection
      let processed = detectOutliersMAD(replacedNegatives);
      if (processed.some((val, idx) => val === '' && replacedNegatives[idx] !== '')) {
        hasOutliers = true;
      }
      return processed;
    }

    // For vertical, we do row-based:
    if (isVertical) {
      rowRange.forEach(rowIdx => {
        const rowSlice = typedData[rowIdx].slice(2, 5); // col 2..4
        // if row is entirely empty => track it
        const isEmptyRow = rowSlice.every(cell => cell === '' || cell == null);
        if (isEmptyRow) hasEmptyRows = true;

        const sanitizedSlice = sanitizeRowOrColumn(rowSlice);
        // put it back
        for (let i = 0; i < 3; i++) {
          typedData[rowIdx][i+2] = sanitizedSlice[i];
        }
      });
    } else {
      // For horizontal, we do column-based (since each col is a temperature):
      // data rows => 4 and 5
      colRange.forEach(colIdx => {
        // We'll gather [ typedData[4][colIdx], typedData[5][colIdx] ]
        const cells = [typedData[4][colIdx], typedData[5][colIdx]];
        const isEmpty = cells.every(x => x === '' || x == null);
        if (isEmpty) hasEmptyRows = true;

        const sanitized = sanitizeRowOrColumn(cells);
        typedData[4][colIdx] = sanitized[0];
        typedData[5][colIdx] = sanitized[1];
      });
    }

    if (hasEmptyRows) {
      messages.push("Warning: Some rows/columns are completely empty. Please ensure data is provided.");
    }
    if (hasNegatives) {
      messages.push("Negative values were detected and converted to zero.");
    }
    if (hasOutliers) {
      messages.push("Outliers were detected and removed using the MAD method.");
    }

    // We won't replicate the "unexpected increase at higher temperature" check here,
    // but you can add it if needed. We'll just reuse the original approach if you want.

    setSanitizationMessages(messages);

    return typedData;
  };

  // The outlier detection helper
  function detectOutliersMAD(rowData: string[]) {
    const validNumbers = rowData
      .map(cell => parseFloat(cell))
      .filter(num => !isNaN(num));

    if (validNumbers.length === 0) return rowData;

    const meanVal = validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length;
    const sd = Math.sqrt(validNumbers.reduce((sq, n) => sq + Math.pow(n - meanVal, 2), 0) / (validNumbers.length - 1));
    const relativeSD = (sd / meanVal) * 100;

    // If rel SD < threshold, don't remove outliers
    const PRECISION_THRESHOLD = 20;
    if (relativeSD <= PRECISION_THRESHOLD) {
      return rowData;
    }

    // Otherwise use median + MAD
    const sortedNums = [...validNumbers].sort((a, b) => a - b);
    const median = sortedNums[Math.floor(sortedNums.length / 2)];
    const absDeviations = validNumbers.map(num => Math.abs(num - median));
    const sortedDev = [...absDeviations].sort((a, b) => a - b);
    const mad = sortedDev[Math.floor(sortedDev.length / 2)];

    // Mark outliers as ''
    return rowData.map(cell => {
      const value = parseFloat(cell);
      if (isNaN(value)) return cell;
      if (value < (median - 3 * mad) || value > (median + 3 * mad)) {
        return '';
      }
      return cell;
    });
  }

  // -----------------------------------------------------------
  //   Render
  // -----------------------------------------------------------
  // We'll define row labels for vertical vs horizontal
  const verticalRowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const horizontalRowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

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
          {/* File Upload Section */}
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
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
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
              {/* Horizontal Rule */}
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

              {/* Plot */}
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

              {/* Raw Data Table */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Raw Data</h3>
                
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

                {/* Table differs if vertical or horizontal */}
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
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">{rowLabel}</td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">{tempValues[index]}</td>
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

      {/* Template download links */}
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
