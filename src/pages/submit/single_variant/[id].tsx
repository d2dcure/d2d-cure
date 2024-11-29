import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../../s3config';
import NavBar from '@/components/NavBar';
import InfoSidebar from '@/components/submission/InfoSidebar';
import { AuthChecker } from '@/components/AuthChecker';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { ExternalLink, ChevronLeft, ChevronRight, BugIcon } from 'lucide-react';
import Link from 'next/link';
import StatusChip from '@/components/StatusChip';
import { EditIcon } from "@/components/icons/EditIcon";
import { DeleteIcon } from "@/components/icons/DeleteIcon";
import { Tooltip } from "@nextui-org/react";
import confetti from 'canvas-confetti';
import Toast from '@/components/Toast';
import ConfirmationModal from '@/components/ConfirmationModal';


// Each checklist item's logic is encapsulated within its own component, to make debugging/making changes easier  
import ProteinModeledView from '@/components/submission/ProteinModeledView';
import OligonucleotideOrderedView from '@/components/submission/OligonucleotideOrderedView';
import PlasmidSequenceVerifiedView from '@/components/submission/PlasmidSequenceVerifiedView';
import ProteinInducedView from '@/components/submission/ProteinInducedView';
import ExpressedView from '@/components/submission/ExpressedView';
import KineticAssayDataView from '@/components/submission/KineticAssayDataView';
import WildTypeKineticDataView from '@/components/submission/WildTypeKineticDataView';
import ThermoAssayDataView from '@/components/submission/ThermoAssayDataView';
import WildTypeThermoDataView from '@/components/submission/WildTypeThermoDataView';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  const [showItemCompletionToast, setShowItemCompletionToast] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        showToast('Error', 'Failed to fetch entry data. Please try again.', 'error');
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
          showToast('No Data Found', 'No KineticRawData entry found for this parent_id', 'warning');
          setEntryData2(null);
          return;
        }
        const data = await response.json();
        setEntryData2(data);
      } catch (error) {
        showToast('Error', 'Failed to fetch KineticRawData entry. Please try again.', 'error');
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

  // Add this function to check if all items are complete
  const checkAllComplete = (data: any) => {
    return (
      data.Rosetta_score !== null &&
      data.oligo_ordered === true &&
      data.plasmid_verified === true &&
      data.expressed !== null &&
      data.yield_avg !== null &&
      data.KM_avg !== null &&
      data.WT_raw_data_id !== 0 &&
      data.T50 !== null &&
      data.WT_temp_raw_data_id !== 0 &&
      data.Tm !== null &&
      data.gel_filename !== null
    );
  };

  // Add this function to check if an item was just completed
  const checkItemCompletion = (oldData: any, newData: any) => {
    // Check each field to see if it changed from incomplete to complete
    if (oldData.Rosetta_score === null && newData.Rosetta_score !== null) {
      return "Protein Modeled";
    }
    if (oldData.oligo_ordered === false && newData.oligo_ordered === true) {
      return "Oligonucleotide ordered";
    }
    if (oldData.plasmid_verified === false && newData.plasmid_verified === true) {
      return "Plasmid sequence verified";
    }
    if (oldData.expressed === null && newData.expressed !== null) {
      return "Protein induced";
    }
    if (oldData.yield_avg === null && newData.yield_avg !== null) {
      return "Expressed";
    }
    if (oldData.KM_avg === null && newData.KM_avg !== null) {
      return "Kinetic assay data uploaded";
    }
    if (oldData.WT_raw_data_id === 0 && newData.WT_raw_data_id !== 0) {
      return "Wild type kinetic data uploaded";
    }
    if (oldData.T50 === null && newData.T50 !== null) {
      return "Thermostability assay data uploaded";
    }
    if (oldData.WT_temp_raw_data_id === 0 && newData.WT_temp_raw_data_id !== 0) {
      return "Wild type thermostability assay data uploaded";
    }
    if (oldData.Tm === null && newData.Tm !== null) {
      return "Melting point values uploaded";
    }
    if (oldData.gel_filename === null && newData.gel_filename !== null) {
      return "Gel uploaded";
    }
    return null;
  };

  // Modify the updateEntryData function to remove the confetti trigger
  const updateEntryData = (newData: any) => {
    const updatedData = { ...entryData, ...newData };
    
    // Check if an individual item was just completed
    const completedItem = checkItemCompletion(entryData, updatedData);
    if (completedItem) {
      setShowItemCompletionToast(completedItem);
    }

    setEntryData(updatedData);

    // Check if all items are complete after update, but don't trigger confetti
    if (checkAllComplete(updatedData)) {
      setShowCompletionToast(true);
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
      showToast('Download Failed', 'Failed to download file. Please try again.', 'error');
    }
  };

  useEffect(() => {
    const fetchTotalEntries = async () => {
      try {
        const response = await fetch('/api/getTotalCharacterizationEntries');
        if (!response.ok) throw new Error('Failed to fetch total entries');
        const { total } = await response.json();
        setTotalEntries(total);
        
        // Find current index if id exists
        if (id) {
          const indexResponse = await fetch(`/api/getEntryIndex?id=${id}`);
          if (indexResponse.ok) {
            const { index } = await indexResponse.json();
            setCurrentIndex(index);
          }
        }
      } catch (error) {
        console.error('Error fetching total entries:', error);
      }
    };

    fetchTotalEntries();
  }, [id]);

  const navigateEntry = async (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    try {
      const response = await fetch(`/api/getEntryIdByIndex?index=${newIndex}`);
      if (!response.ok) throw new Error('Failed to fetch entry ID');
      const { id: newId } = await response.json();
      router.push(`/submit/single_variant/${newId}`);
    } catch (error) {
      console.error('Error navigating entries:', error);
    }
  };

  const triggerConfetti = () => {
    // Left side burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0, y: 0.6 },
      colors: ['#06B7DB', '#05a5c6', '#048ea6'],
    });

    // Right side burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 1, y: 0.6 },
      colors: ['#06B7DB', '#05a5c6', '#048ea6'],
    });

    // Center burst after a small delay
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#06B7DB', '#05a5c6', '#048ea6'],
      });
    }, 250);

    // Cannon bursts
    const end = Date.now() + 1000; // 1 second of cannon bursts

    let interval: NodeJS.Timeout | null = null;
    interval = setInterval(() => {
      if (Date.now() > end) {
        if (interval) clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 20,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#06B7DB', '#05a5c6', '#048ea6'],
      });
      confetti({
        particleCount: 20,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#06B7DB', '#05a5c6', '#048ea6'],
      });
    }, 100);
  };

  const submitForCuration = async () => {
    if (!id) {
      setShowToast(true);
      return;
    }

    // Close the modal first
    setShowSubmitModal(false);

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
      setEntryData(updatedEntry);

      // Trigger confetti
      triggerConfetti();

      // Show success toast
      setShowToast(true);

    } catch (error) {
      console.error('Error submitting for curation:', error);
      setShowToast(true);
    }
  };

  const renderPagination = () => (
    <div className="flex items-center justify-end gap-2 mt-4">
      <button
        onClick={() => navigateEntry('prev')}
        disabled={currentIndex <= 0}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5 text-[#06B7DB]" />
      </button>
      <span className="text-sm text-gray-600">
        {currentIndex + 1} of {totalEntries}
      </span>
      <button
        onClick={() => navigateEntry('next')}
        disabled={currentIndex >= totalEntries - 1}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5 text-[#06B7DB]" />
      </button>
    </div>
  );

  const renderChecklistTable = () => {
    // For the "complete"/"incomplete" pills 
    const getStatusStyle = (item: any) => {
      switch (item) {
        case "Protein Modeled":
          return entryData.Rosetta_score === null
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Oligonucleotide ordered":
          return entryData.oligo_ordered === false
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Plasmid sequence verified":
          return entryData.plasmid_verified === false
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Protein induced":
          return entryData.expressed === null
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Expressed":
          return entryData.yield_avg === null
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Kinetic assay data uploaded":
          return entryData.KM_avg === null
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Wild type kinetic data uploaded":
          return entryData.WT_raw_data_id === 0
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Thermostability assay data uploaded":
          return entryData.T50 === null
            ? { text: "Incomplete", className: "bg-[#FFF4CF] text-[#F5A524] rounded-full px-4 py-1" }
            : { text: "Complete", className: "bg-[#D4F4D9] text-[#17C964] rounded-full px-4 py-1" };
        case "Wild type thermostability assay data uploaded":
          return entryData.WT_temp_raw_data_id === 0
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
      if (item === "Protein Modeled" && entryData.Rosetta_score !== null) {
        return (
          <div className="flex items-center gap-1">
            <span className="font-semibold">ΔΔG =</span>
            <span>{entryData.Rosetta_score} REU</span>
          </div>
        );
      }

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
      <>
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
                  {item === "Plasmid sequence verified" && entryData.ab1_filename ? (
                    <div className="flex items-center gap-2">
                      <button
                        className="text-[#06B7DB] hover:underline text-sm font-semibold"
                        onClick={() => handleAB1Download(entryData.ab1_filename)}
                      >
                        Download
                      </button>
                    </div>
                  ) : (
                    renderAdditionalInfo(item)
                  )}
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

        {/* Add the bug report link below the table */}
        <div className="flex justify-end mt-4 mr-3">
          <Link 
            href={`/contact/report?page=${encodeURIComponent(`/submit/single_variant/${id}`)}`}
            className="text-sm text-gray-600 hover:text-[#06B7DB] flex items-center gap-1.5 transition-colors duration-200"
          >
            <BugIcon className="w-4 h-4" />
            <span>Report a bug</span>
          </Link>
        </div>
      </>
    );
  };

  const renderDetailView = () => {
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

    const currentIndex = checklistItems.indexOf(selectedDetail);
    const prevItem = currentIndex > 0 ? checklistItems[currentIndex - 1] : null;
    const nextItem = currentIndex < checklistItems.length - 1 ? checklistItems[currentIndex + 1] : null;

    const DetailComponent = (() => {
      switch (selectedDetail) {
        case "Protein Modeled":
          return <ProteinModeledView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />;
        case "Oligonucleotide ordered":
          return <OligonucleotideOrderedView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData}  />;
        case "Plasmid sequence verified":
          return <PlasmidSequenceVerifiedView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />; 
        case 'Protein induced':
          return <ProteinInducedView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />;
        case 'Expressed':
          return <ExpressedView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />;
        case "Kinetic assay data uploaded":
          return <KineticAssayDataView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />; 
        case "Wild type kinetic data uploaded":
          return <WildTypeKineticDataView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />; 
        case "Thermostability assay data uploaded":
          return <ThermoAssayDataView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />;
        case "Wild type thermostability assay data uploaded":
          return <WildTypeThermoDataView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />;
        case "Melting point values uploaded":
          return <MeltingPointView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />;
        case "Gel uploaded":
          return <GelUploadedView entryData={entryData} setCurrentView={setCurrentView} updateEntryData={updateEntryData} />; 

        default:
          return <div>Detail view for {selectedDetail}</div>;
      }
    })();

    return (
      <div className="flex flex-col">
        {DetailComponent}
        
        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
          {/* Previous Button */}
          <button
            onClick={() => prevItem && setSelectedDetail(prevItem)}
            className={`flex items-center gap-2 transition-colors ${
              prevItem 
                ? 'text-gray-600 hover:text-[#06B7DB]' 
                : 'text-gray-200 cursor-not-allowed'
            }`}
            disabled={!prevItem}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">{prevItem}</span>
          </button>

          {/* Progress Dots with Tooltip */}
          <Tooltip 
            content={`Step ${currentIndex + 1} of ${checklistItems.length}`}
            placement="top"
          >
            <div className="hidden md:flex items-center gap-1.5 cursor-help">
              {checklistItems.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-6 bg-[#06B7DB]'
                      : idx < currentIndex
                        ? 'w-1.5 bg-[#06B7DB]/30'
                        : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </Tooltip>

          {/* Next Button */}
          <button
            onClick={() => nextItem && setSelectedDetail(nextItem)}
            className={`flex items-center gap-2 transition-colors ${
              nextItem 
                ? 'text-gray-600 hover:text-[#06B7DB]' 
                : 'text-gray-200 cursor-not-allowed'
            }`}
            disabled={!nextItem}
          >
            <span className="text-sm hidden sm:inline">{nextItem}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
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

  const navigateChecklist = (direction: 'next' | 'prev') => {
    const currentIndex = checklistItems.indexOf(selectedDetail);
    if (direction === 'next' && currentIndex < checklistItems.length - 1) {
      setSelectedDetail(checklistItems[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedDetail(checklistItems[currentIndex - 1]);
    }
  };

  const renderChecklistNavigation = () => {
    if (currentView !== 'detail') return null;
    
    const currentIndex = checklistItems.indexOf(selectedDetail);
    
    return (
      <div className="flex items-center justify-between mt-6 pb-4 px-4">
        {/* Previous */}
        <div 
          onClick={() => currentIndex > 0 && navigateChecklist('prev')}
          className={`flex items-center gap-1.5 ${
            currentIndex > 0 
              ? 'text-[#06B7DB] cursor-pointer hover:text-[#048ea6] transition-colors duration-200' 
              : 'invisible'  // Using invisible instead of opacity-0 to maintain spacing
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {currentIndex > 0 ? checklistItems[currentIndex - 1] : ''}
          </span>
        </div>

        {/* Next */}
        <div 
          onClick={() => currentIndex < checklistItems.length - 1 && navigateChecklist('next')}
          className={`flex items-center gap-1.5 ${
            currentIndex < checklistItems.length - 1 
              ? 'text-[#06B7DB] cursor-pointer hover:text-[#048ea6] transition-colors duration-200' 
              : 'invisible'  // Using invisible instead of opacity-0 to maintain spacing
          }`}
        >
          <span className="text-xs font-medium">
            {currentIndex < checklistItems.length - 1 ? checklistItems[currentIndex + 1] : ''}
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  };

  // Add delete functionality
  const handleDelete = async () => {
    if (!id) return;

    // Close the modal first
    setShowDeleteModal(false);

    try {
      const response = await fetch('/api/deleteCharacterizationData', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete variant');
      }

      // Show success toast and redirect
      setShowToast(true);
      router.push('/submit');

    } catch (error) {
      console.error('Error deleting variant:', error);
      setShowToast(true);
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
                    onClick={() => setShowSubmitModal(true)}
                  >
                    Submit for Review
                  </button>
                  <button 
                    className="px-4 py-2 text-sm text-[#E91E63] border-2 border-[#E91E63] font-semibold rounded-xl hover:bg-[#E91E63] hover:text-white transition-colors"
                    onClick={() => setShowDeleteModal(true)}
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
                    <div className="p-4">
                      {renderDetailView()}
                      {renderChecklistNavigation()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Toast
          show={toastInfo.show}
          type={toastInfo.type}
          title={toastInfo.title}
          message={toastInfo.message}
          onClose={() => setToastInfo(prev => ({ ...prev, show: false }))}
        />
      </AuthChecker>
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        title="Successfully submitted for curation"
        message="We'll notify you when there are any status changes."
      />
      <Toast
        show={showCompletionToast}
        onClose={() => setShowCompletionToast(false)}
        title="All checklist items complete! 🎉"
        message="You can now submit this variant for curation."
        type="success"
        actions={[
          {
            label: "Submit for Review",
            onClick: () => {
              setShowCompletionToast(false);
              submitForCuration();
            },
            variant: "primary"
          }
        ]}
      />
      <Toast
        show={showItemCompletionToast !== null}
        onClose={() => setShowItemCompletionToast(null)}
        title={`${showItemCompletionToast || ''} completed!`}
        message="Keep up the great work!"
        type="success"
      />

      {/* Existing Submit Modal */}
      <ConfirmationModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={submitForCuration}
        title="Submit for Review"
        message="Are you sure you want to submit this variant for review? This will notify the administrators to begin the curation process."
        confirmText="Submit"
        cancelText="Cancel"
        confirmButtonColor="primary"
      />

      {/* Add Delete Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Variant"
        message={`Are you sure you want to delete ${getVariantDisplay(entryData)}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="danger"
      />
    </>
  );
};

export default SingleVariant;
