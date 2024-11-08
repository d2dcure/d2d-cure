import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../../s3config';
import NavBar from '@/components/NavBar';
import SingleVarSidebar from '@/components/single_variant_submission/SingleVarSidebar';
import { AuthChecker } from '@/components/AuthChecker';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
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
import StatusChip from '@/components/StatusChip';
import { EditIcon } from "@/components/icons/EditIcon";
import { DeleteIcon } from "@/components/icons/DeleteIcon";
import { EyeIcon } from "@/components/icons/EyeIcon";
import { Tooltip } from "@nextui-org/react";
import confetti from 'canvas-confetti';

const SingleVariant = () => {
  const { user } = useUser();
  const router = useRouter();
  const { id } = router.query;

  const [currentView, setCurrentView] = useState('checklist');
  const [selectedDetail, setSelectedDetail] = useState('');
  const [entryData, setEntryData] = useState<any>({}); // CharacterizationData row 
  const [entryData2, setEntryData2] = useState<any>(null); // KineticRawData row 

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

  // Fetch entryData2 using entryData.id
  useEffect(() => {
    const fetchEntryData2 = async () => {
      if (!entryData.id) return;
      try {
        const response = await fetch(`/api/getKineticRawDataEntryData?parent_id=${entryData.id}`);
        if (!response.ok) {
          console.error('No KineticRawData entry found for this parent_id');
          setEntryData2(null);
          return;
        }
        const data = await response.json();
        setEntryData2(data);
      } catch (error) {
        console.error('Error fetching KineticRawData entry:', error);
        setEntryData2(null);
      }
    };

    fetchEntryData2();
  }, [entryData.id]);

  // Mapping function to convert enum to display value (for yield_units in KineticRawData)
  const mapYieldUnitsBack = (enumValue: string): string => {
    switch (enumValue.trim()) {
      case 'A280_':
        return 'A280*';
      case 'mg_mL_':
        return 'mg/mL';
      case 'mM_':
        return 'mM';
      case 'M_':
        return 'M';
      default:
        return enumValue;
    }
  };

  // for downloading the AB1 file from the checklist view, if it exists 
  const handleAB1Download = async (filename: string) => {
    try {
      const url = await s3.getSignedUrlPromise("getObject", {
        Bucket: "d2dcurebucket",
        Key: `sequencing/${filename}`,
      });
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

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

    const getStatusStyle = (item: any) => {
      switch (item) {
        case "Protein Modeled":
          return entryData.Rosetta_score === null
            ? { text: "Incomplete", className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1" }
            : { text: "Complete", className: "text-green-700 bg-green-100 rounded-full px-4 py-1" };
        case "Oligonucleotide ordered":
          return { text: "Complete", className: "text-green-700 bg-green-100 rounded-full px-4 py-1" };
        case "Plasmid sequence verified":
          return entryData.plasmid_verified === false
            ? { text: "Incomplete", className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1" }
            : { text: "Complete", className: "text-green-700 bg-green-100 rounded-full px-4 py-1" };
        case "Protein induced":
          return entryData.expressed === null
            ? { text: "Incomplete", className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1" }
            : { text: "Complete", className: "text-green-700 bg-green-100 rounded-full px-4 py-1" };
        case "Expressed":
          return entryData.yield_avg === null
            ? { text: "Incomplete", className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1" }
            : { text: "Complete", className: "text-green-700 bg-green-100 rounded-full px-4 py-1" };
        case "Kinetic assay data uploaded":
          return entryData.KM_avg === null
            ? { text: "Incomplete", className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1" }
            : { text: "Complete", className: "text-green-700 bg-green-100 rounded-full px-4 py-1" };
        case "Wild type kinetic data uploaded":
          return entryData.WT_raw_data_id === 0
            ? { text: "Incomplete", className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1" }
            : { text: "Complete", className: "text-green-700 bg-green-100 rounded-full px-4 py-1" };
        default:
          return { text: "Incomplete", className: "text-yellow-700 bg-yellow-100 rounded-full px-4 py-1" };
      }
    };

    const renderAdditionalInfo = (item: string) => {
      if (item === "Protein Modeled" && entryData.Rosetta_score !== null) {
        return `ΔΔG = ${entryData.Rosetta_score} REU`;
      }
      if (item === "Plasmid sequence verified" && entryData.ab1_filename) {
        return (
          <button
            className="text-[#06B7DB] hover:underline"
            onClick={() => handleAB1Download(entryData.ab1_filename)}
          >
            (Download)
          </button>
        );
      }
      if (item === "Expressed" && entryData.yield_avg !== null && entryData2 && entryData2.yield_units) {
        const yieldUnitsDisplay = mapYieldUnitsBack(entryData2.yield_units);
        return `c = ${entryData.yield_avg} ${yieldUnitsDisplay}`;
      }
      if (
        item === "Kinetic assay data uploaded" &&
        entryData.KM_avg !== null &&
        entryData.kcat_avg !== null
      ) {
        // Parse values to numbers and round them
        const kmAvg = parseFloat(entryData.KM_avg);
        const kmSd = entryData.KM_SD !== null ? parseFloat(entryData.KM_SD) : null;
        const kcatAvg = parseFloat(entryData.kcat_avg);
        const kcatSd = entryData.kcat_SD !== null ? parseFloat(entryData.kcat_SD) : null;

        const kmAvgRounded = isNaN(kmAvg) ? '' : kmAvg.toFixed(2);
        const kmSdRounded = kmSd !== null && !isNaN(kmSd) ? kmSd.toFixed(2) : null;
        const kcatAvgRounded = isNaN(kcatAvg) ? '' : kcatAvg.toFixed(1);
        const kcatSdRounded = kcatSd !== null && !isNaN(kcatSd) ? kcatSd.toFixed(1) : null;

        return (
          <>
            K<sub>M</sub> = {kmAvgRounded}
            {kmSdRounded !== null ? (
              <>
                {" "}
                &plusmn; {kmSdRounded}
              </>
            ) : null}{" "}
            mM; K<sub>cat</sub> = {kcatAvgRounded}
            {kcatSdRounded !== null ? (
              <>
                {" "}
                &plusmn; {kcatSdRounded}
              </>
            ) : null}{" "}
            min<sup>-1</sup>
          </>
        );
      }

      return null;
    };

    return (
      <Table 
        aria-label="Checklist items"
        classNames={{
          base: "max-h-[600px]",
          table: "min-h-[100px]",
          td: "py-3 text-sm",
          th: "text-sm",
        }}
      >
        <TableHeader>
          <TableColumn>Status</TableColumn>
          <TableColumn>Checklist Item</TableColumn>
          <TableColumn>Additional Info</TableColumn>
          <TableColumn align="center">Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {checklistItems.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <span className={getStatusStyle(item).className}>
                  {getStatusStyle(item).text}
                </span>
              </TableCell>
              <TableCell>{item}</TableCell>
              <TableCell className="text-center">
                {renderAdditionalInfo(item)}
              </TableCell>
              <TableCell>
                <div className="relative flex items-center justify-center gap-2">
                  <Tooltip content="View Details">
                    <span 
                      className="text-lg text-default-400 cursor-pointer active:opacity-50"
                      onClick={() => {
                        setCurrentView('detail');
                        setSelectedDetail(item);
                      }}
                    >
                      <EyeIcon />
                    </span>
                  </Tooltip>
                  <Tooltip content="Edit">
                    <span 
                      className="text-lg text-default-400 cursor-pointer active:opacity-50"
                      onClick={() => {
                        setCurrentView('detail');
                        setSelectedDetail(item);
                      }}
                    >
                      <EditIcon />
                    </span>
                  </Tooltip>
                  <Tooltip color="danger" content="Delete">
                    <span 
                      className="text-lg text-danger cursor-pointer active:opacity-50"
                      onClick={() => {
                        setCurrentView('detail');
                        setSelectedDetail(item);
                      }}
                    >
                      <DeleteIcon />
                    </span>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const buttonWidth = rect.right - rect.left;
    
    // Create multiple confetti bursts across the button
    for (let i = 0; i < 3; i++) {
      const x = (rect.left + (buttonWidth * (i/2))) / window.innerWidth;
      const y = rect.top / window.innerHeight;
      
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { x, y },
        colors: ['#06B7DB', '#0891b2', '#155e75'],
        startVelocity: 30,
        gravity: 1.2,
        ticks: 300
      });
    }
  };

  return (
    <>
      <NavBar />
      <AuthChecker minimumStatus="student">
        <div className="px-3 md:px-4 lg:px-15 py-4 lg:py-10 mb-10 bg-white">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs className="mb-2">
              <BreadcrumbItem>Home</BreadcrumbItem>
              <BreadcrumbItem>Submit</BreadcrumbItem>
              <BreadcrumbItem>Single Variant</BreadcrumbItem>
              <BreadcrumbItem>{getBreadcrumbDisplay(entryData)}</BreadcrumbItem>
            </Breadcrumbs>

            <div className="pt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-4xl font-inter dark:text-white mb-2 flex items-center gap-2">
                    {getVariantDisplay(entryData)}
                    <Link 
                      href={`/database/BglB_Characterization?search=${encodeURIComponent(
                        getVariantDisplay(entryData)
                          .replace(' BglB', '') // Remove BglB suffix
                          .trim() // Remove any extra whitespace
                      )}`}
                      className="inline-flex items-center hover:text-[#06B7DB]"
                    >
                      <ExternalLink className="w-5 h-5 stroke-[1.5]" />
                    </Link>
                  </h1>
                  <StatusChip status="in_progress" />
                </div>
                <div className="flex justify-end gap-4 -mb-12">
                  <button 
                    className="px-3 py-1 text-sm text-[#E91E63] border-2 border-[#E91E63] font-semibold rounded-xl hover:bg-[#E91E63] hover:text-white transition-colors"
                    onClick={() => {/* Add delete logic here */}}
                  >
                    Delete Profile
                  </button>
                  <button 
                    className="px-3 py-1 text-sm font-semibold rounded-xl mr-4 bg-[#06B7DB] text-white hover:bg-[#05a5c6]"
                    onClick={handleSubmit}
                  >
                    Submit for Review
                  </button>
                </div>
              </div>

              <div className="flex w-full gap-4 flex-col lg:flex-row">
                <div className="w-full lg:w-1/5">
                  <div className="lg:sticky lg:top-4">
                    <SingleVarSidebar entryData={entryData} />
                  </div>
                </div>

                <div className="flex-1">
                  {currentView === 'checklist' ? (
                    <div className="p-4">{renderChecklistTable()}</div>
                  ) : (
                    <div className="p-4">{renderDetailView()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthChecker>
    </>
  );
};

export default SingleVariant;
