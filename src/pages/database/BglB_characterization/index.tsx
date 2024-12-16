import React, { useState, useEffect } from 'react';
import { Link, Pagination } from "@nextui-org/react";
import "../../../app/globals.css";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Checkbox, Select, SelectItem, Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Popover, PopoverTrigger, PopoverContent, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem} from "@nextui-org/react";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { FaFilter, FaInfoCircle, FaArrowUp, FaArrowDown, FaColumns } from 'react-icons/fa';
import { HiChevronRight } from "react-icons/hi";
import { Tooltip } from "@nextui-org/react";
import { ErrorChecker } from '@/components/ErrorChecker';
import { useRouter } from 'next/router';

// Add this interface near the top of the file
interface Institution {
  abbr: string;
  fullname: string;
}

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};



function Page({ id, variant, wt_id}: { id: string, variant:string , wt_id:string}) {
  const link = `/bglb?id=${id}&wt_id=${wt_id}`;
  return <Link href={link}>
    <button className="text-gray-600 hover:text-gray-800">
      {variant}
    </button>
  </Link>;
}

const DataPage = () => {
  const [expandData, setExpandData] = useState(false);
  const [useRosettaNumbering, setUseRosettaNumbering] = useState(false);
  const [sequences, setSequences] = useState<any[]>([]);
  const [showNonCurated, setShowNonCurated] = useState(false); 
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [characterizationData, setCharacterizationData] = useState<any[]>([]); // This holds all the rows in the CharacterizationData table in the BglB database
  const [WTValues, setWTValues] = useState<any>(null);
  const [showColors, setShowColors] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [visibleColumns, setVisibleColumns] = useState(new Set([
    "variant",
    "yield",
    "km",
    "kcat",
    "kcat_km",
    "t50",
    "tm",
    "rosetta"
  ]));
  const [showFullText, setShowFullText] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'top' | 'bottom' | null>(null);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // Define your columns
  const columns = [
    { name: "Variant", uid: "variant", sortable: true },
    { name: "Yield", uid: "yield", sortable: true },
    { name: "Km", uid: "km", sortable: true },
    { name: "Kcat", uid: "kcat", sortable: true },
    { name: "Kcat/Km", uid: "kcat_km", sortable: true },
    { name: "T50", uid: "t50", sortable: true },
    { name: "Tm", uid: "tm", sortable: true },
    { name: "Rosetta Score", uid: "rosetta", sortable: true }
  ];

  const resetFilters = () => {
    setSelectedInstitution('');
    setSearchTerm('');
    setShowNonCurated(false);
    setExpandData(false);
  };

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await fetch('/api/getInstitutions');
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          setIsError(true);
          setErrorMessage("Invalid data format received from server");
          return;
        }
        
        const sortedData = data.sort((a:any, b:any) => a.fullname.localeCompare(b.fullname));
        setInstitutions(sortedData);
      } catch (error) {
        setIsError(true);
        setErrorMessage("Failed to fetch institutions data");
      }
    };
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [institutionsRes, characterizationRes, sequencesRes] = await Promise.all([
          fetch('/api/getInstitutions'),
          fetch('/api/getCharacterizationData'),
          fetch('/api/getSequenceData')
        ]);

        // Check each response individually
        if (!institutionsRes.ok) {
          throw new Error(`GET /api/getInstitutions ${institutionsRes.status} - Failed to fetch institutions`);
        }
        if (!characterizationRes.ok) {
          throw new Error(`GET /api/getCharacterizationData ${characterizationRes.status} - Failed to fetch characterization data`);
        }
        if (!sequencesRes.ok) {
          throw new Error(`GET /api/getSequenceData ${sequencesRes.status} - Failed to fetch sequence data`);
        }

        const [institutionsData, characterizationData, sequencesData] = await Promise.all([
          institutionsRes.json(),
          characterizationRes.json(),
          sequencesRes.json()
        ]);

        // Validate data formats
        if (!Array.isArray(institutionsData)) {
          throw new Error('GET /api/getInstitutions - Invalid data format: Expected array');
        }
        if (!Array.isArray(characterizationData)) {
          throw new Error('GET /api/getCharacterizationData - Invalid data format: Expected array');
        }
        if (!Array.isArray(sequencesData)) {
          throw new Error('GET /api/getSequenceData - Invalid data format: Expected array');
        }

        const sortedInstitutions = institutionsData.sort((a:any, b:any) => 
          a.fullname.localeCompare(b.fullname)
        );
        setInstitutions(sortedInstitutions);
        setCharacterizationData(characterizationData);
        setSequences(sequencesData);

        // For color coding 
        const WT_row = characterizationData.find((row:any) => row.id === 1);
        if (WT_row) {
          setWTValues({
            WT_log_inv_KM: Math.log10(1 / WT_row.KM_avg),
            WT_log_kcat: Math.log10(WT_row.kcat_avg),
            WT_log_kcat_over_KM: Math.log10(WT_row.kcat_over_KM),
            WT_T50: WT_row.T50,
            WT_Tm: WT_row.Tm,
            WT_Rosetta_score: WT_row.Rosetta_score
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    const fetchSequences = async () => {
      const response = await fetch('/api/getSequenceData');
      const data = await response.json();
      setSequences(data);
    };

    fetchSequences();
    fetchInstitutions();
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Show scroll to bottom button only when near the top
      setShowScrollToBottom(window.scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPosition = (position: 'top' | 'bottom') => {
    setIsScrolling(true);
    setScrollDirection(position);
    
    if (position === 'top') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // Find the table element and scroll to show the last few rows
      const tableElement = document.getElementById('characterization-table');
      if (tableElement) {
        const tableBottom = tableElement.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;
        const scrollTarget = window.scrollY + tableBottom - windowHeight + 100;
        
        window.scrollTo({
          top: scrollTarget,
          behavior: 'smooth'
        });
      }
    }

    // Hide notification and reset direction after animation
    setTimeout(() => {
      setIsScrolling(false);
      setScrollDirection(null);
    }, 1000);
  };

  const filteredData = characterizationData
    .filter(data => 
      data.curated || 
      (showNonCurated && !data.curated && data.submitted_for_curation) 
    )
    .filter(data => !selectedInstitution || data.institution === selectedInstitution)
    .filter(data => {
      if (!searchTerm.trim()) return true;
  
      // Determine the correct number to use based on the useRosettaNumbering state
      let numberToCompare = data.resnum.toString(); // Default to Rosetta numbering
  
      if (!useRosettaNumbering) {
        // If Rosetta numbering is off, find the corresponding PDB number
        const sequenceEntry = sequences.find(seq => seq.Rosetta_resnum === data.resnum);
        if (sequenceEntry) {
          numberToCompare = sequenceEntry.PDBresnum.toString();
        }
      }
      // Now compare the correct number with the search term
      return numberToCompare.includes(searchTerm.trim());
    })
    .sort((a, b) => {
      // Convert resnum to numbers for comparison, assuming they are stored as strings
      const resnumA = a.resnum === 'X' ? -1 : parseInt(a.resnum, 10);
      const resnumB = b.resnum === 'X' ? -1 : parseInt(b.resnum, 10);
  
      // First, sort by resnum in ascending order
      if (resnumA !== resnumB) {
        return resnumA - resnumB;
      }
  
      // If resnum is the same, sort by resmut in ascending order
      return a.resmut.localeCompare(b.resmut);
    });

    const getVariantDisplay = (resid: any, resnum: any, resmut: any) => {
      if (resid === 'X') {
        return 'WT';
      }
        
      // You can't just subtract 3 from the rosetta num to get the PBD num. You have to perform the lookup on the Sequence table
      const sequenceEntry = sequences.find(seq => seq.resid === resid && seq.Rosetta_resnum === parseInt(resnum, 10));
      const correctResnum = useRosettaNumbering ? sequenceEntry?.Rosetta_resnum : sequenceEntry?.PDBresnum || resnum;
        
      const variant = `${resid}${correctResnum}${resmut}`;
      return variant;
    };

    const roundTo = (number:number, decPlaces:number) => {
      if (number === null) {
        return null; 
      }
      const factor = Math.pow(10, decPlaces);
      return (Math.round(number * factor) / factor).toFixed(decPlaces);
    };

    const getGroupKey = (data:any) => {
      // This function defines how we collapse the data (in this case, if variant is the same)
      return `${data.resid}${data.resnum}${data.resmut}`;
    };
    
    let displayData = []; // This will be the data we actually render. Needed for averaged/collapsed view
    if (expandData) {
      displayData = filteredData; // Use the data as-is for expanded view
    } else {
      const groupedData:any = {};
      filteredData.forEach(data => {
        const key = getGroupKey(data);
        if (!groupedData[key]) {
          groupedData[key] = []; 
        }
        groupedData[key].push(data);
      });
    
      // NOTE: we are mutating the original data. So if you want to access NON NUMERICAL COLUMNS from here on out (like expressed, which is a boolean), define them here or it won't work 
      displayData = Object.values(groupedData).map((group: any) => {
        const averageRow: any = {
          resid: group[0].resid,
          resnum: group[0].resnum,
          resmut: group[0].resmut,
          isAggregate: group.length > 1,
          count: group.length, 
          expressed: group.some((item: any) => item.expressed)
        };
      
        const sums: any = {};
        const counts: any = {};
      
        group.forEach((item: any) => {
          Object.keys(item).forEach(key => {
            if (typeof item[key] === 'number') {
              if (!sums[key]) {
                sums[key] = 0;
                counts[key] = 0;
              }
              if (item[key] !== null) { 
                sums[key] += item[key];
                counts[key]++;
              }
            }
          });
        });
      
        Object.keys(sums).forEach(key => {
          averageRow[key] = counts[key] > 0 ? sums[key] / counts[key] : null; 
        });
      
        return averageRow;
      });
    }

    const getColorForValue = (value: any) => {
      if (!showColors) return '#FFFFFF';
      
      if (value < -4.75) return '#36929A';
      else if (value < -4.25) return '#4A9DA4';
      else if (value < -3.75) return '#5EA8AE';
      else if (value < -3.25) return '#72B2B8';
      else if (value < -2.75) return '#86BDC2';
      else if (value < -2.25) return '#9AC8CC';
      else if (value < -1.75) return '#AAD3D6';
      else if (value < -1.25) return '#C2DEE0';
      else if (value < -0.75) return '#D7E9EB';
      else if (value < -0.25) return '#EBF4F5';
      else if (value > 0.25 && value <= 0.75) return '#FAC498';
      else if (value > 0.75) return '#F68932';
      else return '#FFFFFF'; 
    };

    // Modify your displayData to use pagination
    const paginatedData = rowsPerPage === 0 
      ? displayData  // Show all records when rowsPerPage is 0
      : displayData.slice(
          (page - 1) * rowsPerPage,
          page * rowsPerPage
        );

  // Replace the scrollToTable function with scrollToTop
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modify the handleTableUpdate function to use scrollToTop
  const handleTableUpdate = (newPage?: number) => {
    if (newPage) setPage(newPage);
    scrollToPosition('top');
  };

  // Add this function near other utility functions
  const downloadCSV = () => {
    // Only include curated data
    const curatedData = characterizationData.filter(data => data.curated);
    
    // Define headers for CSV
    const headers = [
      'Variant',
      'Yield (mg/mL)',
      'KM (mM)',
      'KM SD',
      'kcat (1/s)',
      'kcat SD',
      'kcat/KM (1/mM*s)',
      'T50 (°C)',
      'T50 SD',
      'Tm (°C)',
      'Tm SD',
      'Rosetta Score',
      'Institution'
    ];

    // Transform data into CSV rows
    const csvRows = curatedData.map(data => {
      const variant = getVariantDisplay(data.resid, data.resnum, data.resmut);
      return [
        variant,
        data.yield_avg || '',
        data.KM_avg || '',
        data.KM_SD || '',
        data.kcat_avg || '',
        data.kcat_SD || '',
        data.kcat_over_KM || '',
        data.T50 || '',
        data.T50_SD || '',
        data.Tm || '',
        data.Tm_SD || '',
        data.Rosetta_score || '',
        data.institution || ''
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'BglB_characterization_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ErrorChecker 
      isError={isError} 
      errorMessage={errorMessage}
      errorType="api"
    >
      <NavBar />
      <div className="px-3 md:px-4 lg:px-15 py-4 lg:py-10 mb-10 bg-white">
        {/* Scroll notification - D2D glassmorphism style */}
        {isScrolling && scrollDirection && (
          <div className="fixed top-4 right-4 bg-white/80 backdrop-blur-md border border-gray-200 
            text-gray-600 px-3 py-1.5 rounded-lg shadow-sm z-50 animate-fade-in text-xs">
            Scrolling to {scrollDirection}
          </div>
        )}

        {/* Scroll buttons - D2D glassmorphism style */}
        {showScrollToBottom && (
          <button
            onClick={() => scrollToPosition('bottom')}
            className="fixed bottom-6 right-6 bg-white/80 backdrop-blur-md border border-gray-200 
              text-[#06B7DB] hover:text-[#06B7DB]/80 hover:bg-white/90 
              p-1.5 rounded-lg shadow-sm transition-all z-50 h-7 w-7 
              flex items-center justify-center"
            aria-label="Scroll to bottom"
          >
            <FaArrowDown size={12} />
          </button>
        )}

        {!showScrollToBottom && (
          <button
            onClick={() => scrollToPosition('top')}
            className="fixed bottom-6 right-6 bg-white/80 backdrop-blur-md border border-gray-200 
              text-[#06B7DB] hover:text-[#06B7DB]/80 hover:bg-white/90 
              p-1.5 rounded-lg shadow-sm transition-all z-50 h-7 w-7 
              flex items-center justify-center"
            aria-label="Scroll to top"
          >
            <FaArrowUp size={12} />
          </button>
        )}

        <div className="max-w-7xl mx-auto">
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/database">Database</BreadcrumbItem>
            <BreadcrumbItem>BglB Characterization</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-3">
            <h1 className="mb-4 pb-4 lg:pb-14 text-4xl md:text-4xl lg:text-4xl font-inter dark:text-white">
              BglB Variant Characterization Data
            </h1>

            {/* New flex container */}
            <div className="flex w-full gap-4 flex-col lg:flex-row">
              {/* Sidebar - Make sticky */}
              <div className="w-full lg:w-1/5">
                <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
                  {/* Mobile toggle button - Previous styling */}
                  <Button
                    className={`lg:hidden w-full flex items-center justify-center gap-2 bg-gray-100 ${isSidebarOpen ? 'mb-4' : '-mb-2'}`}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  >
                    <FaInfoCircle className="text-[#06B7DB]" />
                    <span>{isSidebarOpen ? "Hide Information Key" : "Show Information Key"}</span>
                  </Button>

                  {/* Sidebar content */}
                  <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
                    <div className="bg-gray-50 lg:bg-transparent rounded-lg shadow-sm lg:shadow-none pr-6 mb-6">
                      <div className="flex flex-col gap-4">
                        {/* Color Key section */}
                        <div className="mb-6">
                          <h2 className="text-xl font-light mb-2">Color Key</h2>
                          
                          <Link href="#" className="text-[#06B7DB] hover:underline mb-6 block text-sm">
                            View full BglB Sequence
                          </Link>
                          
                          {/* Color gradient bar */}
                          <div className="flex items-center gap-[2px] mb-2">
                            {[
                              '#36929A', '#4A9DA4', '#5EA8AE', '#72B2B8', '#86BDC2', 
                              '#9AC8CC', '#AAD3D6', '#C2DEE0', '#D7E9EB', '#EBF4F5',
                              '#FAC498', '#F68932'
                            ].map((color, index) => (
                              <div 
                                key={index}
                                style={{
                                  backgroundColor: color,
                                  width: '100%',
                                  height: '23px',
                                  borderRadius: '4px'
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* Scale numbers - Updated for better alignment */}
                          <div className="relative w-full h-6 mb-2">
                            {['-5', '-4', '-3', '-2', '-1', '0', '1', '2', '3', '4', '5'].map((number, index) => (
                              <div
                                key={index}
                                className="absolute transform -translate-x-1/2 text-xs"
                                style={{
                                  left: `${(index) * (100 / 10)}%`,
                                  top: 0
                                }}
                              >
                                {number}
                              </div>
                            ))}
                          </div>
                          
                          {/* Labels */}
                          <div className="flex justify-between text-sm text-gray-600 mb-8">
                            <div>Underperform<br/>WT</div>
                            <div className="text-right">Outperform<br/>WT</div>
                          </div>
                        </div>

                        {/* Variant Analysis section */}
                        <div className="mb-6">
                          <h2 className="text-xl font-light mb-2">Variant Analysis</h2>
                          
                          <Link href="https://drive.google.com/file/d/1XPG4w6FJ39NvvSYzZtZu9nnQaG2__ApX/view?usp=sharing" target="_blank" className="text-[#06B7DB] hover:underline mb-4 block text-sm">
                            How is the data calculated?
                          </Link>
                          
                          <div className="text-gray-600">
                            <div className={`space-y-2 ${!showFullText ? "line-clamp-2" : ""}`}>
                              <div className="text-sm space-y-3">
                                <p>
                                  For kinetic constants, the table is color-coded by relative log values of 1/KM, kcat, and kcat/KM compared to WT.
                                  {!showFullText && "..."}
                                </p>
                                
                                {showFullText && (
                                  <>
                                    <p>
                                      log 1/KM is used so that larger values are &quot;better&quot;.
                                    </p>
                                    
                                    <p>
                                      For T50 and TM values and Rosetta scores, a linear scale is used.
                                    </p>
                                    
                                    <p>
                                      Variants shaded black expressed (as confirmed by gel electrophoresis and/or yield &gt; 0.1 mg/mL).
                                    </p>
                                    
                                    <p>
                                      Variants marked with an asterisk (*) expressed, but no yield was recorded.
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => setShowFullText(!showFullText)}
                              className="text-gray-600 hover:underline text-sm mt-1"
                            >
                              {showFullText ? "Show Less ↑" : "Read More ↓"}
                            </button>
                          </div>

                          <Button 
                            className="mt-6 w-full border-2 border-[#06B7DB] text-sm text-[#06B7DB]"
                            variant="bordered"
                            size="sm"
                            onClick={downloadCSV}
                          >
                            Download CSV file
                          </Button>
                        </div>

                        {/* Additional filter options can go here */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content area */}
              <div className="w-full lg:w-4/5">
                <div className="flex flex-col gap-4">
                  {/* Search, filter, and records count row */}
                  <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                    {/* Left side - Search and controls */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Input
                        isClearable
                        classNames={{
                          base: "w-full sm:w-[200px] md:w-[300px]",
                        }}
                        placeholder="Search for residue number..."
                        size="sm"
                        value={searchTerm}
                        onClear={() => setSearchTerm("")}
                        onValueChange={(value) => setSearchTerm(value)}
                        startContent={
                          <svg 
                            aria-hidden="true" 
                            fill="none" 
                            focusable="false" 
                            height="1em" 
                            stroke="currentColor" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            viewBox="0 0 24 24" 
                            width="1em"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" x2="16.65" y1="21" y2="16.65" />
                          </svg>
                        }
                      />
                      
                      {/* Controls container - half-half layout */}
                      <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                        {/* Columns dropdown */}
                        <Dropdown 
                          className="w-full" 
                          shouldBlockScroll={false} 
                          shouldCloseOnInteractOutside={() => false}
                        >
                          <DropdownTrigger>
                            <Button 
                              size="sm"
                              variant="flat"
                              className="w-full"
                              startContent={<FaColumns className="text-small" />}
                            >
                              Columns
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            disallowEmptySelection
                            aria-label="Table Columns"
                            closeOnSelect={false}
                            selectedKeys={visibleColumns}
                            selectionMode="multiple"
                            onSelectionChange={(keys) => setVisibleColumns(new Set(Array.from(keys).map(String)))}
                          >
                            {columns.map((column) => (
                              <DropdownItem key={column.uid} className="capitalize">
                                {capitalize(column.name)}
                              </DropdownItem>
                            ))}
                          </DropdownMenu>
                        </Dropdown>

                        {/* Filter dropdown */}
                        <Dropdown 
                          className="w-full" 
                          shouldBlockScroll={false} 
                          shouldCloseOnInteractOutside={() => false}
                        >
                          <DropdownTrigger>
                            <Button 
                              size="sm"
                              variant="flat"
                              className="w-full"
                              startContent={<FaFilter className="text-small" />}
                            >
                              Filters
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu 
                            aria-label="Filter options"
                            className="w-[240px] p-3"
                            itemClasses={{
                              base: [
                                "rounded-md",
                                "text-gray-700",
                                "transition-opacity",
                                "data-[hover=true]:bg-transparent",
                                "data-[hover=true]:text-gray-900",
                                "data-[selected=true]:bg-transparent",
                                "data-[selected=true]:text-gray-900",
                                "data-[disabled=true]:text-gray-400",
                                "border-none",
                                "text-sm",
                                "py-2"
                              ].join(" ")
                            }}
                            variant="flat"
                            closeOnSelect={false}
                          >
                            {/* Display Options */}
                            <DropdownItem className="p-0 mb-2">
                              <div className="space-y-1">
                                <h3 className="text-sm font-medium mb-1">Display Options</h3>
                                <Checkbox 
                                  size="sm"
                                  isSelected={showColors}
                                  onValueChange={setShowColors}
                                  classNames={{
                                    label: "text-sm"
                                  }}
                                >
                                  Show color coding
                                </Checkbox>
                                <Checkbox
                                  size="sm"
                                  isSelected={useRosettaNumbering}
                                  onValueChange={setUseRosettaNumbering}
                                  classNames={{
                                    label: "text-sm"
                                  }}
                                >
                                  Use Rosetta/Foldit numbering
                                </Checkbox>
                              </div>
                            </DropdownItem>

                            <DropdownItem className="p-0 mb-2">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Institution</span>
                                  <Button 
                                    size="sm" 
                                    variant="light" 
                                    className="text-blue-500 text-sm"
                                    onPress={() => setSelectedInstitution('')}
                                  >
                                    Clear
                                  </Button>
                                </div>
                                <Select
                                  size="sm"
                                  placeholder="All"
                                  selectedKeys={selectedInstitution ? [selectedInstitution] : []}
                                  onChange={(e) => setSelectedInstitution(e.target.value)}
                                  className="w-full text-sm"
                                >
                                  {[
                                    <SelectItem key="" value="">All</SelectItem>,
                                    ...institutions.map((institution: Institution) => (
                                      <SelectItem 
                                        key={institution.abbr} 
                                        value={institution.abbr}
                                      >
                                        {institution.fullname || institution.abbr}
                                      </SelectItem>
                                    ))
                                  ]}
                                </Select>
                              </div>
                            </DropdownItem>

                            <DropdownItem className="p-0 mb-2">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Non-Curated Data</span>
                                  <Button 
                                    size="sm" 
                                    variant="light" 
                                    className="text-blue-500 text-sm"
                                    onPress={() => setShowNonCurated(false)}
                                  >
                                    Clear
                                  </Button>
                                </div>
                                <Select
                                  size="sm"
                                  placeholder="Included"
                                  selectedKeys={[showNonCurated ? "included" : "excluded"]}
                                  onChange={(e) => setShowNonCurated(e.target.value === "included")}
                                  className="w-full text-sm"
                                >
                                  <SelectItem key="included" value="included">Included</SelectItem>
                                  <SelectItem key="excluded" value="excluded">Excluded</SelectItem>
                                </Select>
                              </div>
                            </DropdownItem>

                            <DropdownItem className="p-0 mb-4">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Overall Data</span>
                                  <Button 
                                    size="sm" 
                                    variant="light" 
                                    className="text-blue-500 text-sm"
                                    onPress={() => setExpandData(false)}
                                  >
                                    Clear
                                  </Button>
                                </div>
                                <Select
                                  size="sm"
                                  placeholder="Only Averages"
                                  selectedKeys={[expandData ? "all" : "averages"]}
                                  onChange={(e) => setExpandData(e.target.value === "all")}
                                  className="w-full text-sm"
                                >
                                  <SelectItem key="averages" value="averages">Only Averages</SelectItem>
                                  <SelectItem key="all" value="all">All Data</SelectItem>
                                </Select>
                              </div>
                            </DropdownItem>

                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>

                    {/* Right side - Total records */}
                    <div className="flex items-center justify-end sm:justify-start text-sm">
                      <span className="text-default-400">
                        Total {displayData.length} records
                      </span>
                    </div>
                  </div>

                  {/* Add id to table for scrolling */}
                  <div id="characterization-table">
                    <Table
                      isHeaderSticky
                      aria-label="BglB Variant Characterization Data"
                      classNames={{
                        th: "text-default-500 bg-default-100/50 font-medium py-3 px-4",
                        tr: "hover:bg-default-100/50 hover:cursor-pointer hover:shadow-sm  hover:rounded-lg", // Subtle hover effect
                      }}
                    >
                      <TableHeader>
                        {columns
                          .filter(column => visibleColumns.has(column.uid))
                          .map(column => (
                            <TableColumn key={column.uid}>
                              {column.name}
                            </TableColumn>
                          ))}
                      </TableHeader>
                      <TableBody items={paginatedData}>
                        {(data) => (
                          <TableRow 
                            key={`${data.resid}${data.resnum}${data.resmut}`}
                            className={expandData ? "cursor-pointer hover:bg-default-100/50" : ""}
                            onClick={() => {
                              if (expandData) {
                                router.push(`/database/BglB_characterization/${data.id}`);
                              }
                            }}
                          >
                            {columns
                              .filter(column => visibleColumns.has(column.uid))
                              .map(column => {
                                let cell;
                                switch (column.uid) {
                                  case "variant":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <span className={expandData ? "text-[#06B7DB]" : ""}>
                                          {getVariantDisplay(data.resid, data.resnum, data.resmut)}
                                        </span>
                                        {data.isAggregate && (
                                          <span 
                                            title={`Average of ${data.count} separate experiments. Click to expand`} 
                                            className="inline-flex items-center justify-center text-gray-500 hover:text-gray-700 cursor-pointer ml-1" 
                                            onClick={(e) => {
                                              e.stopPropagation(); // Prevent row click
                                              setExpandData(true);
                                            }}
                                          >
                                            <HiChevronRight className="w-4 h-4 -ml-1 translate-y-[1px]" />
                                          </span>
                                        )}
                                      </TableCell>
                                    );
                                    break;
                                  case "yield":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{ 
                                          backgroundColor: data.expressed ? '#D1D5DB' : '#D1D5DB',
                                          color: data.expressed ? '#000000' : '#000000',
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'center',
                                          width: '40px',
                                          margin: '0 auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.yield_avg !== null && !isNaN(data.yield_avg) ? roundTo(data.yield_avg, 2) : data.expressed ? '*' : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "km":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{
                                          backgroundColor: getColorForValue(data.KM_avg !== null && !isNaN(data.KM_avg) ? Math.log10(1 / data.KM_avg) - WTValues.WT_log_inv_KM : -5),
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'center',
                                          width: '100px',
                                          margin: '0 auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.KM_avg !== null && !isNaN(data.KM_avg) ? `${roundTo(data.KM_avg, 2)} ± ${data.KM_SD !== null && !isNaN(data.KM_SD) ? roundTo(data.KM_SD, 2) : '—'}` : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "kcat":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{
                                          backgroundColor: getColorForValue(data.kcat_avg !== null && !isNaN(data.kcat_avg) ? Math.log10(data.kcat_avg) - WTValues.WT_log_kcat : -5),
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'center',
                                          width: '100px',
                                          margin: '0 auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.kcat_avg !== null && !isNaN(data.kcat_avg) ? `${roundTo(data.kcat_avg, 2)} ± ${data.kcat_SD !== null && !isNaN(data.kcat_SD) ? roundTo(data.kcat_SD, 2) : '—'}` : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "kcat_km":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{
                                          backgroundColor: getColorForValue(data.kcat_over_KM !== null && !isNaN(data.kcat_over_KM) ? Math.log10(data.kcat_over_KM) - WTValues.WT_log_kcat_over_KM : -5),
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'center',
                                          width: '100px',
                                          margin: '0 auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.kcat_over_KM !== null && !isNaN(data.kcat_over_KM) ? roundTo(data.kcat_over_KM, 2) : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "t50":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{
                                          backgroundColor: getColorForValue(data.T50 !== null && !isNaN(data.T50) ? (data.T50 - WTValues.WT_T50) / WTValues.WT_T50 : -5),
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'center',
                                          width: '100px',
                                          margin: '0 auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.T50 !== null && !isNaN(data.T50) ? `${roundTo(data.T50, 2)} ± ${data.T50_SD !== null && !isNaN(data.T50_SD) ? roundTo(data.T50_SD, 2) : '—'}` : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "tm":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{
                                          backgroundColor: getColorForValue(data.Tm !== null && !isNaN(data.Tm) ? (data.Tm - WTValues.WT_Tm) / WTValues.WT_Tm : -5),
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'center',
                                          width: '100px',
                                          margin: '0 auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.Tm !== null && !isNaN(data.Tm) ? `${roundTo(data.Tm, 2)} ± ${data.Tm_SD !== null && !isNaN(data.Tm_SD) ? roundTo(data.Tm_SD, 2) : ''}` : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "rosetta":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{
                                          backgroundColor: getColorForValue(data.Rosetta_score !== null && !isNaN(data.Rosetta_score) ? (data.Rosetta_score - WTValues.WT_Rosetta_score) / Math.abs(WTValues.WT_Rosetta_score) : -5),
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'center',
                                          width: '100px',
                                          margin: '0 auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.Rosetta_score !== null && !isNaN(data.Rosetta_score) ? roundTo(data.Rosetta_score, 2) : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  default:
                                    cell = <TableCell key={column.uid}>—</TableCell>;
                                }
                                return cell;
                              })}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {isLoading && (
                    <div className="flex justify-center items-center py-8">
                      <Spinner 
                        size="lg"
                        classNames={{
                          circle1: "border-b-[#06B7DB]",
                          circle2: "border-b-[#06B7DB]"
                        }}
                      />
                    </div>
                  )}

                  {/* Bottom pagination with rows selector */}
                  <div className="py-4 px-2 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-2">
                    {/* Pagination */}
                    <Pagination
                      showControls
                      classNames={{
                        cursor: "bg-[#06B7DB] text-white font-medium",
                        wrapper: "justify-center gap-1 sm:gap-2",
                        item: "w-8 h-8 sm:w-9 sm:h-9 text-sm",
                        next: "w-8 h-8 sm:w-9 sm:h-9 bg-default-100/50",
                        prev: "w-8 h-8 sm:w-9 sm:h-9 bg-default-100/50",
                      }}
                      color="default"
                      page={page}
                      total={rowsPerPage === 0 ? 1 : Math.ceil(displayData.length / rowsPerPage)}
                      variant="light"
                      onChange={handleTableUpdate}
                    />

                    {/* Rows per page selector */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-default-400 hidden sm:inline">Rows per page:</span>
                      <span className="text-default-400 sm:hidden">Per page:</span>
                      <Select
                        size="sm"
                        defaultSelectedKeys={["30"]}
                        className="w-20 sm:w-24"
                        onChange={(e) => {
                          const value = e.target.value;
                          setRowsPerPage(value === "all" ? displayData.length : Number(value));
                          setPage(1);
                          scrollToPosition('top');
                        }}
                      >
                        <SelectItem key="20" value="20">20</SelectItem>
                        <SelectItem key="30" value="30">30</SelectItem>
                        <SelectItem key="50" value="50">50</SelectItem>
                        <SelectItem key="all" value="all">All</SelectItem>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </ErrorChecker>
  );
};

export default DataPage;