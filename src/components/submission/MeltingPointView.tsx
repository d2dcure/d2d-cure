import React, { useState, useEffect } from 'react';
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
import {Input} from "@nextui-org/input";

interface MeltingPointViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

const MeltingPointView: React.FC<MeltingPointViewProps> = ({
  entryData,
  setCurrentView,
  updateEntryData
}) => {
  const [tmMean, setTmMean] = useState<string>(entryData.Tm || '');
  const [tmStdDev, setTmStdDev] = useState<string>(entryData.Tm_SD || '');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to validate and set floating-point values only
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const value = e.target.value;
    // Allow only floating-point numbers (e.g., "123.45", ".5", "-.5")
    const regex = /^-?\d*\.?\d*$/;
    if (regex.test(value)) {
      setValue(value);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/updateMeltingPointValues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entryData.id,
          tm_mean: tmMean,
          tm_std_dev: tmStdDev,
        }),
      });

      if (response.ok) {
        setIsSaved(true);
        const updatedEntry = await response.json();
        updateEntryData(updatedEntry);
        setCurrentView('checklist'); 
      } else {
        console.error('Failed to save melting point values');
      }
    } catch (error) {
      console.error('Error saving melting point values:', error);
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
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to checklist
        </button>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-800">Melting Point Values</h2>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            entryData.Tm && entryData.Tm_SD
              ? "text-green-700 bg-green-100" 
              : "text-yellow-700 bg-yellow-100"
          }`}>
            {entryData.Tm && entryData.Tm_SD ? "Complete" : "Incomplete"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Enter the melting point values for your variant
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6 space-y-6">
        <div className="space-y-6">
          <Input
            type="text"
            label="Tm Mean (°C)"
            value={tmMean}
            onChange={(e) => handleInputChange(e, setTmMean)}
            placeholder={entryData.Tm ? `Current value: ${entryData.Tm}°C` : "Enter mean temperature"}
            classNames={{
              label: "text-default-600 text-small",
              input: "text-small",
            }}
          />
          
          <Input
            type="text"
            label="Tm Standard Deviation (°C)"
            value={tmStdDev}
            onChange={(e) => handleInputChange(e, setTmStdDev)}
            placeholder={entryData.Tm_SD ? `Current value: ${entryData.Tm_SD}°C` : "Enter standard deviation"}
            classNames={{
              label: "text-default-600 text-small",
              input: "text-small",
            }}
          />

          {/* Current values display */}
          {(entryData.Tm || entryData.Tm_SD) && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Current values: 
              <span className="font-medium text-gray-900">
                {entryData.Tm ? `${entryData.Tm}°C` : 'N/A'} ± {entryData.Tm_SD ? `${entryData.Tm_SD}°C` : 'N/A'}
              </span>
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter className="px-6 pb-6 pt-6 flex justify-between items-center border-t border-gray-100">
        <button 
          onClick={handleSave}
          className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!tmMean || !tmStdDev || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Submit'
          )}
        </button>
        
        <span className="text-xs text-gray-500">
          All fields are required
        </span>
      </CardFooter>
    </Card>
  );
};

export default MeltingPointView;
