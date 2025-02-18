import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/components/UserProvider';
import s3 from '../../../../s3config';
import NavBar from '@/components/NavBar';
import InfoSidebar from '@/components/submission/InfoSidebar';
import { AuthChecker } from '@/components/AuthChecker';
import { Breadcrumbs, BreadcrumbItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { ExternalLink, ChevronLeft, ChevronRight, BugIcon } from 'lucide-react';
import Link from 'next/link';
import StatusChip from '@/components/StatusChip';
import { EditIcon } from "@/components/icons/EditIcon";
import { DeleteIcon } from "@/components/icons/DeleteIcon";
import confetti from 'canvas-confetti';
import Toast from '@/components/Toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { EntryAccessChecker } from '@/components/EntryAccessChecker';

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
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  // Toast and modal states
  const [toastInfo, setToastInfo] = useState<{
    show: boolean;
    type: 'error' | 'success' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  const [showItemCompletionToast, setShowItemCompletionToast] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const checklistItems = [
    'Protein induced',
    'Expressed',
    'Kinetic assay data uploaded',
    'Thermostability assay data uploaded',
    'Melting point values uploaded',
    'Gel uploaded',
  ];

  // Helper function to show toast
  const showToast = (
    title: string,
    message: string,
    type: 'error' | 'success' | 'warning' | 'info' = 'success'
  ) => {
    setToastInfo({
      show: true,
      type,
      title,
      message,
    });
  };

  useEffect(() => {
    const fetchEntryData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/getCharacterizationDataEntryFromID?id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch entry data');
        }
        const data = await response.json();
        setEntryData(data);
      } catch (error) {
        showToast('Error', 'Failed to fetch entry data. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEntryData();
  }, [id]);

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

  // Function to check if all items are complete
  const checkAllComplete = (data: any) => {
    return (
      data.expressed !== null &&
      data.yield_avg !== null &&
      data.KM_avg !== null &&
      data.T50 !== null &&
      data.Tm !== null &&
      data.gel_filename !== null
    );
  };

  // Function to check if an item was just completed
  const checkItemCompletion = (oldData: any, newData: any) => {
    // Check each field to see if it changed from incomplete to complete
    if (oldData.expressed === null && newData.expressed !== null) {
      return 'Protein induced';
    }
    if (oldData.yield_avg === null && newData.yield_avg !== null) {
      return 'Expressed';
    }
    if (oldData.KM_avg === null && newData.KM_avg !== null) {
      return 'Kinetic assay data uploaded';
    }
    if (oldData.T50 === null && newData.T50 !== null) {
      return 'Thermostability assay data uploaded';
    }
    if (oldData.Tm === null && newData.Tm !== null) {
      return 'Melting point values uploaded';
    }
    if (oldData.gel_filename === null && newData.gel_filename !== null) {
      return 'Gel uploaded';
    }
    return null;
  };

  // Update entry data with completion checks
  const updateEntryData = (newData: any) => {
    const updatedData = { ...entryData, ...newData };

    // Check if an individual item was just completed
    const completedItem = checkItemCompletion(entryData, updatedData);
    if (completedItem) {
      setShowItemCompletionToast(completedItem);
    }

    setEntryData(updatedData);

    // Check if all items are complete after update
    if (checkAllComplete(updatedData)) {
      setShowCompletionToast(true);
    }
  };

  // Fetch total entries for pagination
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
      showToast('Error', 'Invalid entry ID', 'error');
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
      showToast(
        'Submitted for curation!',
        "We'll notify you when there are any status changes.",
        'success'
      );
    } catch (error) {
      console.error('Error submitting for curation:', error);
      showToast('Submission Failed', 'Failed to submit for curation. Please try again.', 'error');
    }
  };

  // Handle variant deletion
  const handleDelete = async () => {
    if (!id) return;

    // Close the modal first
    setShowDeleteModal(false);

    try {
      const response = await fetch('/api/deleteCharacterizationEntryData', {
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
      showToast('Variant Deleted', 'The variant has been successfully deleted.', 'success');
      router.push('/submit');
    } catch (error) {
      console.error('Error deleting variant:', error);
      showToast('Deletion Failed', 'Failed to delete variant. Please try again.', 'error');
    }
  };

  const handleItemDelete = async () => {
    if (!itemToDelete) return;

    try {
      let response;
      switch (itemToDelete) {
        case 'Protein induced':
          // Reset induction data
          response = await fetch('/api/updateCharacterizationDataExpressed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: entryData.id,
              expressed: false, 
            })
          });
          break;

        case 'Expressed':
          // First update KineticRawData
          response = await fetch('/api/updateKineticRawDataYield', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parent_id: entryData.id,
              yield_value: null,
              yield_units: null,
            }),
          });

          // Then update CharacterizationData
          response = await fetch('/api/updateCharacterizationDataYieldAvg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: entryData.id,
              yield_avg: null,
            }),
          });
          break;

        case 'Kinetic assay data uploaded':
          // First delete the KineticRawData entry
          const response1 = await fetch('/api/deleteKineticData', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parent_id: entryData.id })
          });

          if (response1.ok) {
            // Then update CharacterizationData to remove references
            response = await fetch('/api/updateCharacterizationDataKineticStuff', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                parent_id: entryData.id,
                kcat: null,
                kcat_SD: null,
                KM: null,
                KM_SD: null,
                kcat_over_KM: null,
                kcat_over_KM_SD: null,
                raw_data_id: 0,
                yield: entryData.yield_avg,
              })
            });
          }
          break;


        case 'Thermostability assay data uploaded':
          // First delete the TempRawData entry
          const response2 = await fetch('/api/deleteTempData', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parent_id: entryData.id })
          });

          if (response2.ok) {
            // Then update CharacterizationData to remove references
            response = await fetch('/api/updateCharacterizationDataThermoStuff', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                parent_id: entryData.id, 
                T50: null, 
                T50_SD: null, 
                T50_k: null, 
                T50_k_SD: null, 
                temp_raw_data_id: 0, 
              })
            }); 
          }
          break;


        case 'Melting point values uploaded':
          // Reset melting point data
          response = await fetch('/api/updateMeltingPointValues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: entryData.id,
              tm_mean: null, 
              tm_std_dev: null,
            })
          });
          break;

        case 'Gel uploaded':
          // Reset gel data
          response = await fetch('/api/updateCharacterizationDataGelFilename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: entryData.id, 
              gel_filename: null, 
            })
          });
          break;
      }

      if (response && response.status == 200) {
        const updatedEntry = await response.json();
        updateEntryData(updatedEntry);
        showToast('Success', 'Data deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete data');
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      showToast('Error', 'Failed to delete data. Please try again.', 'error');
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

      if (item === "Gel uploaded" && entryData.gel_filename) {
        return (
          <div className="flex items-center gap-2">
            <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
              <img
                src={`https://d2dcurebucket.s3.amazonaws.com/gel-images/${entryData.gel_filename}`}
                alt="Gel"
                className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  setCurrentView('detail');
                  setSelectedDetail(item);
                }}
                onError={(e) => {
                  console.error('Error loading gel image');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        );
      }

      return null;
    };

    // Helper function to determine if an item should be accessible
    const isItemAccessible = (item: string) => {
      switch (item) {
        case 'Protein induced':
          return true;
        
        case 'Expressed':
        case 'Gel uploaded':
          return entryData.expressed === true;
        
        case 'Kinetic assay data uploaded':
        case 'Thermostability assay data uploaded':
        case 'Melting point values uploaded':
          return entryData.yield_avg !== null;
        
        default:
          return false;
      }
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
            {checklistItems.map((item, index) => {
              const accessible = isItemAccessible(item);
              
              return (
                <TableRow 
                  key={index} 
                  className={`h-[52px] ${!accessible ? 'opacity-50' : ''}`}
                >
                  <TableCell>
                    <span className={getStatusStyle(item).className}>
                      {getStatusStyle(item).text}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => {
                        if (accessible) {
                          setCurrentView('detail');
                          setSelectedDetail(item);
                        }
                      }}
                      className={`text-left transition-colors duration-200 ${
                        accessible 
                          ? 'hover:text-[#06B7DB]' 
                          : 'cursor-not-allowed'
                      }`}
                      disabled={!accessible}
                    >
                      {item}
                    </button>
                  </TableCell>
                  <TableCell className="text-left font-medium text-gray-600">
                    {renderAdditionalInfo(item)}
                  </TableCell>
                  <TableCell>
                    <div className="relative flex items-center justify-center gap-2">
                      <Tooltip content={accessible ? "Edit" : "Complete prerequisites first"}>
                        <span 
                          className={`text-lg ${
                            accessible 
                              ? 'text-default-400 cursor-pointer active:opacity-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (accessible) {
                              setCurrentView('detail');
                              setSelectedDetail(item);
                            }
                          }}
                        >
                          <EditIcon />
                        </span>
                      </Tooltip>
                      <Tooltip 
                        color="danger" 
                        content={
                          !accessible 
                            ? "Complete prerequisites first"
                            : entryData.curated || entryData.approved_by_pi 
                              ? "Cannot delete after approval" 
                              : "Delete"
                        }
                      >
                        <span 
                          className={`text-lg ${
                            !accessible || entryData.curated || entryData.approved_by_pi
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-danger cursor-pointer active:opacity-50"
                          }`}
                          onClick={() => {
                            if (accessible && !entryData.curated && !entryData.approved_by_pi) {
                              setItemToDelete(item);
                              setShowDeleteItemModal(true);
                            }
                          }}
                        >
                          <DeleteIcon />
                        </span>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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
      'Protein induced',
      'Expressed',
      "Kinetic assay data uploaded",
      "Thermostability assay data uploaded",
      "Melting point values uploaded",
      "Gel uploaded"
    ];

    const currentIndex = checklistItems.indexOf(selectedDetail);
    const prevItem = currentIndex > 0 ? checklistItems[currentIndex - 1] : null;
    const nextItem = currentIndex < checklistItems.length - 1 ? checklistItems[currentIndex + 1] : null;

    const DetailComponent = (() => {
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
    if (!data || !data.resid) return '';
    const variant = data.resid === 'X' ? 'WT' : `${data.resid}${data.resnum}${data.resmut}`;
    return `${variant} BglB`;
  };

  const getBreadcrumbDisplay = (data: any) => {
    if (!data || !data.resid) return '';
    const variant = getVariantDisplay(data);
    return `${variant}`;
  };

  // Add this near the other useMemo hooks
  const isSubmitDisabled = useMemo(() => {
    if (!entryData) return true;
    const status = entryData.curated 
      ? 'Curated'
      : entryData.approved_by_pi
        ? 'Approved by PI'
        : entryData.submitted_for_curation 
          ? 'Pending Approval'
          : 'In Progress';
    return status === 'Pending Approval' || status === 'Approved by PI' || status === 'Curated';
  }, [entryData]);

  const handleCurateApprove = async () => {
    try {
      const response = await fetch('/api/curateData', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: [entryData.id],
          status: user?.status 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedEntry = await response.json();
      setEntryData((prev: any) => ({ ...prev, ...updatedEntry }));
      showToast(
        user?.status === 'ADMIN' ? 'Entry Curated' : 'Entry Approved',
        'The entry has been successfully updated.',
        'success'
      );
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Update Failed', 'Failed to update entry status. Please try again.', 'error');
    }
  };

  // Add the handleRecall function near other handlers
  const handleRecall = async () => {
    try {
      const response = await fetch('/api/updateCharacterizationDataCurated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: entryData.id,
          curated: false 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to recall entry');
      }

      const updatedEntry = await response.json();
      setEntryData((prev: any) => ({ ...prev, ...updatedEntry }));
      showToast('Success', 'Entry has been recalled successfully', 'success');
    } catch (error) {
      console.error('Error recalling entry:', error);
      showToast('Error', 'Failed to recall entry. Please try again.', 'error');
    }
  };

  return (
    <>
      <NavBar />
      <EntryAccessChecker entryData={entryData} loading={loading}>
        <div className="px-3 md:px-4 lg:px-15 py-4 lg:py-10 mb-10 bg-white">
          <div className="max-w-7xl mx-auto">
            {!loading && entryData && (
              <Breadcrumbs className="mb-2">
                <BreadcrumbItem>Home</BreadcrumbItem>
                <BreadcrumbItem>Submit</BreadcrumbItem>
                <BreadcrumbItem>Single Variant</BreadcrumbItem>
                <BreadcrumbItem>{getBreadcrumbDisplay(entryData)}</BreadcrumbItem>
              </Breadcrumbs>
            )}

            <div className="pt-3">
              <div className="flex justify-between items-start mb-4 flex-col sm:flex-row gap-4">
                {!loading && entryData && (
                  <div>
                    <h1 className="text-4xl font-inter dark:text-white mb-2 flex items-center gap-2">
                      {getVariantDisplay(entryData)}
                      <Link
                        href={`/database/BglB_characterization?search=${encodeURIComponent(
                          getVariantDisplay(entryData).replace(' BglB', '').trim()
                        )}`}
                        className="inline-flex items-center hover:text-[#06B7DB]"
                      >
                        <ExternalLink className="w-5 h-5 stroke-[1.5]" />
                      </Link>
                    </h1>
                    <StatusChip
                      status={
                        entryData.curated 
                          ? 'approved'
                          : entryData.approved_by_pi
                            ? 'pi_approved'
                            : entryData.submitted_for_curation 
                              ? 'pending_approval'
                              : 'in_progress'
                      }
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[300px]">
                  {user?.status && 
                   (user.status === 'ADMIN' || user.status === 'professor') && 
                   entryData?.submitted_for_curation === true && 
                   !entryData?.curated && (
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      <button
                        className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors"
                        onClick={handleCurateApprove}
                      >
                        {user.status === 'ADMIN' ? 'Curate' : 'Approve'}
                      </button>

                      <Dropdown>
                        <DropdownTrigger>
                          <button
                            className="w-full px-4 py-2 text-sm font-semibold rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            More Actions
                          </button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="More Options"
                          closeOnSelect={true}
                          selectionMode="single"
                        >
                          <DropdownItem>
                            Mark as &quot;Awaiting Replication&quot;
                          </DropdownItem>
                          <DropdownItem>
                            Mark as &quot;Needs Revision&quot;
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  )}
                  
                  <button
                    className={`px-4 py-2 text-sm font-semibold rounded-xl ${
                      isSubmitDisabled 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#06B7DB] text-white hover:bg-[#05a5c6]'
                    }`}
                    onClick={() => !isSubmitDisabled && setShowSubmitModal(true)}
                    disabled={isSubmitDisabled}
                  >
                    Submit for Review
                  </button>
                  <button
                    className={`px-4 py-2 text-sm border-2 font-semibold rounded-xl transition-colors
                      ${entryData.curated 
                        ? "text-gray-400 border-gray-400 cursor-not-allowed" 
                        : "text-[#E91E63] border-[#E91E63] hover:bg-[#E91E63] hover:text-white"
                      }`}
                    onClick={() => setShowDeleteModal(true)}
                    disabled={entryData.curated}
                  >
                    Delete Profile
                  </button>
                  {user?.status === 'ADMIN' && entryData?.curated && (
                    <button
                      className="col-span-2 px-4 py-2 text-sm font-semibold border-2 rounded-xl transition-colors text-[#E91E63] border-[#E91E63] hover:bg-[#E91E63] hover:text-white"
                      onClick={handleRecall}
                    >
                      Recall
                    </button>
                  )}
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </EntryAccessChecker>

      {/* Toast Notifications */}
      <Toast
        show={toastInfo.show}
        type={toastInfo.type}
        title={toastInfo.title}
        message={toastInfo.message}
        onClose={() => setToastInfo((prev) => ({ ...prev, show: false }))}
      />
      <Toast
        show={showCompletionToast}
        onClose={() => setShowCompletionToast(false)}
        title="All checklist items complete! 🎉"
        message="You can now submit this variant for curation."
        type="success"
        actions={[
          {
            label: 'Submit for Review',
            onClick: () => {
              setShowCompletionToast(false);
              submitForCuration();
            },
            variant: 'primary',
          },
        ]}
      />
      <Toast
        show={showItemCompletionToast !== null}
        onClose={() => setShowItemCompletionToast(null)}
        title={`${showItemCompletionToast || ''} completed!`}
        message="Keep up the great work!"
        type="success"
      />

      {/* Confirmation Modals */}
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
      <ConfirmationModal
        isOpen={showDeleteItemModal}
        onClose={() => {
          setShowDeleteItemModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleItemDelete}
        title="Delete Entry Data"
        message="Are you sure you want to delete data associated with this checklist item? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="danger"
      />
    </>
  );
};

export default SingleVariant;
