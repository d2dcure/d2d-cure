import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, Pagination } from "@nextui-org/react";
import "../../../../app/globals.css";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Checkbox, Select, SelectItem, Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Popover, PopoverTrigger, PopoverContent, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem} from "@nextui-org/react";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { FaFilter, FaInfoCircle, FaArrowUp, FaArrowDown, FaColumns, FaShareAlt } from 'react-icons/fa';
import { HiChevronRight } from "react-icons/hi";
import { Tooltip } from "@nextui-org/react";
import { ErrorChecker } from '@/components/ErrorChecker';
import { useRouter } from 'next/router';


// Interfaces /////////////////////////////////////////////////////////////////
interface Institution {
  abbr: string;
  fullname: string;
}

interface ExpandedRows {
  [key: string]: boolean;
}

interface SortDescriptor {
  column: string;
  direction: "ascending" | "descending";
}


// Functions //////////////////////////////////////////////////////////////////
const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Calculate the relative deviation of two values and return as percentage.
const calculateRelativeDeviation = (value: number, ref: number): number => {
  const deviation = value - ref;
  const relDeviation = deviation / ref;
  return relDeviation * 100;  // as percentage
};


const DataPage = () => {
  const [expandData, setExpandData] = useState(false);
  const [useRosettaNumbering, setUseRosettaNumbering] = useState(true);
  const [sequences, setSequences] = useState<any[]>([]);
  const [showNonCurated, setShowNonCurated] = useState(false); 
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [characterizationData, setCharacterizationData] = useState<any[]>([]); // This holds all the rows in the CharacterizationData table in the database
  const [WTValues, setWTValues] = useState<any>(null);
  const [showColors, setShowColors] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState(new Set([
    "variant",
    "yield",
    "km",
    //"km_dev_from_ref",
    "kcat",
    //"kcat_dev_from_ref",
    "kcat_km",
    //"kcat_km_dev_from_ref",
    "t50",
    //"t50_dev_from_ref",
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
  const { enzyme, highlight } = router.query;

  // Add this new state for tracking expanded rows
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({});

  // Add this to your state declarations at the top of the DataPage component
  const [lastClickedRowId, setLastClickedRowId] = useState<string | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Add this new state for sorting
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "variant",
    direction: "ascending"
  });

  // Add this new ref to track URL-sourced updates
  const sortFromUrl = useRef(false);

  // Add this new state for publications
  const [publications, setPublications] = useState<any[]>([]);

  // Add this useEffect to load the last clicked row from localStorage when the component mounts
  useEffect(() => {
    const savedLastClickedRow = localStorage.getItem('lastClickedRow');
    if (savedLastClickedRow) {
      setLastClickedRowId(savedLastClickedRow);
    }
  }, []);

  // Update the scrolling effect
  useEffect(() => {
    if (highlight && characterizationData.length > 0) {
      // Find all rows that match the highlighted residue number
      const matchingRows = characterizationData.filter(
        item => item.resnum === parseInt(highlight as string)
      );

      if (matchingRows.length > 0) {
        // Try to find either the grouped row or individual row
        const resid = matchingRows[0].resid;
        const resnum = matchingRows[0].resnum;
        
        // Try different possible row IDs
        const possibleElements = [
          document.getElementById(`row-${matchingRows[0].id}`), // Individual row
          document.getElementById(`group-${resid}${resnum}`),   // Grouped row
          document.querySelector(`[data-resnum="${resnum}"]`)   // Fallback using data attribute
        ];

        // Use the first element that exists
        const element = possibleElements.find(el => el !== null);
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-blue-100');
          setTimeout(() => {
            element.classList.remove('bg-blue-100');
          }, 2000);
        }
      }
    }
  }, [highlight, characterizationData]);

  // Add this effect to clear highlights on page load/refresh
  useEffect(() => {
    // Clear any existing highlights
    const highlightedElements = document.querySelectorAll('.bg-blue-100');
    highlightedElements.forEach(element => {
      element.classList.remove('bg-blue-100');
    });

    // Clear the last clicked row from localStorage
    localStorage.removeItem('lastClickedRow');
    setLastClickedRowId(null);
    setHighlightedRowId(null);
  }, []); // Empty dependency array means this runs once on mount

  // Define your columns
  const columns = [
    { 
      name: "Variant", 
      uid: "variant", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>The variant name in Rosetta/Foldit numbering.</p>
              <p>Click here to sort by this column.</p>
              <p>Click any colored variant name/code to open a new window and view the raw data for that variant.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help">
            Variant
          </div>
        </Tooltip>
      )
    },
    { 
      name: "Yield", 
      uid: "yield", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>Yield is reported as concentration of enzyme after purification, as determined by spectrophotometry assay.</p>
              <p>Cells shaded grey indicate expression, as confirmed by gel electrophoresis and/or yield &gt; 0.1 mg/mL.</p>
              <p>Variants marked with an asterisk (*) expressed, but no yield was recorded.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            Yield,<br/><i>c</i><sub>E</sub> (mg/mL)
          </div>
        </Tooltip>
      )
    },
    { 
      name: "KM", 
      uid: "km", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>The Michaelis constant.</p>
              <p>It represents the molarity of substrate for which the reaction rate is half of its maximal value. It is an indication of how well an enzyme binds to a substrate, with lower values corresponding to tighter binding.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            <i>K</i><sub>M</sub> (mᴍ)
          </div>
        </Tooltip>
      )
    },
    {
      name: "KM relative deviation from reference WT", 
      uid: "km_dev_from_ref", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>Relative deviation from reference <i>K</i><sub>M</sub>.</p>
              <p>This percentage represents the relative deviation of this variant&rsquo;s <i>K</i><sub>M</sub> from that of the WT enzyme used as a reference for this assay.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            <i>d</i><sub><i>K</i><sub>M</sub></sub>
          </div>
        </Tooltip>
      )
    },
    { 
      name: "kcat", 
      uid: "kcat", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>The catalytic rate constant, a.k.a. &ldquo;turnover number&rdquo;.</p>
              <p>It gives the number of substrate molecules turned over into product by a single enzyme molecule in a given unit of time. It is thus an indication of how good the enzyme is at performing the reaction, with bigger values corresponding to faster enzymes.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            <i>k</i><sub>cat</sub> (min<sup>−1</sup>)
          </div>
        </Tooltip>
      )
    },
    {
      name: "Kcat relative deviation from reference WT", 
      uid: "kcat_dev_from_ref", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>Relative deviation from reference <i>k</i><sub>cat</sub>.</p>
              <p>This percentage represents the relative deviation of this variant&rsquo;s <i>k</i><sub>cat</sub> from that of the WT enzyme used as a reference for this assay.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            <i>d</i><sub><i>k</i><sub>cat</sub></sub>
          </div>
        </Tooltip>
      )
    },
    { 
      name: "kcat/KM", 
      uid: "kcat_km", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>The specificity constant, a.k.a. &ldquo;kinetic efficiency&rdquo;.</p>
              <p>It is an indicator of how efficient the enzyme is. Enzymes with a high specificity constant are efficient at what they do; they have a good balance of binding substrates and turning them over quickly.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            <i>k</i><sub>cat</sub>/<i>K</i><sub>M</sub> (mᴍ<sup>−1</sup>min<sup>−1</sup>)
          </div>
        </Tooltip>
      )
    },
    {
      name: "kcat/KM relative deviation from reference WT", 
      uid: "kcat_km_dev_from_ref", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>Relative deviation from reference <i>k</i><sub>cat</sub>/<i>K</i><sub>M</sub>.</p>
              <p>This percentage represents the relative deviation of this variant&rsquo;s <i>k</i><sub>cat</sub>/<i>K</i><sub>M</sub> from that of the WT enzyme used as a reference for this assay.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            <i>d</i><sub><i>k</i><sub>cat</sub>/<i>K</i><sub>M</sub></sub>
          </div>
        </Tooltip>
      )
    },
    { 
      name: "T50", 
      uid: "t50", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>The temperature at which the enzyme has 50% activity.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            <i>T</i><sub>50</sub> (°C)
          </div>
        </Tooltip>
      )
    },
    {
      name: "T50 relative deviation from reference WT", 
      uid: "t50_dev_from_ref", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>Relative deviation from reference <i>T</i><sub>50</sub>.</p>
              <p>This percentage represents the relative deviation of this variant&rsquo;s <i>T</i><sub>50</sub> from that of the WT enzyme used as a reference for this assay.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            <i>d</i><sub><i>T</i><sub>50</sub></sub>
          </div>
        </Tooltip>
      )
    },
    { 
      name: "Tm", 
      uid: "tm", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>The temperature at which the enzyme melts.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            <i>T</i><sub>m</sub> (°C)
          </div>
        </Tooltip>
      )
    },
    { 
      name: "Rosetta score change", 
      uid: "rosetta", 
      sortable: true,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>The change in Rosetta score between the WT and variant, as provided by Foldit.</p>
              <p>This score is a relative representation of the stability of a chemical structure, with lower values being more stable.</p>
              <p>Click here to sort by this column.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help text-right">
            Rosetta<br/>score change
          </div>
        </Tooltip>
      )
    },
    { 
      name: "References", 
      uid: "refs", 
      sortable: false,
      renderHeader: () => (
        <Tooltip 
          content={
            <div className="space-y-2">
              <p>Relevant publications for this variant.</p>
            </div>
          }
          className="max-w-xs bg-white/80 backdrop-blur-sm"
          classNames={{
            base: "py-3 px-6 shadow-sm",
            content: "text-[11px] text-gray-600"
          }}
          placement="bottom"
        >
          <div className="cursor-help">
            Refs
          </div>
        </Tooltip>
      )
    }
  ];

  const resetFilters = () => {
    setSelectedInstitution('');
    setSearchTerm('');
    setShowNonCurated(false);
    setExpandData(false);
    setUseRosettaNumbering(true);
    setShowColors(true);
    setSortDescriptor({
      column: "variant",
      direction: "ascending"
    });
    setRowsPerPage(0); // "all"
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
        const [institutionsRes, characterizationRes, sequencesRes, publicationsRes] = await Promise.all([
          fetch('/api/getInstitutions'),
          fetch('/api/getCharacterizationData'),
          fetch('/api/getSequenceData?enzyme=BglB'),  // TEMP
          fetch('/api/getPublications')
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
        if (!publicationsRes.ok) {
          throw new Error(`GET /api/getPublications ${publicationsRes.status} - Failed to fetch publications`);
        }

        const [institutionsData, characterizationData, sequencesData, publicationsData] = await Promise.all([
          institutionsRes.json(),
          characterizationRes.json(),
          sequencesRes.json(),
          publicationsRes.json()
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
        if (!Array.isArray(publicationsData)) {
          throw new Error('GET /api/getPublications - Invalid data format: Expected array');
        }

        const sortedInstitutions = institutionsData.sort((a:any, b:any) => 
          a.fullname.localeCompare(b.fullname)
        );
        setInstitutions(sortedInstitutions);
        setCharacterizationData(characterizationData);
        setSequences(sequencesData);
        setPublications(publicationsData);

        // For color coding 
        const WT_row = characterizationData.find((row:any) => row.id === 1);
        if (WT_row) {
          setWTValues({
            //WT_KM: WT_row.KM_avg,
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
      const response = await fetch('/api/getSequenceData?enzyme=BglB');  //TEMP
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

  // Modify the filteredData useMemo to include sorting
  const filteredData = useMemo(() => {
    let data = characterizationData
      .filter(data => 
        data.curated || 
        (showNonCurated && !data.curated && data.submitted_for_curation)
      )
      .filter(data => !selectedInstitution || data.institution === selectedInstitution);

    // Apply sorting if a column is selected
    if (sortDescriptor.column) {
      data = [...data].sort((a, b) => {
        let aValue, bValue;

        switch (sortDescriptor.column) {
          case "variant":
            // Sort by resnum
            aValue = parseInt(a.resnum) || 0;
            bValue = parseInt(b.resnum) || 0;
            break;
          case "yield":
            aValue = a.yield_avg || 0;
            bValue = b.yield_avg || 0;
            break;
          case "km":
            aValue = a.KM_avg || 0;
            bValue = b.KM_avg || 0;
            break;
          case "km_dev_from_ref":
            aValue = a.KM_ref ? calculateRelativeDeviation(a.KM_avg, a.KM_ref) : 0;
            bValue = b.KM_ref ? calculateRelativeDeviation(b.KM_avg, b.KM_ref) : 0;
            break;
          case "kcat":
            aValue = a.kcat_avg || 0;
            bValue = b.kcat_avg || 0;
            break;
          case "kcat_dev_from_ref":
            aValue = a.kcat_ref ? calculateRelativeDeviation(a.kcat_avg, a.kcat_ref) : 0;
            bValue = b.kcat_ref ? calculateRelativeDeviation(b.kcat_avg, b.kcat_ref) : 0;
            break;
          case "kcat_km":
            aValue = a.kcat_over_KM || 0;
            bValue = b.kcat_over_KM || 0;
            break;
          case "kcat_km_dev_from_ref":
            aValue = a.kcat_over_KM_ref ? calculateRelativeDeviation(a.kcat_over_KM, a.kcat_over_KM_ref) : 0;
            bValue = b.kcat_over_KM_ref ? calculateRelativeDeviation(b.kcat_over_KM, b.kcat_over_KM_ref) : 0;
            break;
          case "t50":
            aValue = a.T50 || 0;
            bValue = b.T50 || 0;
            break;
          case "t50_dev_from_ref":
            aValue = a.T50_ref ? calculateRelativeDeviation(a.T50, a.T50_ref) : 0;
            bValue = b.T50_ref ? calculateRelativeDeviation(b.T50, b.T50_ref) : 0;
            break;
          case "tm":
            aValue = a.Tm || 0;
            bValue = b.Tm || 0;
            break;
          case "rosetta":
            aValue = a.Rosetta_score || 0;
            bValue = b.Rosetta_score || 0;
            break;
          default:
            return 0;
        }

        const compareResult = aValue - bValue;
        return sortDescriptor.direction === "ascending" ? compareResult : -compareResult;
      });
    }

    return data;
  }, [
    characterizationData,
    showNonCurated,
    selectedInstitution,
    sortDescriptor // Add this dependency
  ]);

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
    
    let displayData = [];
    if (expandData) {
      displayData = filteredData;
    } else {
      const groupedData: any = {};
      filteredData.forEach(data => {
        const key = getGroupKey(data);
        if (!groupedData[key]) {
          groupedData[key] = [];
        }
        groupedData[key].push(data);
      });

      // Create display data with nested structure
      Object.entries(groupedData).forEach(([key, group]: [string, any]) => {
        const averageRow: any = {
          resid: group[0].resid,
          resnum: group[0].resnum,
          resmut: group[0].resmut,
          isAggregate: group.length > 1,
          count: group.length,
          expressed: group.some((item: any) => item.expressed),
          groupKey: key, // Add groupKey for tracking expansion
          children: group // Store original rows as children
        };

        // Calculate averages as before
        const sums: Record<string, number> = {};
        const counts: Record<string, number> = {};
        
      group.forEach((item: any) => {
        Object.keys(item).forEach(k => {
          if (typeof item[k] === 'number' && item[k] !== null && !isNaN(item[k])) {
            if (!sums.hasOwnProperty(k)) {
              sums[k] = 0;
              counts[k] = 0;
            }
            sums[k] += item[k];
            counts[k] += 1;
          }
        });
      });

        Object.keys(sums).forEach(key => {
          averageRow[key] = counts[key] > 0 ? sums[key] / counts[key] : null;
        });

        displayData.push(averageRow);
        
        // Add child rows if this group is expanded
        if (expandedRows[key]) {
          group.forEach((childRow: any) => {
            childRow.isChild = true; // Mark as child row for styling
            displayData.push(childRow);
          });
        }
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

  const downloadCSV = () => {
    // Generate a .csv file for download, based on current filter selections.

	  // TODO: Fix this duplicated code from above.
	  const filteredData = characterizationData
      .filter(data => 
        data.curated || 
        (showNonCurated && !data.curated && data.submitted_for_curation)
      )
      .filter(data => !selectedInstitution || data.institution === selectedInstitution);
	    
    // Sort data by resnum (not resid)
	  const sortedData = [...filteredData].sort((a, b) => {
      // First, handle the WT (resid == 'X') cases
      if (a.resid === 'X' && b.resid !== 'X') return -1;
      if (a.resid !== 'X' && b.resid === 'X') return 1;
      
      // If both are WT or neither is WT, sort numerically by resnum
      return parseInt(a.resnum) - parseInt(b.resnum);
    });
    
    // Define headers for CSV with plain text alternatives for special characters
    const headers = [
	    'ID #',
      'Variant',
      'Induced?',
      'Expressed?',
      'Yield (mg/mL)',
      'KM (mM)',
      'KM SD',
      'reference KM',
      'kcat (1/min)',
      'kcat SD',
      'reference kcat',
      'kcat/KM (1/(mM min))',
      'kcat/KM SD',
      'reference kcat/KM',
      'T50 (degrees C)',  // Changed from °C
      'T50 SD',
      'reference T50',
      'Tm (degrees C)',  // Changed from °C
      'Tm SD',
      'Rosetta score change',
      'Institution',
	    'Created by',
      'Date created',
      'Date submitted',
	    'Curated?',
    ];

    // Transform data into CSV rows
    const csvRows = sortedData.map(data => {
      const variant = getVariantDisplay(data.resid, data.resnum, data.resmut);
      return [
		    data.id,
        variant,
		    'data not transfered from old site',  // TODO: Fix when databases are re-synced
        data.expressed ? 'yes' : 'no',
        (data.yield_avg !== null && !isNaN(data.yield_avg)) ? data.yield_avg : (data.expressed ? 'not reported' : ''),
        data.KM_avg || '',
        data.KM_SD || '',
        data.KM_ref || '',
        data.kcat_avg || '',
        data.kcat_SD || '',
        data.kcat_ref || '',
        data.kcat_over_KM || '',
        data.kcat_over_KM_SD || '',
        data.kcat_over_KM_ref || '',
        data.T50 || '',
        data.T50_SD || '',
        data.T50_ref || '',
        data.Tm || '',
        data.Tm_SD || '',
        data.Rosetta_score || '',
        data.institution || '',
	      data.creator || 'unknown',
        data.created_date,
        data.submitted_date || 'not submitted',
	      data.curated ? 'yes' : 'no'
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download',
		`${enzyme}_characterization_data` + 
		(selectedInstitution ? "_" + selectedInstitution : "") +
		(showNonCurated ? "" : "_curated") + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Modify the handleRowClick function
  const handleRowClick = (row: any) => {
    // Generate a unique identifier for the row
    const rowId = row.isChild ? `child-${row.id}` : `${row.resid}${row.resnum}${row.resmut}`;
    
    // Save to both state and localStorage
    setLastClickedRowId(rowId);
    localStorage.setItem('lastClickedRow', rowId);

    if (expandData) {
      // If in expanded view, open detail page in new tab
      window.open(`/database/characterization_data/${enzyme}/${row.id}`, '_blank');  // TEMP
    } else if (row.isAggregate) {
      // If it's an aggregate row, toggle expansion
      setExpandedRows(prev => ({
        ...prev,
        [row.groupKey]: !prev[row.groupKey]
      }));
    } else {
      // If it's any individual row (including child rows), open detail page in new tab
      window.open(`/database/characterization_data/${enzyme}/${row.id}`, '_blank');  // TEMP
    }
  };

  // Update the handleSearch function
  const handleSearch = () => {
    if (!searchTerm) {
      setSearchError("Please enter a search term");
      return;
    }

    // Clear any previous search error
    setSearchError(null);
    
    const searchNum = parseInt(searchTerm);
    
    // Find all matching rows
    const matchingRows = characterizationData.filter(item => item.resnum === searchNum);

    if (matchingRows.length > 0) {
      // Get the first matching row
      const firstMatch = matchingRows[0];
      
      // Create the potential group key for grouped rows
      const groupKey = `${firstMatch.resid}${firstMatch.resnum}${firstMatch.resmut}`;
      
      // Try different possible element selectors (in order of preference)
      let element = null;
      
      // First try: direct row ID
      element = document.getElementById(`row-${firstMatch.id}`);
      
      // Second try: group row
      if (!element) {
        element = document.getElementById(`group-${firstMatch.resid}${firstMatch.resnum}`);
      }
      
      // Third try: any row with this resnum (using data attribute)
      if (!element) {
        element = document.querySelector(`[data-resnum="${searchNum}"]`);
      }
      
      if (element) {
        // If we found an element, scroll to it
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight the row temporarily
        element.classList.add('bg-blue-100');
        setTimeout(() => {
          element.classList.remove('bg-blue-100');
        }, 2000);
      } else {
        setSearchError(`Found matches for residue ${searchNum} but couldn't scroll to them`);
      }
    } else {
      setSearchError("No matching entries found");
    }
  };

  // Add this function to render formatted column names
  const getFormattedColumnName = (column: any) => {
    switch (column.uid) {
      case "km":
        return <><i>K</i><sub>M</sub> (mᴍ)</>;
      case "km_dev_from_ref":
        return <><i>d</i><sub><i>K</i><sub>M</sub></sub> (%)</>;
      case "kcat":
        return <><i>k</i><sub>cat</sub> (min<sup>−1</sup>)</>;
      case "kcat_dev_from_ref":
        return <><i>d</i><sub><i>k</i><sub>cat</sub></sub> (%)</>;
      case "kcat_km":
        return <><i>k</i><sub>cat</sub>/<i>K</i><sub>M</sub> (mᴍ<sup>−1</sup>min<sup>−1</sup>)</>;
      case "kcat_km_dev_from_ref":
        return <><i>d</i><sub><i>k</i><sub>cat</sub>/<i>K</i><sub>M</sub></sub> (%)</>;
      case "t50":
        return <><i>T</i><sub>50</sub> (°C)</>;
      case "t50_dev_from_ref":
        return <><i>d</i><sub><i>T</i><sub>50</sub></sub> (%)</>;
      case "tm":
        return <><i>T</i><sub>m</sub> (°C)</>;
      case "rosetta":
        return <>Rosetta score change</>;
      default:
        return capitalize(column.name);
    }
  };

  // 1. Add an effect to initialize filters from URL on page load
  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return;
    
    const { 
      institution, 
      curated, 
      expand, 
      numbering, 
      sort,
      sortDir,
      showColors: colorParam,
      perPage,
	  search,
      // other params you want to support
    } = router.query;
    
    // Set initial filter states based on URL params
    if (institution) setSelectedInstitution(institution as string);
    if (curated !== undefined) setShowNonCurated(curated === '1');
    if (expand !== undefined) setExpandData(expand === '1');
    if (numbering !== undefined) setUseRosettaNumbering(numbering === '1');
    if (colorParam !== undefined) setShowColors(colorParam === '1');
    if (perPage) setRowsPerPage(perPage === 'all' ? 0 : Number(perPage));
    
    // Handle sorting - set the flag before updating state
    if (sort) {
      sortFromUrl.current = true;
      setSortDescriptor({
        column: sort as string,
        direction: (sortDir as "ascending" | "descending") || "ascending"
      });
    }
    
  }, [router.isReady, router.query]);

  // 2. Add an effect to update URL when filters change
  useEffect(() => {
    // Only update after initial load
    if (!router.isReady) return;
    
    // Don't update URL if this sort change came from the URL
    if (sortFromUrl.current) {
      sortFromUrl.current = false;
      return;
    }
    
    // Create a query object with current filter state
    const query: Record<string, string> = {
	  ...({ enzyme: enzyme as string }),
	  
      // Only include params that differ from defaults
      ...(selectedInstitution ? { institution: selectedInstitution } : {}),
      ...(showNonCurated !== false ? { curated: showNonCurated ? '1' : '0' } : {}),
      ...(expandData !== false ? { expand: expandData ? '1' : '0' } : {}),
      ...(useRosettaNumbering !== true ? { numbering: useRosettaNumbering ? '1' : '0' } : {}),
      ...(showColors !== true ? { showColors: showColors ? '1' : '0' } : {}),
      ...(sortDescriptor.column !== "variant" ? { sort: sortDescriptor.column } : {}),
      ...(sortDescriptor.direction !== "ascending" ? { sortDir: sortDescriptor.direction } : {}),
      ...(rowsPerPage !== 0 ? { perPage: rowsPerPage.toString() } : { perPage: 'all' }),
      
      // Preserve any highlight parameter if it exists
      ...(router.query.highlight ? { highlight: router.query.highlight as string } : {})
    };
    
    // Update URL without full page reload
	// TODO: stop updating URL
    router.push(
      {
        pathname: router.pathname,
        query
      }, 
      undefined, 
      { shallow: true }
    );
    
  }, [
	enzyme,
    router.isReady,
    selectedInstitution, 
    showNonCurated, 
    expandData, 
    useRosettaNumbering,
    showColors,
    sortDescriptor,
    rowsPerPage
    // Add any other filter dependencies
  ]);

  // Add this function
  const copyCurrentUrlToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      // Show a success notification
      alert("URL with current filters copied to clipboard!");
    });
  };

  // Add this useEffect to update visible columns when expandData changes
  useEffect(() => {
    setVisibleColumns(prevColumns => {
      const newColumns = new Set(prevColumns);
      
      if (expandData) {
        // If showing all data, add the refs column
        newColumns.add("refs");
      } else {
        // If showing only averages, remove the refs column
        newColumns.delete("refs");
      }
      
      return newColumns;
    });
  }, [expandData]);

  console.log(publications)
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

        {/* Error message display */}
        {searchError && (
          <div className="fixed top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            {searchError}
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
            <BreadcrumbItem>{`${enzyme}`} Characterization Data</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-3">
            <h1 className="mb-4 pb-4 lg:pb-14 text-4xl md:text-4xl lg:text-4xl font-inter dark:text-white">
              {`${enzyme}`} Variant Characterization Data
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
                        <div>
                          <h2 className="text-xl font-light mb-2">Color Key</h2>
                          
                          <Link href={`/about/${enzyme}`} className="text-[#06B7DB] hover:underline mb-6 block text-sm">
                            View full {`${enzyme}`} Sequence
                          </Link>
                          
                          {/* Color gradient bar */}
                          <div className="flex items-center gap-[2px] mb-2">
                            {[
                              '#36929A', // -4.75 and below
                              '#4A9DA4', // -4.75 to -4.25
                              '#5EA8AE', // -4.25 to -3.75
                              '#72B2B8', // -3.75 to -3.25
                              '#86BDC2', // -3.25 to -2.75
                              '#9AC8CC', // -2.75 to -2.25
                              '#AAD3D6', // -2.25 to -1.75
                              '#C2DEE0', // -1.75 to -1.25
                              '#D7E9EB', // -1.25 to -0.75
                              '#EBF4F5', // -0.75 to -0.25
                              '#FFFFFF', // -0.25 to 0.25 (neutral)
                              '#FAC498', // 0.25 to 0.75
                              '#F68932'  // 0.75 and above
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
                          <div className="relative w-full h-6 mb-2 ml-1">
                            {['-5', '-4', '-3', '-2', '-1', '0', '1'].map((number, index) => (
                              <div
                                key={index}
                                className="absolute transform -translate-x-1/2 text-xs"
                                style={{
                                  left: `${(index) * (100 / 6.4)}%`,
                                  top: 0
                                }}
                              >
                                {number}
                              </div>
                            ))}
                          </div>
                          
                          {/* Labels */}
                          <div className="flex justify-between text-sm text-gray-600">
                            <div>Underperforms</div>
                            <div className="text-right">Outperforms</div>
                          </div>
                        </div>

                        {/* Variant Analysis section */}
                        <div className="mb-6">             
                          <div className="text-gray-600">
                            <div className={`space-y-2 ${!showFullText ? "line-clamp-2" : ""}`}>
                              <div className="text-sm space-y-3">
                                <p>
                                  For kinetic constants, the table is color-coded by relative log values of 1/<i>K</i><sub>M</sub>, <i>k</i><sub>cat</sub>, and <i>k</i><sub>cat</sub>/<i>K</i><sub>M</sub> compared to WT.
                                  {!showFullText && "..."}
                                </p>
                                
                                {showFullText && (
                                  <>
                                    <p>
                                      log 1/<i>K</i><sub>M</sub> is used so that larger values are &ldquo;better&rdquo;.
                                    </p>
                                    
                                    <p>
                                      For <i>T</i><sub>50</sub> and <i>T</i><sub>m</sub> values and Rosetta scores, a linear scale is used.
                                    </p>
                                    
                                    <p>
                                      Variants shaded grey are expressed (as confirmed by gel electrophoresis and/or yield &gt; 0.1 mg/mL).
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

                          <Link href="https://drive.google.com/file/d/1XPG4w6FJ39NvvSYzZtZu9nnQaG2__ApX/view?usp=sharing" target="_blank" className="text-[#06B7DB] hover:underline mb-4 block text-sm">
                            How were these data calculated?
                          </Link>

                          <Button 
                            className="mt-6 w-full bg-[#06B7DB] text-white hover:bg-[#05a6c7] transition-colors px-2 py-6"
                            size="md"
                            onClick={downloadCSV}
                          >
				Download filtered/displayed data<br />				
				as comma-delimited file
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
                    {/* Left side - Search, controls, and total records */}
                    <div className="flex flex-col sm:flex-row gap-2 items-center w-full">
                      <Input
                        type="text"
                        isClearable
                        classNames={{
                          base: "w-full sm:w-[200px] md:w-[300px]",
                        }}
                        placeholder="Jump to residue number..."
                        size="sm"
                        value={searchTerm}
                        onClear={() => setSearchTerm("")}
                        onChange={(e) => {
                          // This ensures only digits are typed
                          const input = e.target as HTMLInputElement;
                          setSearchTerm(input.value.replace(/\D/g, ""));
                        }}
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
                      <Button
                        size="sm"
                        variant="flat"
                        className="ml-2"
                        onClick={handleSearch}
                      >
                        GO
                      </Button>
                      
                      {/* Controls container - two columns layout */}
                      <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                        {/* Columns dropdown */}
                        <Dropdown 
                          className="w-full" 
                          shouldBlockScroll={false}
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
                              <DropdownItem key={column.uid}>
                                {getFormattedColumnName(column)}
                              </DropdownItem>
                            ))}
                          </DropdownMenu>
                        </Dropdown>

                        {/* Filter dropdown */}
                        <Dropdown 
                          className="w-full" 
                          shouldBlockScroll={false}
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
                                  classNames={{
                                    listboxWrapper: "max-h-[200px] overflow-y-auto custom-scrollbar",
                                  }}
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
                                  <span className="text-sm text-gray-600">Data To Show</span>
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

                      <span className="text-default-400 text-sm whitespace-nowrap">
                        Total {displayData.length} records
                      </span>
                    </div>

                    {/* Right side - Rows per page */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-default-400 hidden sm:inline">Rows per page:</span>
                      <span className="text-default-400 sm:hidden">Per page:</span>
                      <Select
                        size="sm"
                        selectedKeys={[rowsPerPage === 0 ? "all" : rowsPerPage.toString()]}
                        className="w-20 sm:w-24"
                        onChange={(e) => {
                          const value = e.target.value;
                          setRowsPerPage(value === "all" ? 0 : Number(value));
                          setPage(1);
                          scrollToPosition('top');
                        }}
                      >
                        <SelectItem key="25" value="25">25</SelectItem>
                        <SelectItem key="50" value="50">50</SelectItem>
                        <SelectItem key="100" value="100">100</SelectItem>
                        <SelectItem key="250" value="250">250</SelectItem>
                        <SelectItem key="500" value="500">500</SelectItem>
                        <SelectItem key="all" value="all">All</SelectItem>
                      </Select>
                    </div>
                  </div>

                  {/* Add id to table for scrolling */}
                  <div id="characterization-table" className="relative">
                    <Table
                      isHeaderSticky
                      aria-label={`${enzyme} Variant Characterization Data`}
                      sortDescriptor={sortDescriptor}
                      onSortChange={(descriptor) => {
                        setSortDescriptor(descriptor as SortDescriptor);
                      }}
                      classNames={{
                        th: [
                          "text-default-500", 
                          "bg-white", // Solid background to prevent see-through
                          "font-medium", 
                          "py-3 px-4",
                          "before:content-['']",
                          "before:absolute",
                          "before:left-0",
                          "before:top-0",
                          "before:w-full",
                          "before:h-full",
                          "before:bg-default-100/50",
                          "before:z-[-1]",
                        ].join(" "),
                        //base: "overflow-visible",
                        base: "max-h-[800px] max-w-[1200px] overflow-scroll",
                        thead: "z-40",
                        wrapper: "overflow-visible",
                        tr: "hover:bg-default-100/50 hover:cursor-pointer hover:shadow-sm hover:rounded-lg",
                      }}
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10
                      }}
                    >
                      <TableHeader>
                        {columns
                          .filter(column => visibleColumns.has(column.uid))
                          .map(column => (
                            <TableColumn 
                              key={column.uid}
                              allowsSorting={true}
                              className="cursor-pointer"
                            >
                              {column.renderHeader ? column.renderHeader() : column.name}
                            </TableColumn>
                          ))}
                      </TableHeader>
                      <TableBody items={paginatedData}>
                        {(data) => (
                          <TableRow 
                          key={
                            data.isChild
                              ? `child-${data.id}`
                              : expandData
                                ? `row-${data.id}`
                                : `group-${data.groupKey}`
                          }
                            id={data.isAggregate ? `group-${data.resid}${data.resnum}` : `row-${data.id}`}
                            data-resnum={data.resnum}
                            className={`
                              ${data.isChild ? "bg-default-50" : ""}
                              ${(!data.isAggregate || data.isChild) ? "cursor-pointer hover:bg-default-100/50" : ""}
                              ${(data.isChild ? `child-${data.id}` : `${data.resid}${data.resnum}${data.resmut}`) === lastClickedRowId 
                                ? "bg-[#06B7DB]/10 hover:bg-[#06B7DB]/20" 
                                : ""
                              }
                              ${highlightedRowId === (data.isChild ? `child-${data.id}` : `${data.resid}${data.resnum}${data.resmut}`) 
                                ? "bg-yellow-200" 
                                : ""
                              }
                            `}
                            onClick={() => handleRowClick(data)}
                          >
                            {columns
                              .filter(column => visibleColumns.has(column.uid))
                              .map(column => {
                                let cell;
                                switch (column.uid) {
                                  case "variant":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div className={`
                                          flex items-center gap-2
                                          ${data.isChild ? "pl-8" : ""} // Add indent for child rows
                                        `}>
                                          {data.isAggregate && (
                                            <HiChevronRight 
                                              className={`w-4 h-4 transition-transform ${
                                                expandedRows[data.groupKey] ? "rotate-90" : ""
                                              }`}
                                            />
                                          )}
                                          <span className={(!data.isAggregate || data.isChild) ? "text-[#06B7DB]" : ""}>
                                            {getVariantDisplay(data.resid, data.resnum, data.resmut)}
                                          </span>
                                          {data.isAggregate && (
                                            <span className="text-gray-500 text-sm">
                                              ({data.count})
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "yield":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{ 
                                          backgroundColor: data.expressed ? '#D1D5DB' : '#FFFFFF',
                                          color: data.expressed ? '#000000' : '#000000',
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'right',
                                          width: '40px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.yield_avg !== null && !isNaN(data.yield_avg) ? 
                                            roundTo(data.yield_avg, 2) : 
                                            data.expressed ? 
                                              <Tooltip content={<p>This variant expressed, but no yield was recorded.</p>}>{'*'}</Tooltip> :
                                              '—'}
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
                                          textAlign: 'right',
                                          width: '100px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.KM_avg !== null && !isNaN(data.KM_avg) ? `${roundTo(data.KM_avg, 2)} ± ${data.KM_SD !== null && !isNaN(data.KM_SD) ? roundTo(data.KM_SD, 2) : '—'}` : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "km_dev_from_ref":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{
                                          backgroundColor: getColorForValue(0),
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'right',
                                          width: '100px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {(data.KM_avg !== null && !isNaN(data.KM_avg)) && (data.KM_ref !== null && !isNaN(data.KM_ref)) ? `${roundTo(calculateRelativeDeviation(data.KM_avg, data.KM_ref), 1)}%` : '—'}
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
                                          textAlign: 'right',
                                          width: '100px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.kcat_avg !== null && !isNaN(data.kcat_avg) ? `${roundTo(data.kcat_avg, 2)} ± ${data.kcat_SD !== null && !isNaN(data.kcat_SD) ? roundTo(data.kcat_SD, 2) : '—'}` : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "kcat_dev_from_ref":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{
                                          backgroundColor: getColorForValue(0),
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'right',
                                          width: '100px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {(data.kcat_avg !== null && !isNaN(data.kcat_avg)) && (data.kcat_ref !== null && !isNaN(data.kcat_ref)) ? `${roundTo(calculateRelativeDeviation(data.kcat_avg, data.kcat_ref), 1)}%` : '—'}
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
                                          textAlign: 'right',
                                          width: '100px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.kcat_over_KM !== null && !isNaN(data.kcat_over_KM) ? 
                                            `${roundTo(data.kcat_over_KM, 2)} ± ${data.kcat_over_KM_SD !== null && !isNaN(data.kcat_over_KM_SD) ? roundTo(data.kcat_over_KM_SD, 2) : '—'}` 
                                            : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "kcat_km_dev_from_ref":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{
                                          backgroundColor: getColorForValue(0),
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'right',
                                          width: '100px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {(data.kcat_over_KM !== null && !isNaN(data.kcat_over_KM)) && (data.kcat_over_KM_ref !== null && !isNaN(data.kcat_over_KM_ref)) ? `${roundTo(calculateRelativeDeviation(data.kcat_over_KM, data.kcat_over_KM_ref), 1)}%` : '—'}
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
                                          textAlign: 'right',
                                          width: '100px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.T50 !== null && !isNaN(data.T50) ? `${roundTo(data.T50, 2)} ± ${data.T50_SD !== null && !isNaN(data.T50_SD) ? roundTo(data.T50_SD, 2) : '—'}` : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "t50_dev_from_ref":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div style={{
                                          backgroundColor: getColorForValue(0),
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          textAlign: 'right',
                                          width: '100px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {(data.T50 !== null && !isNaN(data.T50)) && (data.T50_ref !== null && !isNaN(data.T50_ref)) ? `${roundTo(calculateRelativeDeviation(data.T50, data.T50_ref), 1)}%` : '—'}
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
                                          textAlign: 'right',
                                          width: '100px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.Tm !== null && !isNaN(data.Tm) ? `${roundTo(data.Tm, 1)} ± ${data.Tm_SD !== null && !isNaN(data.Tm_SD) ? roundTo(data.Tm_SD, 1) : '0.0'}` : '—'}
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
                                          textAlign: 'right',
                                          width: '100px',
                                          marginLeft: 'auto',
                                          display: 'inline-block',
                                          minWidth: 'fit-content'
                                        }}>
                                          {data.Rosetta_score !== null && !isNaN(data.Rosetta_score) ? roundTo(data.Rosetta_score, 1) : '—'}
                                        </div>
                                      </TableCell>
                                    );
                                    break;
                                  case "refs":
                                    cell = (
                                      <TableCell key={column.uid}>
                                        <div className="flex gap-1 items-center">
                                          {(() => {
                                            // Filter out null, empty references, and treat both "0" and 0 as empty
                                            const validRefs = [data.reference1, data.reference2, data.reference3]
                                              .filter(ref => ref !== null && ref !== undefined && ref !== "" && ref !== "0" && ref !== 0);
                                            
                                            if (validRefs.length === 0) return "—";
                                            
                                            return validRefs.map((ref, index) => {
                                              // Find the publication that matches this reference ID
                                              const publication = publications.find(pub => pub.id === Number(ref));
                                              
                                              // If we found a matching publication with a link
                                              if (publication?.link) {
                                                return (
                                                  <React.Fragment key={`ref-${data.id}-${ref}`}>
                                                    {index > 0 && ", "}
                                                    <a 
                                                      href={publication.link} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="text-[#06B7DB] hover:underline hover:text-[#0594B7]"
                                                      onClick={(e) => e.stopPropagation()} // Prevent row click when clicking the link
                                                    >
                                                      {ref}
                                                    </a>
                                                  </React.Fragment>
                                                );
                                              } else {
                                                // If we can't find a matching publication or it has no link, just show the number
                                                return (
                                                  <React.Fragment key={`ref-${data.id}-${ref}`}>
                                                    {index > 0 && ", "}
                                                    <span>{ref}</span>
                                                  </React.Fragment>
                                                );
                                              }
                                            });
                                          })()}
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
                        selectedKeys={[rowsPerPage === 0 ? "all" : rowsPerPage.toString()]}
                        className="w-20 sm:w-24"
                        onChange={(e) => {
                          const value = e.target.value;
                          setRowsPerPage(value === "all" ? 0 : Number(value));
                          setPage(1);
                          scrollToPosition('top');
                        }}
                      >
                        <SelectItem key="25" value="25">25</SelectItem>
                        <SelectItem key="50" value="50">50</SelectItem>
                        <SelectItem key="100" value="100">100</SelectItem>
                        <SelectItem key="250" value="250">250</SelectItem>
                        <SelectItem key="500" value="500">500</SelectItem>
                        <SelectItem key="all" value="all">All</SelectItem>
                      </Select>
                    </div>
                  </div>

                  {/* Share button */}
                  <Button
                    className="ml-2"
                    size="sm"
                    variant="flat"
                    onClick={copyCurrentUrlToClipboard}
                  >
                    <FaShareAlt className="mr-1"/> Share View
                  </Button>
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
