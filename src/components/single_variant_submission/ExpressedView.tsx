import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ExpressedViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

const ExpressedView: React.FC<ExpressedViewProps> = ({ entryData, setCurrentView, updateEntryData }) => {
  const [yieldAvg, setYieldAvg] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('mg/mL'); // Default unit
  const [kineticRawDataEntryData, setKineticRawDataEntryData] = useState<any>(null);

  useEffect(() => {
    const fetchKineticRawDataEntryData = async () => {
      try {
        const response = await axios.get('/api/getKineticRawDataEntryData', {
          params: { parent_id: entryData.id },
        });
        if (response.status === 200) {
          const data = response.data;
          setKineticRawDataEntryData(data);
          if (data.yield !== null) {
            setYieldAvg(data.yield.toString());
          }
          if (data.yield_units) {
            setSelectedUnit(mapYieldUnitsBack(data.yield_units));
          }
        }
      } catch (error) {
        console.error('Error fetching KineticRawData entry:', error);
      }
    };

    fetchKineticRawDataEntryData();
  }, [entryData.id]);

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
    }
  };

  return (
    <div className="space-y-4">
      <button
        className="text-blue-500 hover:text-blue-700"
        onClick={() => setCurrentView('checklist')}
      >
        &lt; Back to Checklist
      </button>
      <h2 className="text-2xl font-bold">Enter Expressed Yield Average</h2>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          step="0.01"
          value={yieldAvg}
          onChange={(e) => setYieldAvg(e.target.value)}
          className="block w-full p-2 bg-gray-100 border border-gray-300 rounded"
          placeholder="Enter yield average"
        />
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="block p-2 bg-gray-100 border border-gray-300 rounded"
        >
          <option value="mg/mL">mg/mL</option>
          <option value="A280*">A280*</option>
          <option value="mM">mM</option>
          <option value="M">M</option>
        </select>
      </div>

      {/* Display Current Yield Average */}
      {kineticRawDataEntryData && (
        <p className="text-lg font-semibold">
          Current yield average:{' '}
          {kineticRawDataEntryData.yield !== null
            ? `${kineticRawDataEntryData.yield} ${mapYieldUnitsBack(
                kineticRawDataEntryData.yield_units
              )}`
            : 'N/A'}
        </p>
      )}

      {/* Save button */}
      <button
        onClick={updateYieldAverage}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save
      </button>
    </div>
  );
};

export default ExpressedView;
