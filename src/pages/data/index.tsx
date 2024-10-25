import React, { useState, useEffect } from 'react';
import { Link } from "@nextui-org/react";
import "../../app/globals.css";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

function Page({ id, variant }: { id: string, variant:string }) {
  const link = "/bglb?id=" + id;
  return <Link href={link}>
    <button> {variant} </button>
  </Link>;
}

const DataPage = () => {
  const [expandData, setExpandData] = useState(false);
  const [useRosettaNumbering, setUseRosettaNumbering] = useState(false);
  const [sequences, setSequences] = useState<any[]>([]);
  const [showNonCurated, setShowNonCurated] = useState(false); 
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [characterizationData, setCharacterizationData] = useState<any[]>([]); // This holds all the rows in the CharacterizationData table in the BglB database
  const [WTValues, setWTValues] = useState<any>(null);


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

    const getColorForValue = (value:any) => {
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

  return (
    <>
      <NavBar />
          <div className="flex flex-col items-center p-4">
      <h1 className="text-xl font-bold mb-4">BglB Variant Characterization Data</h1>
      <p className="text-center mb-4">
        Hover over any column for a description of that parameter.
        <br />
        Click on any column header to sort the data by that value.
      </p>
      <div className="mb-4">
        <label className="block mb-2">
          <input
            type="checkbox"
            checked={expandData}
            onChange={(e) => setExpandData(e.target.checked)}
            className="mr-2"
          />
          Expand data to show individual instead of averages
        </label>
        <label className="block mb-2">
          <input
            type="checkbox"
            checked={useRosettaNumbering}
            onChange={() => setUseRosettaNumbering(!useRosettaNumbering)}
            className="mr-2"
          />
          Rosetta/Foldit sequencing number
        </label>
        <label className="block mb-2">
          <input
            type="checkbox"
            checked={showNonCurated}
            onChange={(e) => setShowNonCurated(e.target.checked)}
            className="mr-2"
          />
          Include noncurated data
        </label>
      </div>
      <div className="mb-4">
        <label className="block">
          Limit records to:{' '}
          <select
            value={selectedInstitution}
            onChange={(e) => setSelectedInstitution(e.target.value)}
            className="mt-1"
          >
            <option value="">Select an institution</option>
            {institutions.map((institution) => (
              <option key={institution.id} value={institution.abbr}>
                {institution.fullname}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-4 font-bold">
      {displayData.length} Records Found
      </div>
      <div>
        <label className="block">
          Search for residue number:{' '}
          <input
            type="number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </label>
      </div>
      <div className="flex flex-col items-center p-4">
        <table className="table-auto border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-300">Variant</th>
              <th className="border border-gray-300">Yield</th>
              <th className="border border-gray-300">Km</th>
              <th className="border border-gray-300">Kcat</th>
              <th className="border border-gray-300">Kcat/Km</th>
              <th className="border border-gray-300">T50</th>
              <th className="border border-gray-300">Tm</th>
              <th className="border border-gray-300">Rosetta Score Change</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((data, index) => (
              
              <tr key={index}>
              {/* Variant cells */}
              <td className="border border-gray-300">
                {data.isAggregate ? (
                  <span title={`Average of ${data.count} separate experiments. Click to expand`} className="text-blue-500" onClick={() => setExpandData(true)} style={{cursor: 'pointer'}}>►</span>
                ) : ''}  
                {<Page id = { data.id } variant= {getVariantDisplay(data.resid, data.resnum, data.resmut)}></Page>}
              </td>
              
              {/* Yield cells */}
              <td className="border border-gray-300" style={{ backgroundColor: data.expressed ? '#000000' : '#FFFFFF', color: data.expressed ? '#FFFFFF' : '#000000'}}>
              {data.yield_avg !== null && !isNaN(data.yield_avg) ? roundTo(data.yield_avg, 2) : data.expressed ? '*' : '—'}
              </td>

              {/* KM_avg cells */}
              <td className="border border-gray-300" style={{backgroundColor: getColorForValue(data.KM_avg !== null && !isNaN(data.KM_avg) ? Math.log10(1 / data.KM_avg) - WTValues.WT_log_inv_KM : -5)}}>
                {data.KM_avg !== null && !isNaN(data.KM_avg) ? `${roundTo(data.KM_avg, 2)} ± ${data.KM_SD !== null && !isNaN(data.KM_SD) ? roundTo(data.KM_SD, 2) : '—'}` : '—'}
              </td>

              {/* kcat_avg cells */}
              <td className="border border-gray-300" style={{backgroundColor: getColorForValue(data.kcat_avg !== null && !isNaN(data.kcat_avg) ? Math.log10(data.kcat_avg) - WTValues.WT_log_kcat : -5)}}>
                {data.kcat_avg !== null && !isNaN(data.kcat_avg) ? `${roundTo(data.kcat_avg, 1)} ± ${data.kcat_SD !== null && !isNaN(data.kcat_SD) ? roundTo(data.kcat_SD, 1) : '—'}` : '—'}
              </td>

              {/* kcat_over_KM cells */}
              <td className="border border-gray-300" style={{backgroundColor: getColorForValue(data.kcat_over_KM !== null && !isNaN(data.kcat_over_KM) ? Math.log10(data.kcat_over_KM) - WTValues.WT_log_kcat_over_KM : -5)}}>
                {data.kcat_over_KM !== null && !isNaN(data.kcat_over_KM) ? `${roundTo(data.kcat_over_KM, 2)} ± ${data.kcat_over_KM_SD !== null && !isNaN(data.kcat_over_KM_SD) ? roundTo(data.kcat_over_KM_SD, 2) : '—'}` : '—'}
              </td>
              
              {/* T50 cells */}
              <td className="border border-gray-300" style={{backgroundColor: getColorForValue(data.T50 !== null && !isNaN(data.T50) ? data.T50 - WTValues.WT_T50 : -5)}}>
                {data.T50 !== null && !isNaN(data.T50) ? `${roundTo(data.T50, 1)} ± ${data.T50_SD !== null && !isNaN(data.T50_SD) ? roundTo(data.T50_SD, 1) : '—'}` : '—'}
              </td>
              
              {/* Tm cells */}
              <td className="border border-gray-300" style={{backgroundColor: getColorForValue(data.Tm !== null && !isNaN(data.Tm) ? data.Tm - WTValues.WT_Tm : -5)}}>
                {data.Tm !== null && !isNaN(data.Tm) ? `${roundTo(data.Tm, 1)} ± ${data.Tm_SD !== null && !isNaN(data.Tm_SD) ? roundTo(data.Tm_SD, 1) : '—'}` : '—'}
              </td>

              {/* Rosetta cells */}
              <td className="border border-gray-300" style={{backgroundColor: getColorForValue(data.Rosetta_score !== null && !isNaN(data.Rosetta_score) ? -(data.Rosetta_score - WTValues.WT_Rosetta_score) : 0)}}>
                {data.Rosetta_score !== null && !isNaN(data.Rosetta_score) ? roundTo(data.Rosetta_score, 1) : '—'}
              </td>

            </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
    <Footer></Footer>
    </>

  );
};

export default DataPage;