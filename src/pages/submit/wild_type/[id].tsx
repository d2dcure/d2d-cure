import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../../s3config';
import NavBar from '@/components/NavBar';
import InfoSidebar from '@/components/submission/InfoSidebar';
import { AuthChecker } from '@/components/AuthChecker';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import StatusChip from '@/components/StatusChip';
import { EditIcon } from "@/components/icons/EditIcon";
import { DeleteIcon } from "@/components/icons/DeleteIcon";
import { Tooltip } from "@nextui-org/react";
import confetti from 'canvas-confetti';


// Each checklist item's logic is encapsulated within its own component, to make debugging/making changes easier  
import ProteinInducedView from '@/components/submission/ProteinInducedView';
import ExpressedView from '@/components/submission/ExpressedView';
import KineticAssayDataView from '@/components/submission/KineticAssayDataView';
import ThermoAssayDataView from '@/components/submission/ThermoAssayDataView';
import MeltingPointView from '@/components/submission/MeltingPointView';
import GelUploadedView from '@/components/submission/GelUploadedView';


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

  // For real-time updates 
  const updateEntryData = (newData: any) => {
    setEntryData((prevData:any) => ({ ...prevData, ...newData }));
  };

  const submitForCuration = async () => {
    if (!id) {
      alert('Invalid entry ID');
      return;
    }
    try {
      const response = await fetch('/api/updateCharacterizationDataSubmitted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit for curation');
      }

      const updatedEntry = await response.json();
      setEntryData(updatedEntry); // Update entry data to reflect submission status

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      alert('Submitted for curation successfully!');
    } catch (error) {
      console.error('Error submitting for curation:', error);
      alert('Failed to submit for curation. Please try again.');
    }
  };


  const renderChecklistTable = () => {
    const checklistItems = [
      'Protein induced',
      'Expressed',
      "Kinetic assay data uploaded",
      "Thermostability assay data uploaded",
      "Melting point values uploaded",
      "Gel uploaded"
    ];

    // For the "complete"/"incomplete" pills 
    const getStatusStyle = (item: any) => {
      switch (item) {
        case "Expressed":
          return entryData.yield_avg === null
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Kinetic assay data uploaded":
          return entryData.KM_avg === null
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Thermostability assay data uploaded":
          return entryData.T50 === null
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Melting point values uploaded":
          return entryData.Tm === null
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Gel uploaded":
          return entryData.gel_filename === null
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        default:
          return { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" };
      }
    };

    const renderAdditionalInfo = (item: string) => {

      if (item === "Expressed" && entryData.yield_avg !== null && entryData2 && entryData2.yield_units) {
        const yieldUnitsDisplay = mapYieldUnitsBack(entryData2.yield_units);
        return (
          <div className="flex items-center gap-1">
            <span className="font-semibold">c =</span>
            <span>{entryData.yield_avg} {yieldUnitsDisplay}</span>
          </div>
        );
      }

      if (item === "Kinetic assay data uploaded" && entryData.KM_avg !== null && entryData.kcat_avg !== null) {
        const kmAvg = parseFloat(entryData.KM_avg);
        const kmSd = entryData.KM_SD !== null ? parseFloat(entryData.KM_SD) : null;
        const kcatAvg = parseFloat(entryData.kcat_avg);
        const kcatSd = entryData.kcat_SD !== null ? parseFloat(entryData.kcat_SD) : null;

        const kmAvgRounded = isNaN(kmAvg) ? '' : kmAvg.toFixed(2);
        const kmSdRounded = kmSd !== null && !isNaN(kmSd) ? kmSd.toFixed(2) : null;
        const kcatAvgRounded = isNaN(kcatAvg) ? '' : kcatAvg.toFixed(1);
        const kcatSdRounded = kcatSd !== null && !isNaN(kcatSd) ? kcatSd.toFixed(1) : null;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="font-semibold">K<sub>M</sub> =</span>
              <span>
                {kmAvgRounded}
                {kmSdRounded !== null && <> ± {kmSdRounded}</>} mM
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">k<sub>cat</sub> =</span>
              <span>
                {kcatAvgRounded}
                {kcatSdRounded !== null && <> ± {kcatSdRounded}</>} min<sup>-1</sup>
              </span>
            </div>
          </div>
        );
      }

      if (item === "Thermostability assay data uploaded" && entryData.T50 !== null) {
        const t50 = parseFloat(entryData.T50).toFixed(1); 
        const t50sd = parseFloat(entryData.T50_SD).toFixed(1); 
        return (
          <div className="flex items-center gap-1">
            <span className="font-semibold">T<sub>50</sub> =</span>
            <span>{t50} ± {t50sd}°C</span>
          </div>
        );
      }

      if (item === "Melting point values uploaded" && entryData.Tm !== null) {
        const tm = parseFloat(entryData.Tm).toFixed(1); 
        const tmSD = parseFloat(entryData.Tm_SD).toFixed(1); 
        return (
          <div className="flex items-center gap-1">
            <span className="font-semibold">T<sub>M</sub> =</span>
            <span>{tm} ± {tmSD}°C</span>
          </div>
        );
      }

      return null;
    };

    return (
      <Table 
        aria-label="Checklist items"
        classNames={{
          base: "max-h-[700px]",
          table: "min-h-[100px]",
          td: "h-[52px]",
          th: "h-[52px] text-sm",
          tr: "h-[52px]",
        }}
      >
        <TableHeader>
          <TableColumn>Status</TableColumn>
          <TableColumn>Checklist Item</TableColumn>
          <TableColumn align="start">Additional Info</TableColumn>
          <TableColumn align="center">Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {checklistItems.map((item, index) => (
            <TableRow key={index} className="h-[52px]">
              <TableCell>
                <span className={getStatusStyle(item).className}>
                  {getStatusStyle(item).text}
                </span>
              </TableCell>
              <TableCell>{item}</TableCell>
              <TableCell className="text-left font-medium text-gray-600">
               {renderAdditionalInfo(item)} 
              </TableCell>
              <TableCell>
                <div className="relative flex items-center justify-center gap-2">
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
      case 'Protein induced':
        return <ProteinInducedView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />;
      case 'Expressed':
        return <ExpressedView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />;
      case "Kinetic assay data uploaded":
        return <KineticAssayDataView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />; 
      case "Thermostability assay data uploaded":
        return <ThermoAssayDataView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />;
      case "Melting point values uploaded":
        return <MeltingPointView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />;
      case "Gel uploaded":
        return <GelUploadedView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />; 
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
              <div className="flex justify-between items-start mb-4 flex-col sm:flex-row gap-4">
                <div>
                  <h1 className="text-4xl font-inter dark:text-white mb-2 flex items-center gap-2">
                    {getVariantDisplay(entryData)}
                    <Link 
                      href={`/database/BglB_Characterization?search=${encodeURIComponent(
                        getVariantDisplay(entryData)
                          .replace(' BglB', '')
                          .trim()
                      )}`}
                      className="inline-flex items-center hover:text-[#06B7DB]"
                    >
                      <ExternalLink className="w-5 h-5 stroke-[1.5]" />
                    </Link>
                  </h1>
                  <StatusChip 
                    status={
                      entryData.submitted_for_curation 
                        ? entryData.approved_by_pi 
                          ? 'approved' 
                          : !entryData.curated 
                            ? 'pending_approval' 
                            : 'in_progress'
                        : 'in_progress'
                    } 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[300px]">
                  <button 
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6]"
                    onClick={submitForCuration}
                  >
                    Submit for Review
                  </button>
                  <button 
                    className="px-4 py-2 text-sm text-[#E91E63] border-2 border-[#E91E63] font-semibold rounded-xl hover:bg-[#E91E63] hover:text-white transition-colors"
                    onClick={() => {/* Add delete logic here */}}
                  >
                    Delete Profile
                  </button>
                </div>
              </div>

              <div className="flex w-full gap-4 flex-col lg:flex-row">
                <div className="w-full lg:w-1/5">
                  <div className="lg:sticky lg:top-4">
                    <InfoSidebar entryData={entryData} updateEntryData={updateEntryData} />
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
