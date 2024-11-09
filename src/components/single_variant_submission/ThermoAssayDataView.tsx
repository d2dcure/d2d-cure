import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../s3config'; 

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
        Expires: 60, // URL expires in 60 seconds
      };

      const url = await s3.getSignedUrlPromise('getObject', params);

      const response = await fetch(url);
      const blob = await response.blob();
      const csvFile = new File([blob], filename, { type: 'text/csv' });

      Papa.parse(csvFile, {
        complete: (result) => {
          console.log("Parsed CSV data:", result.data); // Log the parsed CSV data
          setOriginalData(result.data as string[][]);

          const extractedTemperatures = result.data.slice(4, 12).map((row: any) => parseFloat(row[0]));
          setTempValues(extractedTemperatures);

          const editableData = result.data.slice(4, 12).map((row:any) => row.slice(2, 5));
          setThermoData(editableData);
        },
        header: false,
      });

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    Papa.parse(file, {
      complete: (result) => {
        console.log("Parsed CSV data:", result.data); 
        const parsedData = result.data as string[][];

        const extractedTemperatures = result.data.slice(4, 12).map((row: any) => parseFloat(row[0]));
        setTempValues(extractedTemperatures);

        // Save the full original structure and also set the editable thermoData for rendering
        setOriginalData(parsedData);
        const editableData = parsedData.slice(4, 12).map((row) => row.slice(2, 5));
        setThermoData(editableData);

        // Generate initial graph based on uploaded file
        generateGraphFromFile(file).catch(error => {
          console.error('Error generating graph:', error);
        });
      },
      header: false,
    });
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
      const response = await axios.post('http://127.0.0.1:5003/plot_temperature', formData, {
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
    try {
      const variant = entryData.resid + entryData.resnum + entryData.resmut;
  
      // Get values from CSV file data and entryData
      const slopeUnits = originalData[1][4]; // E2 cell 
      const purificationDate = originalData[2][6]; // G3 cell
      const assayDate = originalData[2][7]; // H3 cell
  
      // Generate filenames for CSV and plot
      const csvFilename = `${user.user_name}-BglB-${variant}-${entryData.id}-temp_assay.csv`;
      const plotFilename = `${user.user_name}-BglB-${variant}-${entryData.id}-temp_assay.png`;
  
      // Upload CSV file to S3
      const csvFileToUpload = new File([new Blob([Papa.unparse(originalData)])], csvFilename, { type: 'text/csv' });
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
  
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
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

  return (
    <div className="space-y-4">
      <button className="text-blue-500 hover:text-blue-700" onClick={() => setCurrentView('checklist')}>
        &lt; Back to Checklist
      </button>
      <h2 className="text-2xl font-bold">Thermostability Assay Data Upload</h2>

      <input type="file" accept=".csv" onChange={handleFileChange} />

      <p>
        Saved CSV: {csvFilename || 'N/A'}{' '}
        {csvFilename && (
          <button
            onClick={downloadCsvFile}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Download
          </button>
        )}
      </p>

      {thermoData.length > 0 && (
        <>
          <div className="overflow-auto">
            <table className="table-auto border-collapse border border-gray-400 w-full mt-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-400 px-4 py-2">Row</th>
                  <th className="border border-gray-400 px-4 py-2">Temp (°C)</th>
                  <th className="border border-gray-400 px-4 py-2">1</th>
                  <th className="border border-gray-400 px-4 py-2">2</th>
                  <th className="border border-gray-400 px-4 py-2">3</th>
                </tr>
              </thead>
              <tbody>
                {thermoData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="border border-gray-400 px-4 py-2">{rows[rowIndex]}</td>
                    <td className="border border-gray-400 px-4 py-2">{tempValues[rowIndex]}</td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-gray-400 px-4 py-2">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rowIndex, cellIndex, e.target.value)}
                          className="w-full text-center"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Protein purified on {thermoRawDataEntryData?.purification_date || 'N/A'} and assayed on {thermoRawDataEntryData?.assay_date || 'N/A'}.
            </p>
            <p>
              Data uploaded by {thermoRawDataEntryData?.user_name || 'N/A'} and last updated on {thermoRawDataEntryData?.updated || 'N/A'}.
            </p>
          </div>

          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={generateGraphFromEditedData}
          >
            Regenerate Graph
          </button>

          {graphImageUrl && (
            <img
              id="graphImage"
              src={graphImageUrl}
              alt="Generated Thermo Assay Graph"
              className="mt-4"
            />
          )}
          <button
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={handleSaveData}
          >
            Save
          </button>
        </>
      )}
    </div>
  );
};

export default ThermoAssayDataView;
