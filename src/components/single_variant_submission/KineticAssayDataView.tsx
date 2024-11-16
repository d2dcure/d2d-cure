import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { useUser } from '@/components/UserProvider';
import { useRouter } from 'next/router';
import s3 from '../../../s3config'; 

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    if (!selectedFile) return;

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      complete: (result) => {
        console.log('Parsed Result:', result);
        setKineticAssayData(result.data as any[][]);
      },
      header: false,
    });

    if (entryData.resid && entryData.resnum && entryData.resmut) {
      try {
        await generateGraphFromFile(selectedFile);
      } catch (error) {
        console.error('Error generating graph:', error);
      }
    }
  };

  const generateGraphFromFile = async (selectedFile: File) => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append(
      'variant-name',
      `${entryData.resid}${entryData.resnum}${entryData.resmut}`
    );

    try {
      const response = await axios.post('https://d2dcure-ed1280e9442d.herokuapp.com/plotit', formData, {
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
      const response = await axios.post('https://d2dcure-ed1280e9442d.herokuapp.com/plotit', formData, {
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
    };

    try {
      // Generate filenames
      const csvFilename = generateFilename('', '', 'csv');
      const mentenPlotFilename = generateFilename('', '', 'png');
      const lineweaverPlotFilename = generateFilename('', '-LB', 'png');

      // Upload CSV file to S3
      let csvFileToUpload;
      if (file) {
        // If the user uploaded a file, use it
        csvFileToUpload = new File([file], csvFilename, { type: 'text/csv' });
      } else {
        // If the user edited the table, create a new CSV file from the table data
        const csvContent = Papa.unparse(kineticAssayData);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        csvFileToUpload = new File([blob], csvFilename, { type: 'text/csv' });
      }

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
    <div className="space-y-4">
      <button
        className="text-blue-500 hover:text-blue-700"
        onClick={() => setCurrentView('checklist')}
      >
        &lt; Back to Checklist
      </button>
      <h2 className="text-2xl font-bold">Kinetic Assay Data Upload</h2>

      <input type="file" accept=".csv" onChange={handleFileChange} />

      <p>
        Saved CSV: {file?.name || 'N/A'}{' '}
        {file && (
          <button
            onClick={downloadCsvFile}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Download
          </button>
        )}
      </p>

      {kineticAssayData.length > 0 && (
        <>
          <div className="overflow-auto">
            <table className="table-auto border-collapse border border-gray-400 w-full mt-4">
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
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((rowLabel, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 px-4 py-2">{rowLabel}</td>
                    <td className="border border-gray-400 px-4 py-2">
                      {['75.00', '25.00', '8.33', '2.78', '0.93', '0.31', '0.10', '0.03'][index]}
                    </td>
                    {[2, 3, 4].map((col) => (
                      <td key={col} className="border border-gray-400 px-4 py-2">
                        <input
                          type="text"
                          value={
                            kineticAssayData[index + 4]?.[col] !== undefined
                              ? kineticAssayData[index + 4][col]
                              : ''
                          }
                          onChange={(e) => handleInputChange(e, index + 4, col)}
                          className="w-full"
                        />
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

          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={generateGraphFromTable}
          >
            Regenerate Graph
          </button>

          {mentenImageUrl && (
            <img
              src={mentenImageUrl}
              alt="Michaelis-Menten Plot"
              className="mt-4"
            />
          )}

          {lineweaverImageUrl && (
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-500 hover:text-blue-700">
                Show/hide Lineweaver–Burk Plot
              </summary>
              <img
                src={lineweaverImageUrl}
                alt="Lineweaver–Burk Plot"
                className="mt-2"
              />
            </details>
          )}

          <button
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={handleSave}
          >
            Save
          </button>
        </>
      )}
    </div>
  );
};

export default KineticAssayDataView;