import React, { useState } from 'react';
import Papa from 'papaparse';
import axios from 'axios';

interface ThermoAssayDataViewProps {
  setCurrentView: (view: string) => void;
  entryData: any; 
}

const ThermoAssayDataView: React.FC<ThermoAssayDataViewProps> = ({ setCurrentView, entryData  }) => {
  const [thermoData, setThermoData] = useState<string[][]>([]);
  const [graphImageUrl, setGraphImageUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    Papa.parse(file, {
      complete: (result) => {
        const parsedData = result.data as string[][];

        // Extract the relevant cells for the table
        const data = parsedData.slice(4, 12).map((row) => row.slice(2, 5));
        setThermoData(data);
        console.log('Parsed Data:', data);

        // Call generateGraphFromFile without await
        generateGraphFromFile(file).catch(error => {
          console.error('Error generating graph:', error);
        });
      },
      header: false,
    });
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
        responseType: 'blob',
      });

      if (response.status !== 200) {
        console.error("Failed to generate graph:", response.statusText);
        return;
      }

      const imageBlob = new Blob([response.data], { type: 'image/png' });
      const imageUrl = URL.createObjectURL(imageBlob);
      setGraphImageUrl(imageUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const temperatures = [50.0, 48.3, 45.7, 42.4, 37.7, 33.6, 31.3, 30.0];

  return (
    <div className="space-y-4">
      <button className="text-blue-500 hover:text-blue-700" onClick={() => setCurrentView('checklist')}>
        &lt; Back to Checklist
      </button>
      <h2 className="text-2xl font-bold">Thermostability Assay Data Upload</h2>

      <input type="file" accept=".csv" onChange={handleFileChange} />

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
                {thermoData.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 px-4 py-2">{rows[index]}</td>
                    <td className="border border-gray-400 px-4 py-2">{temperatures[index]}</td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-gray-400 px-4 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => generateGraphFromFile(new File([Papa.unparse(thermoData)], 'edited_data.csv'))}
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
        </>
      )}
    </div>
  );
};

export default ThermoAssayDataView;