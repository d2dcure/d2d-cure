import React, { useState, useEffect } from 'react';
import { Link, Pagination } from "@nextui-org/react";
import "../../app/globals.css";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Checkbox, Select, SelectItem, Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Popover, PopoverTrigger, PopoverContent, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem} from "@nextui-org/react";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { FaFilter, FaInfoCircle } from 'react-icons/fa';

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

  // Define your columns
  const columns = [
    { name: "Variant", uid: "variant" },
    { name: "Yield", uid: "yield" },
    { name: "Km", uid: "km" },
    { name: "Kcat", uid: "kcat" },
    { name: "Kcat/Km", uid: "kcat_km" },
    { name: "T50", uid: "t50" },
    { name: "Tm", uid: "tm" },
    { name: "Rosetta Score", uid: "rosetta" }
  ];

  const resetFilters = () => {
    setSelectedInstitution('');
    setSearchTerm('');
    setShowNonCurated(false);
    setExpandData(false);
  };

  useEffect(() => {
    const fetchInstitutions = async () => {
      const response = await fetch('/api/getInstitutions');
      const data = await response.json();
      const sortedData = data.sort((a:any, b:any) => a.fullname.localeCompare(b.fullname));
      setInstitutions(sortedData);
    };
    const fetchData = async () => {
      const response = await fetch('/api/getCharacterizationData');
      const data = await response.json();
      setCharacterizationData(data);

      // For color coding 
      const WT_row = data.find((row:any) => row.id === 1); 
      if (WT_row) {
        const WT_log_inv_KM = Math.log10(1 / WT_row.KM_avg);
        const WT_log_kcat = Math.log10(WT_row.kcat_avg);
        const WT_log_kcat_over_KM = Math.log10(WT_row.kcat_over_KM);
        const WT_T50 = WT_row.T50;
        const WT_Tm = WT_row.Tm;
        const WT_Rosetta_score = WT_row.Rosetta_score;
  
        setWTValues({
          WT_log_inv_KM,
          WT_log_kcat,
          WT_log_kcat_over_KM,
          WT_T50,
          WT_Tm,
          WT_Rosetta_score
        });
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

  return (
    <>
      <NavBar />
      <div className="px-3 md:px-4 lg:px-15 py-4 lg:py-10 mb-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbItem>Database</BreadcrumbItem>
            <BreadcrumbItem>BglB Characterization</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-3 ">
            <h1 className="mb-4 pb-14 text-4xl md:text-4xl lg:text-4xl font-inter dark:text-white">
              BglB Variant Characterization Data
            </h1>

            {/* New flex container */}
            <div className="flex w-full gap-4 flex-col lg:flex-row">
              {/* Sidebar */}
              <div className="w-full lg:w-1/5">
                {/* Mobile toggle button */}
                <Button
                  className={`lg:hidden w-full flex items-center justify-center gap-2 bg-gray-100 ${isSidebarOpen ? 'mb-4' : '-mb-2'}`}
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <FaInfoCircle className="text-[#06B7DB]" />
                  <span>{isSidebarOpen ? "Hide Information Key" : "Show Information Key"}</span>
                </Button>

                {/* Sidebar content - hidden by default on mobile, shown when toggled */}
                <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
                  <div className="flex pr-0 lg:pr-6 flex-col gap-4">
                    {/* Color Key section */}
                    <div className="mb-6">
                      <h2 className="text-xl font-light mb-2">Color Key</h2>
                      
                      <Link href="#" className="text-[#06B7DB] hover:underline mb-6 block text-sm">
                        View full BglB Sequence {'>'}
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
                      
                      <Link href="#" className="text-[#06B7DB] hover:underline mb-4 block text-sm">
                        How were these data calculated?
                      </Link>
                      
                      <div className="space-y-4 text-gray-600">
                        <div className={`space-y-2 ${!showFullText ? "line-clamp-2" : ""}`}>
                          <p className='text-sm'>
                            For kinetic constants, the table is color-coded by relative log values of 1/KM, kcat, and kcat/KM compared to WT.
                          </p>
                          
                          <p className='text-sm'>
                            log 1/KM is used so that larger values are "better".
                          </p>
                          
                          <p className='text-sm'>
                            For T50 and TM values and Rosetta scores, a linear scale is used.
                          </p>
                          
                          <p className='text-sm'>
                            Variants shaded black expressed (as confirmed by gel electrophoresis and/or yield &gt; 0.1 mg/mL).
                          </p>
                          
                          <p className='text-sm'>
                            Variants marked with an asterisk (*) expressed, but no yield was recorded.
                          </p>
                        </div>
                        
                        <button 
                          onClick={() => setShowFullText(!showFullText)}
                          className="text-gray-600 text-sm hover:underline"
                        >
                          {showFullText ? "Show Less" : "Read More"}
                        </button>
                      </div>

                      <Button 
                        className="mt-6 w-full border-2 border-[#06B7DB] text-sm text-[#06B7DB] bg-white"
                        variant="bordered"
                        size="sm"
                      >
                        Download CSV file
                      </Button>
                    </div>

                    {/* Additional filter options can go here */}
                  </div>
                </div>
              </div>

              {/* Main content area */}
              <div className="w-full lg:w-4/5">
                {/* Search controls above table */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-end">
                    <div className="flex flex-wrap gap-2 items-center w-full sm:max-w-[44%]">
                      <Input
                        isClearable
                        classNames={{
                          base: "w-full sm:w-auto",
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
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Dropdown>
                          <DropdownTrigger className="flex">
                            <Button
                              size="sm"
                              variant="flat"
                              className="w-full sm:w-auto"
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
                        
                        <Dropdown>
                          <DropdownTrigger>
                            <Button 
                              isIconOnly
                              size="sm"
                              variant="flat"
                              className="w-full sm:w-auto"
                            >
                              <FaFilter />
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

                            <DropdownItem className="p-0 mt-2">
                              <div className="flex justify-between">
                                <Button 
                                  size="sm"
                                  variant="bordered" 
                                  onPress={resetFilters}
                                  className="border-[#06B7DB] text-[#06B7DB] text-sm"
                                >
                                  Reset
                                </Button>
                                <Button 
                                  size="sm"
                                  color="primary" 
                                  className="bg-[#06B7DB] text-sm"
                                >
                                  Apply Filters
                                </Button>
                              </div>
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mb-2 items-center">
                    <span className="text-default-400 text-small">
                      {displayData.length} Records Found
                    </span>
                  </div>
                </div>

                {/* Table component */}
                <div >
                  <Table
                    isHeaderSticky
                    aria-label="BglB Variant Characterization Data"
                    classNames={{
                      base: "max-h-[600px] rounded-lg",
                      table: "min-h-[600px] min-w-[800px]",
                      wrapper: "w-full"
                    }}
                  >
                    <TableHeader>
                      <TableColumn>Variant</TableColumn>
                      <TableColumn>Yield</TableColumn>
                      <TableColumn>Km</TableColumn>
                      <TableColumn>Kcat</TableColumn>
                      <TableColumn>Kcat/Km</TableColumn>
                      <TableColumn>T50</TableColumn>
                      <TableColumn>Tm</TableColumn>
                      <TableColumn>Rosetta Score Change</TableColumn>
                    </TableHeader>
                    <TableBody
                      items={paginatedData}
                    >
                      {(data) => (
                        <TableRow key={`${data.resid}${data.resnum}${data.resmut}`}>
                          {/* Variant cell */}
                          <TableCell>
                            {data.isAggregate ? (
                              <span title={`Average of ${data.count} separate experiments. Click to expand`} className="text-xs text-grey" onClick={() => setExpandData(true)} style={{cursor: 'pointer'}}>►</span>
                            ) : ''}  
                            <Page id={data.raw_data_id} wt_id={data.WT_raw_data_id} variant={getVariantDisplay(data.resid, data.resnum, data.resmut)} />
                          </TableCell>
                          
                          {/* Yield cell */}
                          <TableCell>
                            <div style={{ 
                              backgroundColor: data.expressed ? '#D1D5DB' : '#D1D5DB',
                              color: data.expressed ? '#000000' : '#000000',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              textAlign: 'center',
                              width: '40px',         // Smaller width for yield since it has less content
                              margin: '0 auto',
                              display: 'inline-block',
                              minWidth: 'fit-content'
                            }}>
                              {data.yield_avg !== null && !isNaN(data.yield_avg) ? roundTo(data.yield_avg, 2) : data.expressed ? '*' : '—'}
                            </div>
                          </TableCell>

                          {/* KM_avg cell */}
                          <TableCell>
                            <div style={{
                              backgroundColor: getColorForValue(data.KM_avg !== null && !isNaN(data.KM_avg) ? Math.log10(1 / data.KM_avg) - WTValues.WT_log_inv_KM : -5),
                              borderRadius: '4px',
                              padding: '1px 6px',
                              textAlign: 'center',
                              width: '100px',         // Fixed width for consistency
                              margin: '0 auto',
                              display: 'inline-block',
                              minWidth: 'fit-content' // Ensures the div grows if content is larger
                            }}>
                              {data.KM_avg !== null && !isNaN(data.KM_avg) ? `${roundTo(data.KM_avg, 2)} ± ${data.KM_SD !== null && !isNaN(data.KM_SD) ? roundTo(data.KM_SD, 2) : '—'}` : '—'}
                            </div>
                          </TableCell>

                          {/* kcat_avg cell */}
                          <TableCell>
                            <div style={{
                              backgroundColor: getColorForValue(data.kcat_avg !== null && !isNaN(data.kcat_avg) ? Math.log10(data.kcat_avg) - WTValues.WT_log_kcat : -5),
                              borderRadius: '4px',
                              padding: '1px 6px',
                              textAlign: 'center',
                              width: '100px',         // Fixed width for consistency
                              margin: '0 auto',
                              display: 'inline-block',
                              minWidth: 'fit-content' // Ensures the div grows if content is larger
                            }}>
                              {data.kcat_avg !== null && !isNaN(data.kcat_avg) ? `${roundTo(data.kcat_avg, 1)} ± ${data.kcat_SD !== null && !isNaN(data.kcat_SD) ? roundTo(data.kcat_SD, 1) : '—'}` : '—'}
                            </div>
                          </TableCell>

                          {/* kcat_over_KM cell */}
                          <TableCell>
                            <div style={{
                              backgroundColor: getColorForValue(data.kcat_avg !== null && !isNaN(data.kcat_avg) ? Math.log10(data.kcat_avg) - WTValues.WT_log_kcat : -5),
                              borderRadius: '4px',
                              padding: '1px 6px',
                              textAlign: 'center',
                              width: '100px',         // Fixed width for consistency
                              margin: '0 auto',
                              display: 'inline-block',
                              minWidth: 'fit-content' // Ensures the div grows if content is larger
   
                            }}>
                              {data.kcat_over_KM !== null && !isNaN(data.kcat_over_KM) ? `${roundTo(data.kcat_over_KM, 2)} ± ${data.kcat_over_KM_SD !== null && !isNaN(data.kcat_over_KM_SD) ? roundTo(data.kcat_over_KM_SD, 2) : '—'}` : '—'}
                            </div>
                          </TableCell>
                          
                          {/* T50 cell */}
                          <TableCell>
                            <div style={{
                              backgroundColor: getColorForValue(data.kcat_avg !== null && !isNaN(data.kcat_avg) ? Math.log10(data.kcat_avg) - WTValues.WT_log_kcat : -5),
                              borderRadius: '4px',
                              padding: '1px 6px',
                              textAlign: 'center',
                              width: '80px',         // Fixed width for consistency
                              margin: '0 auto',
                              display: 'inline-block',
                              minWidth: 'fit-content' // Ensures the div grows if content is larger
   
                            }}>
                              {data.T50 !== null && !isNaN(data.T50) ? `${roundTo(data.T50, 1)} ± ${data.T50_SD !== null && !isNaN(data.T50_SD) ? roundTo(data.T50_SD, 1) : '—'}` : '—'}
                            </div>
                          </TableCell>
                          
                          {/* Tm cell */}
                          <TableCell>
                            <div style={{
                              backgroundColor: getColorForValue(data.kcat_avg !== null && !isNaN(data.kcat_avg) ? Math.log10(data.kcat_avg) - WTValues.WT_log_kcat : -5),
                              borderRadius: '4px',
                              padding: '1px 6px',
                              textAlign: 'center',
                              width: '80px',         // Fixed width for consistency
                              margin: '0 auto',
                              display: 'inline-block',
                              minWidth: 'fit-content' // Ensures the div grows if content is larger
   
                            }}>
                              {data.Tm !== null && !isNaN(data.Tm) ? `${roundTo(data.Tm, 1)} ± ${data.Tm_SD !== null && !isNaN(data.Tm_SD) ? roundTo(data.Tm_SD, 1) : '—'}` : '—'}
                            </div>
                          </TableCell>

                          {/* Rosetta cell */}
                          <TableCell>
                            <div style={{
                              backgroundColor: getColorForValue(data.kcat_avg !== null && !isNaN(data.kcat_avg) ? Math.log10(data.kcat_avg) - WTValues.WT_log_kcat : -5),
                              borderRadius: '4px',
                              padding: '1px 6px',
                              textAlign: 'center',
                              width: '80px',         // Fixed width for consistency
                              margin: '0 auto',
                              display: 'inline-block',
                              minWidth: 'fit-content' // Ensures the div grows if content is larger
   
                            }}>
                              {data.Rosetta_score !== null && !isNaN(data.Rosetta_score) ? roundTo(data.Rosetta_score, 1) : '—'}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination below table */}
                <div className="py-4 px-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Pagination
                    showControls
                    classNames={{
                      cursor: "bg-foreground text-background",
                      wrapper: "w-full sm:w-auto justify-center",
                    }}
                    color="default"
                    page={page}
                    total={rowsPerPage === 0 ? 1 : Math.ceil(displayData.length / rowsPerPage)}
                    variant="light"
                    onChange={setPage}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-small text-default-400 whitespace-nowrap">Rows per page:</span>
                    <Select
                      size="sm"
                      defaultSelectedKeys={["30"]}
                      className="w-20"
                      onChange={(e) => {
                        const value = e.target.value;
                        // If "all" is selected, set rowsPerPage to displayData.length
                        setRowsPerPage(value === "all" ? displayData.length : Number(value));
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
      <Footer></Footer>
    </>

  );
};

export default DataPage;