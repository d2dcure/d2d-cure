import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../../s3config';
import NavBar from '@/components/NavBar';

// Each checklist item's logic is encapsulated within its own component, to make debugging/making changes easier  
import ProteinModeledView from '@/components/single_variant_submission/ProteinModeledView';
import OligonucleotideOrderedView from '@/components/single_variant_submission/OligonucleotideOrderedView';
import PlasmidSequenceVerifiedView from '@/components/single_variant_submission/PlasmidSequenceVerifiedView';
import ProteinInducedView from '@/components/single_variant_submission/ProteinInducedView';
import ExpressedView from '@/components/single_variant_submission/ExpressedView';
import KineticAssayDataView from '@/components/single_variant_submission/KineticAssayDataView';
import WildTypeKineticDataView from '@/components/single_variant_submission/WildTypeKineticDataView';
import ThermoAssayDataView from '@/components/single_variant_submission/ThermoAssayDataView';

const SingleVariant = () => {
  const { user } = useUser();
  const router = useRouter();
  const { id } = router.query;

  const [currentView, setCurrentView] = useState('checklist');
  const [selectedDetail, setSelectedDetail] = useState('');

  const [entryData, setEntryData] = useState<any>([]);

  const [oligosData, setOligosData] = useState<any[]>([]);
  const [possibleTeammates, setPossibleTeammates] = useState<any>([]);
  const [teammate1, setTeammate1] = useState<any>([]);
  const [teammate2, setTeammate2] = useState<any>([]);
  const [teammate3, setTeammate3] = useState<any>([]);

  const [showTempWTDataOptions, setShowTempWTDataOptions] = useState(false);
  const [tempRawDataIds, setTempRawDataIds] = useState<number[]>([]);
  const [tempWTId, setTempWTId] = useState<any>(0);
  const [tempData, setTempData] = useState<any[]>([]);
  const [gelImages, setGelImages] = useState<any[]>([]);


  useEffect(() => {
    const fetchEntryData = async () => {
      if (!id) return; 
      try {
        const response = await fetch(`/api/getCharacterizationDataEntryFromID?id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch entry data');
        }
        const data = await response.json();
        setEntryData(data);
      } catch (error) {
        console.error('Error fetching entry data:', error);
      }
    };
    const fetchTempWTData = async () => {
      const response = await fetch('/api/getCharacterizationData');
      const data = await response.json();
      const filteredData = data.filter((row:any) => row.institution === user?.institution && row.resid === "X");
      const ids = filteredData.map((row:any) => row.temp_raw_data_id).filter((id:any) => id !== 0); 
      setTempRawDataIds(ids);
      console.log("TEMPT:" + ids); 
    };
    const fetchOligosData = async () => {
      const response = await fetch('/api/getOligos');
      const data = await response.json();
      setOligosData(data);
    };
    const fetchPossibleTeammates = async () => {
      if (user?.pi) {
        const response = await fetch(`/api/getUsersFromPI?pi=${encodeURIComponent(user.pi)}`);
        const data = await response.json();
        setPossibleTeammates(data);
      }
    };

    fetchEntryData();
    fetchOligosData(); 
    fetchPossibleTeammates();
    fetchTempWTData(); 
  }, [id, user]); 


  // for getting the (filtered) kin data and temp data for WT selection. needs to be in a seperate useState because of the rawDataIds being part of the depenecy array. in the other useState, we are also fetching this data. 
  useEffect(() => {
    const fetchTempData = async () => {
      if (tempRawDataIds.length > 0) {
        try {
          const response = await fetch('/api/getTempRawDataFromIDs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: tempRawDataIds }),
          });
          const data = await response.json();
          setTempData(data);
        } catch (error) {
          console.error('Error fetching temp raw data:', error);
        }
      }
    };

    fetchTempData(); 
  }, [id, user, tempRawDataIds]); 


  const fetchGelImages = async (institution:any) => {
    const params = {
      Bucket: 'd2dcurebucket',
      Prefix: `gel-images/${institution}` 
    };
  
    try {
      const data = await s3.listObjectsV2(params).promise();
      if (data && data.Contents) {
        return data.Contents.map(file => ({
          key: file.Key,
          url: `https://${params.Bucket}.s3.amazonaws.com/${file.Key}`
        }));
      } else {
        console.error('Empty response or missing Contents:', data);
        return []; // Return an empty array or handle the error accordingly
      }
    } catch (err) {
      console.error('Error fetching files', err);
      throw err;
    }
  };

  const handleSelectPreviousGelImage = async () => {
    try {
      const images = await fetchGelImages(user?.institution);
      console.log(images)
      setGelImages(images);
    } catch (error) {
      console.error('Error fetching gel images:', error);
    }
  };


  const foundOligo = oligosData.find(oligo => oligo.variant === entryData.resid+entryData.resnum+entryData.resmut);
  const renderChecklistTable = () => {
    const checklistItems = [
      "Protein Modeled",
      "Oligonucleotide ordered",
      "Plasmid sequence verified",
      'Protein induced',
      'Expressed',
      "Kinetic assay data uploaded",
      "Wild type kinetic data uploaded",
      "Thermostability assay data uploaded",
      "Wild type thermostability assay data uploaded",
      "Melting point values uploaded",
      "Gel uploaded"
    ];

    const getStatusStyle = (item:any) => {
      switch (item) {
        case "Protein Modeled":
          if (entryData.Rosetta_score === null) {
            return {
              text: "Incomplete",
              className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1"
            };
          } else {
            return {
              text: "Complete",
              className: "text-green-700 bg-green-100 rounded-full px-4 py-1"
            };
          }
        case "Oligonucleotide ordered":
            return {
              text: "Complete",
              className: "text-green-700 bg-green-100 rounded-full px-4 py-1"
            };
        case "Plasmid sequence verified":
          if (entryData.plasmid_verified === false) {
            return {
              text: "Incomplete",
              className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1"
            };
          } else {
            return {
              text: "Complete",
              className: "text-green-700 bg-green-100 rounded-full px-4 py-1"
            };
          }
        case "Protein induced":
          if (entryData.expressed === null) {
            return {
              text: "Incomplete",
              className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1"
            };
          } else {
            return {
              text: "Complete",
              className: "text-green-700 bg-green-100 rounded-full px-4 py-1"
            };
          }
        case "Expressed":
        if (entryData.yield_avg === null) {
          return {
            text: "Incomplete",
            className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1"
          };
        } else {
          return {
            text: "Complete",
            className: "text-green-700 bg-green-100 rounded-full px-4 py-1"
          };
        }
        case "Wild type kinetic data uploaded":
          if (entryData.WT_raw_data_id === 0) {
            return {
              text: "Incomplete",
              className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1"
            };
          } else {
            return {
              text: "Complete",
              className: "text-green-700 bg-green-100 rounded-full px-4 py-1"
            };
          }
        default:
          return {
            text: "Incomplete",
            className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1"
          };
      }
    };

    return (
      <div className="flex justify-center mt-5 mb-5">
        <div className="w-full max-w-4xl">
          {/* Submit for Review button */}
          <div className="flex justify-end mb-4">
            <button 
              className="px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600"
              onClick={() => {/* Add submit logic here, or create a function for it */}}
            >
              Submit for Review
            </button>
          </div>
    
          {/* Table container */}
          <div className="rounded-lg shadow-lg">
            <table className="w-full">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Checklist Item</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {checklistItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-center">
                      <span className={getStatusStyle(item).className}>
                        {getStatusStyle(item).text}
                      </span>
                    </td>
                    <td className="px-4 py-2">{item}</td>
                    <td className="px-4 py-2 text-center">
                      <button 
                        className="px-4 py-1 text-white bg-blue-500 rounded hover:bg-blue-700"
                        onClick={() => {
                          setCurrentView('detail');
                          setSelectedDetail(item);
                        }}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailView = () => {
    switch (selectedDetail) {
      case "Protein Modeled":
        return <ProteinModeledView entryData={entryData} setCurrentView={setCurrentView} />;
      case "Oligonucleotide ordered":
        return <OligonucleotideOrderedView entryData={entryData} setCurrentView={setCurrentView} />;
      case "Plasmid sequence verified":
        return <PlasmidSequenceVerifiedView entryData={entryData} setCurrentView={setCurrentView} />; 
      case 'Protein induced':
        return <ProteinInducedView entryData={entryData} setCurrentView={setCurrentView} />;
      case 'Expressed':
        return <ExpressedView entryData={entryData} setCurrentView={setCurrentView} />;
      case "Kinetic assay data uploaded":
        return <KineticAssayDataView entryData={entryData} setCurrentView={setCurrentView} />; 
      case "Wild type kinetic data uploaded":
        return <WildTypeKineticDataView entryData={entryData} setCurrentView={setCurrentView} />; 
      case "Thermostability assay data uploaded":
        return <ThermoAssayDataView entryData={entryData} setCurrentView={setCurrentView} />
      case "Wild type thermostability assay data uploaded":
        return (
          <div>
            <h2>Wild type thermostability assay data uploaded?</h2>
            <button onClick={() => setShowTempWTDataOptions(!showTempWTDataOptions)}>Select WT data</button>
            <div>
              {showTempWTDataOptions && tempData.map((row, index) => (
                <div key={index}>
                  <input
                    type="radio"
                    id={`wt-data-${index}`}
                    name="wt-data"
                    value={row.id}
                    onChange={() => setTempWTId(row.id)}
                    checked={tempWTId === row.id}
                  />
                  <label htmlFor={`wt-data-${index}`}>
                    WT data uploaded by {row.user_name}, assayed on {row.assay_date}
                  </label>
                </div>
              ))}
            </div>
  
            <button className="mr-4">Save</button>
            <button onClick={() => setCurrentView('checklist')}>Back to Checklist</button>
          </div>
        );
      case "Melting point values uploaded":
        return (
          <div>
            <h2>Melting point values uploaded?</h2>
            <input type="text" placeholder="Tm mean(°C)" className="ml-2" />
            <input type="text" placeholder="Tm standard deviation(°C)" className="ml-2" />

            <button className="mr-4">Save</button>
            <button onClick={() => setCurrentView('checklist')}>Back to Checklist</button>
          </div>
        );
      case "Gel uploaded":
        return (
          <div>
            <h2>Gel Uploaded?</h2>
            <button className="ml-2">Upload new gel image</button>
            <button onClick={handleSelectPreviousGelImage}>
              Select Previous gel image
            </button>
            {gelImages.length > 0 && (
              <div>
                {gelImages.length > 0 && (
                  <div>
                    {gelImages.map((image, index) => (
                      <div key={index}>
                        <input
                          type="radio"
                          id={`gel-image-${index}`}
                          name="gel-image"
                          value={image.key}
                          onChange={() => console.log(image.key)} // Handle image selection
                        />
                        <label htmlFor={`gel-image-${index}`}>
                          <img
                            style={{
                              maxWidth: "200px",
                              maxHeight: "200px",
                              overflow: "hidden",
                            }}
                            src={image.url}
                            alt={`Gel Image ${index}`}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button className="mr-4">Save</button>
            <button onClick={() => setCurrentView('checklist')}>Back to Checklist</button>
          </div>
        );
      // Add cases for other checklist items here
      default:
        return <div>Detail view for {selectedDetail}</div>;
    }
  };

  return (
    <>
    <NavBar></NavBar>
    <div className="flex mt-8">
      {/* Sidebar for variant information */}
      <div className="w-1/4 bg-white p-4 shadow">
        <h1 className="text-2xl font-bold">Variant Information</h1>
        <div className="mt-5 mb-5">
          <p>
            {entryData.resid}
            {entryData.resnum}
            {entryData.resmut}
          </p>
          {foundOligo && <p>Primer Sequence: {foundOligo.oligo}</p>}
          <p>Database ID: {entryData.id}</p>
          <p>Institution: {entryData.institution}</p>
          <p>Creator: {entryData.creator}</p>
          <div>
            <label>Teammate 1:</label>
            <select
              value={teammate1}
              onChange={(e) => setTeammate1(e.target.value)}
              className="mt-1 block w-full p-2 bg-gray-100 border rounded"
            >
              <option value="">None</option>
              {possibleTeammates.map((mate:any, index:any) => (
                <option key={index} value={mate.user_name}>
                  {mate.given_name} ({mate.user_name})
                </option>
              ))}
            </select>
          </div>
          {/* Additional teammate selectors */}
        </div>
      </div>
  
      {/* Main content area for checklist table */}
      <div className="flex-1 overflow-auto p-4">
  {currentView === 'checklist' ? (
    <div>
      {renderChecklistTable()}
    </div>
  ) : (
    <div className={"bg-white p-4 rounded-lg shadow-lg max-w-4xl mx-auto"}>
      {renderDetailView()}
    </div>
  )}
</div>
    </div>
    </>
  );
};


export default SingleVariant;
