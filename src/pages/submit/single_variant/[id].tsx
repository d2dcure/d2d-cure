import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../../s3config';
import NavBar from '@/components/NavBar';
import SingleVarSidebar from '@/components/single_variant_submission/SingleVarSidebar';

// Each checklist item's logic is encapsulated within its own component, to make debugging/making changes easier  
import ProteinModeledView from '@/components/single_variant_submission/ProteinModeledView';
import OligonucleotideOrderedView from '@/components/single_variant_submission/OligonucleotideOrderedView';
import PlasmidSequenceVerifiedView from '@/components/single_variant_submission/PlasmidSequenceVerifiedView';
import ProteinInducedView from '@/components/single_variant_submission/ProteinInducedView';
import ExpressedView from '@/components/single_variant_submission/ExpressedView';
import KineticAssayDataView from '@/components/single_variant_submission/KineticAssayDataView';
import WildTypeKineticDataView from '@/components/single_variant_submission/WildTypeKineticDataView';
import ThermoAssayDataView from '@/components/single_variant_submission/ThermoAssayDataView';
import WildTypeThermoDataView from '@/components/single_variant_submission/WildTypeThermoDataView';
import MeltingPointView from '@/components/single_variant_submission/MeltingPointView';
import GelUploadedView from '@/components/single_variant_submission/GelUploadedView';

const SingleVariant = () => {
  const { user } = useUser();
  const router = useRouter();
  const { id } = router.query;

  const [currentView, setCurrentView] = useState('checklist');
  const [selectedDetail, setSelectedDetail] = useState('');
  const [entryData, setEntryData] = useState<any>([]);


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

    fetchEntryData();
  }, [id, user]); 

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
        return <ThermoAssayDataView entryData={entryData} setCurrentView={setCurrentView} />;
      case "Wild type thermostability assay data uploaded":
        return <WildTypeThermoDataView entryData={entryData} setCurrentView={setCurrentView} />;
      case "Melting point values uploaded":
        return <MeltingPointView entryData={entryData} setCurrentView={setCurrentView} />;
      case "Gel uploaded":
        return <GelUploadedView entryData={entryData} setCurrentView={setCurrentView} />; 

      default:
        return <div>Detail view for {selectedDetail}</div>;
    }
  };

  return (
    <>
      <NavBar />
      <div className="flex mt-8">
        {/* Sidebar for variant information */}
        <SingleVarSidebar entryData={entryData} />
  
        {/* Main content area for checklist table */}
        <div className="flex-1 overflow-auto p-4">
          {currentView === 'checklist' ? (
            <div>{renderChecklistTable()}</div>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-4xl mx-auto">
              {renderDetailView()}
            </div>
          )}
        </div>
      </div>
    </>
  );
  
};


export default SingleVariant;
