import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
import {Input} from "@nextui-org/input";
import {Select, SelectItem} from "@nextui-org/select";
import { LoaderCircleIcon, AlertTriangleIcon } from 'lucide-react';

interface ExpressedViewProps {
	enzyme: string;
	entryData: any;
	setCurrentView: (view: string) => void;
	updateEntryData: (newData: any) => void; 
}

const ExpressedView: React.FC<ExpressedViewProps> = ({
	enzyme,
	entryData,
	setCurrentView,
	updateEntryData
}) => {
  const [yieldAvg, setYieldAvg] = useState<string>(''); // it says 'Avg' but it's really just the regular yield value 
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [kineticRawDataEntryData, setKineticRawDataEntryData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchKineticRawDataEntryData = async () => {
      try {
        const response = await axios.get('/api/getKineticRawDataEntryData', {
          params: { enzyme: enzyme, parent_id: entryData.id },
        });
        if (response.status === 200) {
          const data = response.data;
          setKineticRawDataEntryData(data);
          if (data.yield !== null) {
            setYieldAvg(data.yield.toString());
          }
          if (data.yield_units) {
            setSelectedUnit(mapYieldUnitsBack(data.yield_units));
          } else {
            setSelectedUnit('mg/mL');
          }
        }
      } catch (error) {
        console.error('Error fetching KineticRawData entry:', error);
      }
    };

    fetchKineticRawDataEntryData();
  }, [enzyme, entryData.id]);

  const mapYieldUnits = (value: string): 'A280_' | 'mg_mL_' | 'mM_' | 'M_' => {
    switch (value.trim()) {
      case 'A280*':
        return 'A280_';
      case 'mg/mL':
        return 'mg_mL_';
      case 'mM':
        return 'mM_';
      case 'M':
        return 'M_';
      default:
        throw new Error(`Invalid yield_units value: ${value}`);
    }
  };

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

  const updateYieldAverage = async () => {
    setIsSubmitting(true);
    const roundedValue = parseFloat(parseFloat(yieldAvg).toFixed(2));
    try {
      const yield_units_mapped = mapYieldUnits(selectedUnit);

      // Update KineticRawData
      const response1 = await fetch('/api/updateKineticRawDataYield', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
		  enzyme: enzyme,
          parent_id: entryData.id,
          yield_value: roundedValue,
          yield_units: yield_units_mapped,
        }),
      });

      if (!response1.ok) {
        throw new Error('Failed to update yield average in KineticRawData');
      }

      // Update CharacterizationData
      const response2 = await fetch('/api/updateCharacterizationDataYieldAvg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
		  enzyme: enzyme,
          id: entryData.id,
          yield_avg: roundedValue,
        }),
      });

      if (!response2.ok) {
        throw new Error('Failed to update yield average in CharacterizationData');
      }

      const updatedEntry = await response2.json();
      updateEntryData(updatedEntry);
      setCurrentView('checklist');
    } catch (error) {
      console.error('Error updating yield average:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-4 border-b border-gray-100">
        <button 
          className="text-[#06B7DB] hover:text-[#05a5c6] text-sm mb-4 flex items-center gap-2 transition-colors"
          onClick={() => setCurrentView('checklist')}
        >
          <AlertTriangleIcon className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" />
          Back to checklist
        </button>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-800">Expressed Yield</h2>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            entryData.yield_avg !== null 
              ? "text-green-700 bg-green-100" 
              : "text-yellow-700 bg-yellow-100"
          }`}>
            {entryData.yield_avg !== null ? "Complete" : "Incomplete"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Enter the expressed yield value and units
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6 space-y-6">
        <div className="space-y-6">
          <div className="flex gap-4">
            <Input
              type="number"
              label="Yield"
              value={yieldAvg}
              onChange={(e) => setYieldAvg(e.target.value)}
              step="0.01"
              className="flex-1"
              classNames={{
                label: "text-default-600 text-small",
                input: "text-small",
              }}
            />
            <Select
              label="Units"
              selectedKeys={selectedUnit ? [selectedUnit] : []}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-32"
            >
              <SelectItem key="mg/mL" value="mg/mL">mg/mL</SelectItem>
              <SelectItem key="A280*" value="A280*">A_280*</SelectItem>
              <SelectItem key="mM" value="mM">mM</SelectItem>
              <SelectItem key="M" value="M">M</SelectItem>
            </Select>
          </div>
          
          {/* Add the new informational text for A280 */}
          {selectedUnit === 'A280*' && (
            <div className="text-xs text-gray-600 italic">
              *If used, raw A<sub>280</sub> values should be preadjusted for a path length of 1 cm.
            </div>
          )}

          {/* Current value display */}
          {kineticRawDataEntryData && kineticRawDataEntryData.yield !== null && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <AlertTriangleIcon className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" />
              Current yield: 
              <span className="font-medium text-gray-900">
                {`${kineticRawDataEntryData.yield} ${mapYieldUnitsBack(kineticRawDataEntryData.yield_units)}`}
              </span>
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter className="px-6 pb-6 pt-6 flex justify-between items-center border-t border-gray-100">
        <button 
          onClick={updateYieldAverage}
          className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!yieldAvg || isSubmitting || entryData.curated}
        >
          {isSubmitting ? (
            <>
              <LoaderCircleIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" />
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </button>
        
        <span className="text-xs text-gray-500">
          Both value and units are required
        </span>
      </CardFooter>
    </Card>
  );
};

export default ExpressedView;