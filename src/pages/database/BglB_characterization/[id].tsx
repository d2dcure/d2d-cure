import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import NavBar from '@/components/NavBar';
import "../../../app/globals.css";
import s3 from '../../../../s3config';
import Papa from 'papaparse';
import { Card, CardBody } from '@nextui-org/card';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Skeleton, Breadcrumbs, BreadcrumbItem } from '@nextui-org/react';
import Link from 'next/link';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@nextui-org/react';
import { Button } from '@nextui-org/react';
import { Download, Share, Printer, BugIcon } from 'lucide-react';
import Toast from '@/components/Toast';
import { ErrorChecker } from '@/components/ErrorChecker';
import { useUser } from '@/components/UserProvider';

const DataPageView = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' as const
  });
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'api' | 'validation' | 'general' | 'auth' | 'custom'>('api');

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

  const handleAB1Download = async (filename: string) => {
    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: `sequencing/${filename}`,
        Expires: 60,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading AB1:', error);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setToastInfo({
      show: true,
      title: 'Link Copied',
      message: 'URL has been copied to clipboard',
      type: 'success'
    });
  };

  const renderSidebar = () => {
    return (
      <div className="w-full lg:w-1/5">
        <div className="lg:sticky lg:top-4">
          <div className="flex flex-col pt-5 gap-6">
            <div className="space-y-3 bg-gray-50 rounded-lg p-3">
              <div>
                <span className="font-medium text-sm">Variant Details</span>
                <p className="text-gray-500 text-sm">
                  {entryData1?.resid === 'X' ? 'WT' : 
                    `${entryData1?.resid}${entryData1?.resnum}${entryData1?.resmut}`}
                </p>
              </div>

              <div>
                <span className="font-medium text-sm">Yield</span>
                <p className="text-gray-500 text-sm">{entryData1?.yield_avg || 'N/A'} mg/mL</p>
              </div>

              <div>
                <span className="font-medium text-sm">Created By</span>
                <p className="text-gray-500 text-sm">{entryData1?.creator}</p>
              </div>
            </div>

            {/* Expression Data Card */}
            {/* {gelImageUrl && (
              <div className="space-y-3 bg-gray-50 rounded-lg p-3">
                <span className="font-medium text-sm">Expression Data</span>
                <button 
                  onClick={() => setIsImageModalOpen(true)}
                  className="w-full aspect-square bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  <img 
                    src={gelImageUrl || ''} 
                    alt="Gel" 
                    className="w-full h-full object-cover"
                  />
                </button>
                <div className="space-y-2">
                  <p className="text-gray-500 text-sm truncate">
                    {entryData1?.gel_filename || 'gel-image.png'}
                  </p>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-sm">
                      <span className="font-medium">Yield:</span> {entryData1?.yield_avg || 'N/A'} mg/mL
                    </p>
                  </div>
                </div>
              </div>
            )} */}

            {/* Downloads Card */}
            <div className="space-y-3 bg-gray-50 rounded-lg p-3">
              <span className="font-medium text-sm">Downloads</span>
              <div className="space-y-2">
                {entryData2?.csv_filename && (
                  <button
                    onClick={() => handleDownloadCSV(entryData2.csv_filename, 'kinetic_assays/raw')}
                    className="text-sm text-[#06B7DB] hover:text-[#05a5c6] flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Kinetic Data CSV</span>
                  </button>
                )}
                {entryData3?.csv_filename && (
                  <button
                    onClick={() => handleDownloadCSV(entryData3.csv_filename, 'temperature_assays/raw')}
                    className="text-sm text-[#06B7DB] hover:text-[#05a5c6] flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Thermostability Data CSV</span>
                  </button>
                )}
                {entryData1?.ab1_filename && (
                  <button
                    onClick={() => handleDownloadCSV(entryData1.ab1_filename, 'sequencing')}
                    className="text-sm text-[#06B7DB] hover:text-[#05a5c6] flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Sequencing Data (AB1)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="space-y-3 bg-gray-50 rounded-lg p-3">
              <span className="font-medium text-sm">Quick Actions</span>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#06B7DB] transition-colors"
                >
                  <Share className="w-4 h-4" />
                  <span>Share</span>
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#06B7DB] transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>

                <Link 
                  href={`/contact/report?page=${encodeURIComponent(`/database/BglB_characterization/${id}`)}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#06B7DB] transition-colors"
                >
                  <BugIcon className="w-4 h-4" />
                  <span>Report a bug</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    return (
      <div className="flex-1 space-y-6">
        {/* Expression Data Section */}
        <Card className="border-none bg-white shadow-small rounded-xl">
          <div className="p-6">
            <h2 className="text-xl  mb-4">Expression Data</h2>
            <div className="flex flex-col space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-700">
                  <span className="font-medium">Yield (mg/mL):</span> {entryData1?.yield_avg || 'N/A'}
                </p>
              </div>
              
              {gelImageUrl && (
                <div className="space-y-3">
                  <div className="relative group">
                    <button 
                      onClick={() => setIsImageModalOpen(true)}
                      className="flex items-center w-full max-w-sm bg-white border rounded-lg p-2 hover:border-[#06B7DB] transition-colors"
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded overflow-hidden mr-3">
                        <img 
                          src={gelImageUrl} 
                          alt="Gel electrophoresis" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {entryData1?.gel_filename || 'gel-image.png'}
                        </p>
                        <p className="text-xs text-gray-500">Click to view full size</p>
                      </div>
                      <svg 
                        className="w-5 h-5 text-gray-400 group-hover:text-[#06B7DB] transition-colors duration-200 ml-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

       

        {/* Kinetic Data Section */}
        {entryData2 && (
          <Card className="border-none bg-white shadow-small rounded-xl">
            <div className="p-6">
              <h2 className="text-xl  mb-4">Kinetic Data</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-medium text-gray-900 mb-4">Experiment Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div>
                              <span className="text-sm text-gray-500">Yield</span>
                              <p className="text-sm font-medium text-gray-900">
                                {entryData2?.yield} {entryData2?.yield_units?.replace(/_/g, '/')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            <div>
                              <span className="text-sm text-gray-500">Dilution</span>
                              <p className="text-sm font-medium text-gray-900">{entryData2?.dilution}x</p>
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
                                Purified: {new Date(entryData2?.purification_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                Assayed: {new Date(entryData2?.assay_date).toLocaleDateString()}
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
                            {entryData2?.user_name} on {new Date(entryData2?.updated).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-medium text-gray-900 mb-4">File Information</h3>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <button
                          onClick={() => handleDownloadCSV(entryData2?.csv_filename, 'kinetic_assays/raw')}
                          className="text-[#06B7DB] hover:text-[#05a5c6] text-sm"
                        >
                          {entryData2?.csv_filename}
                        </button>
                      </div>
                    </div>
                  </div>

                  {mentenImageUrl && (
                    <div className="p-4 bg-gray-50 rounded-xl h-full">
                      <img 
                        src={mentenImageUrl} 
                        alt="Michaelis-Menten Plot" 
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}
                </div>

                {kineticData.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table 
                      aria-label="Kinetic assay data table"
                      classNames={{
                        wrapper: "min-h-[400px]",
                        table: "min-w-full",
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
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row, index) => {
                          const sValues = ['75.00', '25.00', '8.33', '2.78', '0.93', '0.31', '0.10', '0.03'];
                          return (
                            <TableRow key={row}>
                              <TableCell>{row}</TableCell>
                              <TableCell>{sValues[index]}</TableCell>
                              <TableCell>{kineticData[index + 4]?.[2] || '—'}</TableCell>
                              <TableCell>{kineticData[index + 4]?.[3] || '—'}</TableCell>
                              <TableCell>{kineticData[index + 4]?.[4] || '—'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Thermostability Data Section */}
        {entryData3 && (
          <Card className="border-none bg-white shadow-small rounded-xl">
            <div className="p-6">
              <h2 className="text-xl  mb-4">Thermostability Data</h2>
              <div className="space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-medium text-gray-900 mb-4">Experiment Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <span className="text-sm text-gray-500">Dates</span>
                              <p className="text-sm font-medium text-gray-900">
                                Purified: {new Date(entryData3?.purification_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                Assayed: {new Date(entryData3?.assay_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <span className="text-sm text-gray-500">Last Update</span>
                            <p className="text-sm font-medium text-gray-900">
                              {entryData3?.user_name} on {new Date(entryData3?.updated).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-medium text-gray-900 mb-4">File Information</h3>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <button
                          onClick={() => handleDownloadCSV(entryData3?.csv_filename, 'temperature_assays/raw')}
                          className="text-[#06B7DB] hover:text-[#05a5c6] text-sm"
                        >
                          {entryData3?.csv_filename}
                        </button>
                      </div>
                    </div>
                  </div>

                  {thermoImageUrl && (
                    <div className="p-4 bg-gray-50 rounded-xl h-full">
                      <img 
                        src={thermoImageUrl} 
                        alt="Temperature Response Plot" 
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}
                </div>

                {thermoData.length > 0 && (
                  <div className="overflow-x-auto">
                    {renderThermoTable(thermoData)}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* WT Kinetic Data Section */}
        {entryData11 && (
          <Card className="p-6 border-none bg-white shadow-small rounded-xl">
            <h2 className="text-xl  mb-4">Wild Type Kinetic Data</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">Experiment Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div>
                            <span className="text-sm text-gray-500">Yield</span>
                            <p className="text-sm font-medium text-gray-900">
                              {entryData11?.yield} {entryData11?.yield_units?.replace(/_/g, '/')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <div>
                            <span className="text-sm text-gray-500">Dilution</span>
                            <p className="text-sm font-medium text-gray-900">{entryData11?.dilution}x</p>
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
                              Purified: {new Date(entryData11?.purification_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              Assayed: {new Date(entryData11?.assay_date).toLocaleDateString()}
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
                          {entryData11?.user_name} on {new Date(entryData11?.updated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">File Information</h3>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <button
                        onClick={() => handleDownloadCSV(entryData11?.csv_filename, 'kinetic_assays/raw')}
                        className="text-[#06B7DB] hover:text-[#05a5c6] text-sm"
                      >
                        {entryData11?.csv_filename}
                      </button>
                    </div>
                  </div>
                </div>

                {wtMentenImageUrl && (
                  <div className="p-4 bg-gray-50 rounded-xl h-full">
                    <img 
                      src={wtMentenImageUrl} 
                      alt="WT Michaelis-Menten Plot" 
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
              </div>

              {wtKineticData.length > 0 && (
                <div className="overflow-x-auto">
                  <Table 
                    aria-label="WT Kinetic assay data table"
                    classNames={{
                      wrapper: "min-h-[400px]",
                      table: "min-w-full",
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
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row, index) => {
                        const sValues = ['75.00', '25.00', '8.33', '2.78', '0.93', '0.31', '0.10', '0.03'];
                        return (
                          <TableRow key={row}>
                            <TableCell>{row}</TableCell>
                            <TableCell>{sValues[index]}</TableCell>
                            <TableCell>{wtKineticData[index + 4]?.[2] || '—'}</TableCell>
                            <TableCell>{wtKineticData[index + 4]?.[3] || '—'}</TableCell>
                            <TableCell>{wtKineticData[index + 4]?.[4] || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* WT Thermostability Data Section */}
        {entryData12 && (
          <Card className="p-6 border-none bg-white shadow-small rounded-xl">
            <h2 className="text-xl  mb-4">Wild Type Thermostability Data</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">Experiment Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <span className="text-sm text-gray-500">Dates</span>
                            <p className="text-sm font-medium text-gray-900">
                              Purified: {new Date(entryData12?.purification_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              Assayed: {new Date(entryData12?.assay_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div>
                          <span className="text-sm text-gray-500">Last Update</span>
                          <p className="text-sm font-medium text-gray-900">
                            {entryData12?.user_name} on {new Date(entryData12?.updated).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">File Information</h3>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <button
                        onClick={() => handleDownloadCSV(entryData12?.csv_filename, 'temperature_assays/raw')}
                        className="text-[#06B7DB] hover:text-[#05a5c6] text-sm"
                      >
                        {entryData12?.csv_filename}
                      </button>
                    </div>
                  </div>
                </div>

                {wtThermoImageUrl && (
                  <div className="p-4 bg-gray-50 rounded-xl h-full">
                    <img 
                      src={wtThermoImageUrl} 
                      alt="WT Temperature Response Plot" 
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
              </div>

              {wtThermoData.length > 0 && (
                <div className="overflow-x-auto">
                  {renderThermoTable(wtThermoData)}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Design Data Section */}
        {(entryData1?.Rosetta_score || entryData1?.ab1_filename) && (
          <Card className="p-6 border-none bg-white shadow-small rounded-xl">
            <h2 className="text-xl  mb-4">Design Data</h2>
            <div className="space-y-4">
              {entryData1?.Rosetta_score !== null && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <span className="font-medium">
                      Rosetta score for {entryData1?.resid}{entryData1?.resnum}{entryData1?.resmut}:
                    </span>{' '}
                    {entryData1?.Rosetta_score}
                  </p>
                </div>
              )}


{entryData1?.ab1_filename && (
  <div className="flex items-center gap-2">
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <button
      onClick={() => handleAB1Download(entryData1.ab1_filename)}
      className="text-[#06B7DB] hover:text-[#05a5c6] text-sm"
    >
      {entryData1.ab1_filename}
    </button>
  </div>
              )}
            </div>
          </Card>
        )}

        {/* Citations Section */}
        <Card className="p-6 border-none bg-white shadow-small rounded-xl">
          <h2 className="text-xl  mb-4">Citations</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">
              {entryData1?.reference1 
                ? "This data set contains a reference/publication, but the code to display this hasn't been done yet. TODO"
                : "The unpublished data above were collected by students."}
            </p>
          </div>
        </Card>
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[150px] rounded-xl" />
        </div>
        
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[250px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      </div>
    </div>
  );

  const getVariantDisplay = (data: any) => {
    if (!data || !data.resid) return 'Loading...';
    const variant = data.resid === 'X' ? 'WT' : `${data.resid}${data.resnum}${data.resmut}`;
    return `${variant} BglB`;
  };

  const getBreadcrumbDisplay = (data: any) => {
    if (!data || !data.resid) return 'Loading...';
    const variant = getVariantDisplay(data);
    return `${variant}`;
  };

  const ImageModal = ({ isOpen, onClose, imageUrl, title }: {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    title: string;
  }) => (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
    >
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-auto object-contain max-h-[80vh]"
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  // Function to determine if the CSV is horizontal
  const isHorizontalTemplate = (data: any[][]) => {
    return !data[2]?.[1]; // Check if B3 is empty
  };

  const renderThermoTable = (data: any[][]) => {
    if (isHorizontalTemplate(data)) {
      // Horizontal template logic
      return (
        <Table 
          aria-label="Horizontal Temperature assay data table"
          classNames={{
            wrapper: "min-h-[400px]",
            table: "min-w-full",
          }}
        >
          <TableHeader>
            <TableColumn>Row</TableColumn>
            <TableColumn>Temp (°C)</TableColumn>
            <TableColumn>1</TableColumn>
            <TableColumn>2</TableColumn>
          </TableHeader>
          <TableBody>
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map((row, index) => {
              const temperature = data[1]?.[index + 3] || '—'; // D2, E2, ..., O2
              return (
                <TableRow key={row}>
                  <TableCell>{row}</TableCell>
                  <TableCell>{temperature}</TableCell>
                  <TableCell>{data[4]?.[index + 3] || '—'}</TableCell>
                  <TableCell>{data[5]?.[index + 3] || '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    } else {
      // Vertical template logic (existing)
      return (
        <Table 
          aria-label="Vertical Temperature assay data table"
          classNames={{
            wrapper: "min-h-[400px]",
            table: "min-w-full",
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
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row, index) => {
              const temperature = data[index + 4]?.[0] || '—'; // A5, A6, ..., A12
              return (
                <TableRow key={row}>
                  <TableCell>{row}</TableCell>
                  <TableCell>{temperature}</TableCell>
                  <TableCell>{data[index + 4]?.[2] || '—'}</TableCell>
                  <TableCell>{data[index + 4]?.[3] || '—'}</TableCell>
                  <TableCell>{data[index + 4]?.[4] || '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    }
  };

  // Determine if the user can edit
  const canEdit = useMemo(() => {
    if (!user || !entryData1) return false;
    return user.status === 'ADMIN' || 
           user.user_name === entryData1.creator || 
           user.user_name === entryData1.teammate || 
           user.user_name === entryData1.teammate2 || 
           user.user_name === entryData1.teammate3;
  }, [user, entryData1]);

  // Handle edit button click
  const handleEditClick = () => {
    if (!entryData1) return;
    const path = entryData1.resid === 'X' 
      ? `/submit/wild_type/${entryData1.id}` 
      : `/submit/single_variant/${entryData1.id}`;
    router.push(path);
  };

  if (isLoading) return (
    <>
      <NavBar />
      <div className="px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {renderLoadingState()}
        </div>
      </div>
    </>
  );

  if (error) return (
    <>
      <NavBar />
      <div className="p-4">Error: {error}</div>
    </>
  );

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
    <ErrorChecker 
      isError={isError} 
      errorMessage={errorMessage}
      errorType={errorType}
    >
      <NavBar />
      <div className="px-3 md:px-4 lg:px-15 py-4 lg:py-10 mb-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem>
              <Link href="/">Home</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link href="/database">Database</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link href="/database/BglB_characterization">BglB Characterization</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>{getBreadcrumbDisplay(entryData1)}</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-3">
            <div className="flex justify-between items-start mb-4 flex-col sm:flex-row gap-4">
              <div>
                <h1 className="text-4xl font-inter dark:text-white mb-2">
                  {getVariantDisplay(entryData1)}
                </h1>
                <p className="text-gray-600">
                  Characterization Data
                </p>
              </div>
              {canEdit && (
                <Button 
                  className="bg-[#06B7DB] text-white"
                  onClick={handleEditClick}
                >
                  Edit
                </Button>
              )}
            </div>
            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {renderSidebar()}
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>
      <ImageModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={gelImageUrl || ''} 
        title="Gel Image"
      />
      <Toast 
        show={toastInfo.show}
        title={toastInfo.title}
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo(prev => ({ ...prev, show: false }))}
      />
    </ErrorChecker>
  );
};

export default DataPageView;