import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import NavBar from '@/components/NavBar';
import "../../../app/globals.css";
import s3 from '../../../../s3config';
import Papa from 'papaparse';

const DataPageCool = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [entryData1, setEntryData1] = useState<any>(null);
  const [entryData2, setEntryData2] = useState<any>(null);
  const [entryData3, setEntryData3] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gelImageUrl, setGelImageUrl] = useState<string | null>(null);
  const [kineticData, setKineticData] = useState<any[][]>([]);
  const [mentenImageUrl, setMentenImageUrl] = useState<string | null>(null);
  const [thermoData, setThermoData] = useState<any[][]>([]);
  const [thermoImageUrl, setThermoImageUrl] = useState<string | null>(null);
  const [entryData11, setEntryData11] = useState<any>(null);
  const [entryData12, setEntryData12] = useState<any>(null);
  const [wtKineticData, setWtKineticData] = useState<any[][]>([]);
  const [wtMentenImageUrl, setWtMentenImageUrl] = useState<string | null>(null);
  const [wtThermoData, setWtThermoData] = useState<any[][]>([]);
  const [wtThermoImageUrl, setWtThermoImageUrl] = useState<string | null>(null);

  // Fetch gel image when gel_filename changes
  useEffect(() => {
    const fetchGelImage = async () => {
      if (entryData1?.gel_filename) {
        try {
          const url = `https://d2dcurebucket.s3.amazonaws.com/gel-images/${entryData1.gel_filename}`;
          setGelImageUrl(url);
        } catch (err) {
          console.error('Error fetching gel image:', err);
        }
      }
    };

    fetchGelImage();
  }, [entryData1?.gel_filename]);

  // Fetch and process kinetic data when entryData2 changes
  useEffect(() => {
    const fetchKineticData = async () => {
      if (entryData2?.csv_filename) {
        try {
          // Fetch and parse CSV for table
          const params = {
            Bucket: 'd2dcurebucket',
            Key: `kinetic_assays/raw/${entryData2.csv_filename}`,
            Expires: 60,
          };

          const url = await s3.getSignedUrlPromise('getObject', params);
          const response = await fetch(url);
          const blob = await response.blob();
          const csvFile = new File([blob], entryData2.csv_filename, { type: 'text/csv' });

          Papa.parse(csvFile, {
            complete: (result) => {
              const parsedData = result.data as string[][];
              setKineticData(parsedData);
            },
            header: false,
            skipEmptyLines: true,
          });

          // Set plot image URLs directly from S3
          if (entryData2.plot_filename) {
            const mentenUrl = `https://d2dcurebucket.s3.amazonaws.com/kinetic_assays/plots/${entryData2.plot_filename}`;            
            setMentenImageUrl(mentenUrl);
          }
        } catch (err) {
          console.error('Error fetching kinetic data:', err);
        }
      }
    };

    fetchKineticData();
  }, [entryData2?.csv_filename, entryData2?.plot_filename]);

  useEffect(() => {
    const fetchThermoData = async () => {
      if (entryData3?.csv_filename) {
        try {
          // Fetch and parse CSV for table
          const params = {
            Bucket: 'd2dcurebucket',
            Key: `temperature_assays/raw/${entryData3.csv_filename}`,
            Expires: 60,
          };

          const url = await s3.getSignedUrlPromise('getObject', params);
          const response = await fetch(url);
          const blob = await response.blob();
          const csvFile = new File([blob], entryData3.csv_filename, { type: 'text/csv' });

          Papa.parse(csvFile, {
            complete: (result) => {
              const parsedData = result.data as string[][];
              setThermoData(parsedData);
            },
            header: false,
            skipEmptyLines: true,
          });

          // Set plot image URL directly from S3
          if (entryData3.plot_filename) {
            const plotUrl = `https://d2dcurebucket.s3.amazonaws.com/temperature_assays/plots/${entryData3.plot_filename}`;
            setThermoImageUrl(plotUrl);
          }
        } catch (err) {
          console.error('Error fetching thermostability data:', err);
        }
      }
    };

    fetchThermoData();
  }, [entryData3?.csv_filename, entryData3?.plot_filename]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch CharacterizationData
        const response1 = await fetch(`/api/getCharacterizationDataEntryFromID?id=${id}`);
        if (!response1.ok) {
          throw new Error('Failed to fetch characterization data');
        }
        const data1 = await response1.json();
        setEntryData1(data1);

        // Fetch WT KineticRawData if WT_raw_data_id exists
        if (data1.WT_raw_data_id) {
          const response11 = await fetch(`/api/getKineticData?id=${data1.WT_raw_data_id}`);
          if (response11.ok) {
            const data11 = await response11.json();
            setEntryData11(data11);
          }
        }

        // Fetch WT TempRawData if WT_temp_raw_data_id exists
        if (data1.WT_temp_raw_data_id) {
          const response12 = await fetch(`/api/getTempData?id=${data1.WT_temp_raw_data_id}`);
          if (response12.ok) {
            const data12 = await response12.json();
            setEntryData12(data12);
          }
        }

        // Fetch KineticRawData
        const response2 = await fetch(`/api/getKineticRawDataEntryData?parent_id=${id}`);
        if (response2.ok) {
          const data2 = await response2.json();
          setEntryData2(data2);
        }
        // Note: 404 is ok for kinetic data, as it might not exist

        // Fetch TempRawData
        const response3 = await fetch(`/api/getTempRawDataEntryData?parent_id=${id}`);
        if (response3.ok) {
          const data3 = await response3.json();
          setEntryData3(data3);
        }
        // Note: 404 is ok for temp data, as it might not exist

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  useEffect(() => {
    const fetchWtKineticData = async () => {
      console.log("Attempting to fetch WT Kinetic data with:", {
        csv_filename: entryData11?.csv_filename,
        plot_filename: entryData11?.plot_filename
      });

      if (entryData11?.csv_filename) {
        try {
          // Fetch and parse CSV for table
          const params = {
            Bucket: 'd2dcurebucket',
            Key: `kinetic_assays/raw/${entryData11.csv_filename}`,
            Expires: 60,
          };

          const url = await s3.getSignedUrlPromise('getObject', params);
          console.log("Generated S3 URL for WT Kinetic CSV:", url);

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status}`);
          }

          const blob = await response.blob();
          const csvFile = new File([blob], entryData11.csv_filename, { type: 'text/csv' });

          Papa.parse(csvFile, {
            complete: (result) => {
              console.log("Parsed WT Kinetic CSV data:", result.data);
              const parsedData = result.data as string[][];
              setWtKineticData(parsedData);
            },
            header: false,
            skipEmptyLines: true,
          });

          // Set plot image URL
          if (entryData11.plot_filename) {
            const mentenUrl = `https://d2dcurebucket.s3.amazonaws.com/kinetic_assays/plots/${entryData11.plot_filename}`;
            console.log("Setting WT Kinetic plot URL:", mentenUrl);
            setWtMentenImageUrl(mentenUrl);
          }
        } catch (err) {
          console.error('Error fetching WT kinetic data:', err);
        }
      }
    };

    fetchWtKineticData();
  }, [entryData11?.csv_filename, entryData11?.plot_filename]);

  useEffect(() => {
    const fetchWtThermoData = async () => {
      console.log("Attempting to fetch WT Thermo data with:", {
        csv_filename: entryData12?.csv_filename,
        plot_filename: entryData12?.plot_filename
      });

      if (entryData12?.csv_filename) {
        try {
          const params = {
            Bucket: 'd2dcurebucket',
            Key: `temperature_assays/raw/${entryData12.csv_filename}`,
            Expires: 60,
          };

          const url = await s3.getSignedUrlPromise('getObject', params);
          console.log("Generated S3 URL for WT Thermo CSV:", url);

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status}`);
          }

          const blob = await response.blob();
          const csvFile = new File([blob], entryData12.csv_filename, { type: 'text/csv' });

          Papa.parse(csvFile, {
            complete: (result) => {
              console.log("Parsed WT Thermo CSV data:", result.data);
              const parsedData = result.data as string[][];
              setWtThermoData(parsedData);
            },
            header: false,
            skipEmptyLines: true,
          });

          // Set plot image URL
          if (entryData12.plot_filename) {
            const plotUrl = `https://d2dcurebucket.s3.amazonaws.com/temperature_assays/plots/${entryData12.plot_filename}`;
            console.log("Setting WT Thermo plot URL:", plotUrl);
            setWtThermoImageUrl(plotUrl);
          }
        } catch (err) {
          console.error('Error fetching WT thermo data:', err);
        }
      }
    };

    fetchWtThermoData();
  }, [entryData12?.csv_filename, entryData12?.plot_filename]);

  const handleDownloadCSV = async (filename: string, directory: string) => {
    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `${directory}/${filename}`,
        Expires: 60,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;


  console.log("WT Kinetic Data:", {
    entryData11,
    wtKineticData,
    wtMentenImageUrl
  });
  
  console.log("WT Thermo Data:", {
    entryData12,
    wtThermoData,
    wtThermoImageUrl
  });
  return (
    <>
      <NavBar />
      <div className="px-3 md:px-4 lg:px-15 py-4 lg:py-10 mb-10 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <h1 className="text-3xl font-bold mb-16">
            Raw Data for BglB {entryData1?.resid === 'X' ? 'WT' : 
              `Variant ${entryData1?.resid}${entryData1?.resnum}${entryData1?.resmut}`}
          </h1>

          {/* Expression Data Section */}
          <div className="mb-48">
            <h2 className="text-2xl font-semibold mb-4">Expression Data</h2>
            
            {/* Gel Image */}
            {gelImageUrl && (
              <div className="mb-4">
                <img 
                  src={gelImageUrl} 
                  alt="Gel" 
                  className="max-w-md rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Yield Value */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <span className="font-medium">Yield:</span> {entryData1?.yield_avg || 'N/A'} mg/mL
              </p>
            </div>
          </div>

          {/* Kinetic Data Section */}
          {entryData2 && (
            <div className="mb-48">
              <h2 className="text-2xl font-semibold mb-4">Kinetic Data</h2>
              
              {/* For Kinetic Data */}
              {kineticData.length > 0 && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-gray-50 px-4 py-2 rounded-lg flex-grow">
                      <span className="font-medium">CSV file: </span>
                      <span className="text-gray-600">{entryData2?.csv_filename}</span>
                    </div>
                    <button
                      onClick={() => handleDownloadCSV(entryData2?.csv_filename, 'kinetic_assays/raw')}
                      className="px-4 py-2 text-sm font-medium text-[#06B7DB] border border-[#06B7DB] rounded-lg hover:bg-[#06B7DB] hover:text-white transition-colors"
                    >
                      Download CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Row
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            [S][mM]
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            2
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            3
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row, index) => {
                          const concentrations = [
                            '75.00', '25.00', '8.33', '2.78', 
                            '0.93', '0.31', '0.10', '0.03'
                          ];
                          
                          return (
                            <tr key={row}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {row}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {concentrations[index]}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {kineticData[index + 4]?.[2] || '—'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {kineticData[index + 4]?.[3] || '—'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {kineticData[index + 4]?.[4] || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Yield:</span>{' '}
                      {entryData2?.yield} {entryData2?.yield_units}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Dilution factor:</span>{' '}
                      {entryData2?.dilution}x
                    </p>
                    {entryData2?.plate_num && (
                      <p className="text-gray-700">
                        <span className="font-medium">Plate num:</span>{' '}
                        {entryData2.plate_num}
                      </p>
                    )}
                    <p className="text-gray-700">
                      <span className="font-medium">Protein purified on</span>{' '}
                      {entryData2?.purification_date} <span className="font-medium">and assayed on</span>{' '}
                      {entryData2?.assay_date}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Data uploaded by</span>{' '}
                      {entryData2?.user_name} <span className="font-medium">and last updated on</span>{' '}
                      {new Date(entryData2?.updated).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Graph */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mentenImageUrl && (
                      <div>
                        <img 
                          src={mentenImageUrl} 
                          alt="Michaelis-Menten Plot" 
                          className="rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* WT Reference Data */}
              {entryData11 && (
                <div className="mt-12">
                  <h3 className="text-xl font-semibold mb-4">Reference Data for WT</h3>
                  
                  {wtKineticData.length > 0 && (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-gray-50 px-4 py-2 rounded-lg flex-grow">
                          <span className="font-medium">CSV file: </span>
                          <span className="text-gray-600">{entryData11?.csv_filename}</span>
                        </div>
                        <button
                          onClick={() => handleDownloadCSV(entryData11?.csv_filename, 'kinetic_assays/raw')}
                          className="px-4 py-2 text-sm font-medium text-[#06B7DB] border border-[#06B7DB] rounded-lg hover:bg-[#06B7DB] hover:text-white transition-colors"
                        >
                          Download CSV
                        </button>
                      </div>

                      <div className="overflow-x-auto mb-6">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Row
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                [S][mM]
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                1
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                2
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                3
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row, index) => {
                              const concentrations = [
                                '75.00', '25.00', '8.33', '2.78', 
                                '0.93', '0.31', '0.10', '0.03'
                              ];
                              
                              return (
                                <tr key={row}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {row}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {concentrations[index]}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wtKineticData[index + 4]?.[2] || '—'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wtKineticData[index + 4]?.[3] || '—'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wtKineticData[index + 4]?.[4] || '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-2">
                        <p className="text-gray-700">
                          <span className="font-medium">Yield:</span>{' '}
                          {entryData11?.yield} {entryData11?.yield_units}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Dilution factor:</span>{' '}
                          {entryData11?.dilution}x
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Protein purified on</span>{' '}
                          {entryData11?.purification_date} <span className="font-medium">and assayed on</span>{' '}
                          {entryData11?.assay_date}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Data uploaded by</span>{' '}
                          {entryData11?.user_name} <span className="font-medium">and last updated on</span>{' '}
                          {new Date(entryData11?.updated).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Graph */}
                      {wtMentenImageUrl && (
                        <div>
                          <img 
                            src={wtMentenImageUrl} 
                            alt="WT Michaelis-Menten Plot" 
                            className="rounded-lg shadow-md w-full"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Thermostability Data Section */}
          {entryData3 && (
            <div className="mb-48">
              <h2 className="text-2xl font-semibold mb-4">Thermostability Assay Data</h2>
              
              {/* For Thermostability Data */}
              {thermoData.length > 0 && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-gray-50 px-4 py-2 rounded-lg flex-grow">
                      <span className="font-medium">CSV file: </span>
                      <span className="text-gray-600">{entryData3?.csv_filename}</span>
                    </div>
                    <button
                      onClick={() => handleDownloadCSV(entryData3?.csv_filename, 'temperature_assays/raw')}
                      className="px-4 py-2 text-sm font-medium text-[#06B7DB] border border-[#06B7DB] rounded-lg hover:bg-[#06B7DB] hover:text-white transition-colors"
                    >
                      Download CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Row
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Temp (°C)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            2
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            3
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row, index) => {
                          const temperatures = [
                            '50.0', '48.3', '45.7', '42.4', 
                            '37.7', '33.6', '31.3', '30.0'
                          ];
                          
                          return (
                            <tr key={row}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {row}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {temperatures[index]}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {thermoData[index + 4]?.[2] || '—'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {thermoData[index + 4]?.[3] || '—'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {thermoData[index + 4]?.[4] || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Protein purified on</span>{' '}
                      {entryData3?.purification_date} <span className="font-medium">and assayed on</span>{' '}
                      {entryData3?.assay_date}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Data uploaded by</span>{' '}
                      {entryData3?.user_name} <span className="font-medium">and last updated on</span>{' '}
                      {new Date(entryData3?.updated).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Thermostability Plot */}
                  {thermoImageUrl && (
                    <div>
                      <img 
                        src={thermoImageUrl} 
                        alt="Temperature Response Plot" 
                        className="rounded-lg shadow-md w-full max-w-2xl"
                      />
                  </div>
              )}
                </>
              )}

              {/* WT Reference Data */}
              {entryData12 && (
                <div className="mt-12">
                  <h3 className="text-xl font-semibold mb-4">Reference Data for WT</h3>
                  
                  {wtThermoData.length > 0 && (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-gray-50 px-4 py-2 rounded-lg flex-grow">
                          <span className="font-medium">CSV file: </span>
                          <span className="text-gray-600">{entryData12?.csv_filename}</span>
                        </div>
                        <button
                          onClick={() => handleDownloadCSV(entryData12?.csv_filename, 'temperature_assays/raw')}
                          className="px-4 py-2 text-sm font-medium text-[#06B7DB] border border-[#06B7DB] rounded-lg hover:bg-[#06B7DB] hover:text-white transition-colors"
                        >
                          Download CSV
                        </button>
                      </div>

                      <div className="overflow-x-auto mb-6">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Row
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Temp (°C)
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                1
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                2
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                3
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row, index) => {
                              const temperatures = [
                                '50.0', '48.3', '45.7', '42.4', 
                                '37.7', '33.6', '31.3', '30.0'
                              ];
                              
                              return (
                                <tr key={row}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {row}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {temperatures[index]}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wtThermoData[index + 4]?.[2] || '—'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wtThermoData[index + 4]?.[3] || '—'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wtThermoData[index + 4]?.[4] || '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-2">
                        <p className="text-gray-700">
                          <span className="font-medium">Protein purified on</span>{' '}
                          {entryData12?.purification_date} <span className="font-medium">and assayed on</span>{' '}
                          {entryData12?.assay_date}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Data uploaded by</span>{' '}
                          {entryData12?.user_name} <span className="font-medium">and last updated on</span>{' '}
                          {new Date(entryData12?.updated).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Graph */}
                      {wtThermoImageUrl && (
                        <div>
                          <img 
                            src={wtThermoImageUrl} 
                            alt="WT Temperature Response Plot" 
                            className="rounded-lg shadow-md w-full max-w-2xl"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Design Data Section */}
          {(entryData1?.Rosetta_score || entryData1?.ab1_filename) && (
            <div className="mb-48">
              <h2 className="text-2xl font-semibold mb-4">Design Data</h2>
              
              {/* Rosetta Score */}
              {entryData1?.Rosetta_score !== null && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-gray-700">
                    <span className="font-medium">
                      Rosetta score for {entryData1?.resid}{entryData1?.resnum}{entryData1?.resmut}:
                    </span>{' '}
                    {entryData1?.Rosetta_score}
                  </p>
                </div>
              )}

              {/* Ab1 File */}
              {entryData1?.ab1_filename && (
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 px-4 py-2 rounded-lg flex-grow">
                    <span className="font-medium">Ab1 file: </span>
                    <span className="text-gray-600">{entryData1?.ab1_filename}</span>
                  </div>
                  <button
                    onClick={() => handleDownloadCSV(entryData1?.ab1_filename, 'sequencing')}
                    className="px-4 py-2 text-sm font-medium text-[#06B7DB] border border-[#06B7DB] rounded-lg hover:bg-[#06B7DB] hover:text-white transition-colors"
                  >
                    Download
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Citations Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Citations</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                {entryData1?.reference1 
                  ? "This data set contains a reference/publication, but the code to display this hasn't been done yet. TODO"
                  : "The unpublished data above were collected by students."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DataPageCool;