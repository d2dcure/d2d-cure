// KineticAssayDataView.tsx

import React, { useState } from 'react';
import Papa from 'papaparse';
import axios from 'axios';

interface KineticAssayDataViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
}

const KineticAssayDataView: React.FC<KineticAssayDataViewProps> = ({
  entryData,
  setCurrentView,
}) => {
  const [kineticAssayData, setKineticAssayData] = useState<any[][]>([]);
  const [mentenImageUrl, setMentenImageUrl] = useState<string | null>(null);
  const [lineweaverImageUrl, setLineweaverImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    if (!selectedFile) return;

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      complete: (result) => {
        console.log('Parsed Result:', result);
        setKineticAssayData(result.data as any[][]);
      },
      header: false, // Disable header row parsing for direct cell access
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
      const response = await axios.post('http://127.0.0.1:5002/plotit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseData = response.data;
      setMentenImageUrl(`data:image/png;base64,${responseData.menten_plot}`);
      setLineweaverImageUrl(`data:image/png;base64,${responseData.lineweaver_plot}`);

      // Handle additional data if needed
      // For example, you can store kcat, KM, etc.
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
      const response = await axios.post('http://127.0.0.1:5002/plotit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseData = response.data;
      setMentenImageUrl(`data:image/png;base64,${responseData.menten_plot}`);
      setLineweaverImageUrl(`data:image/png;base64,${responseData.lineweaver_plot}`);

      // Handle additional data if needed
    } catch (error) {
      console.error('Error generating graph from table data:', error);
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
                      {['75.00', '25.00', '8.33', '2.78', '0.93', '0.31', '0.10', '0.00'][index]}
                    </td>
                    {[2, 3, 4].map((col, colIndex) => (
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
        </>
      )}
    </div>
  );
};

export default KineticAssayDataView;
