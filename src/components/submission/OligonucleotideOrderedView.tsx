import React, { useState } from 'react';
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
import {Select, SelectItem} from "@nextui-org/select";

interface OligonucleotideOrderedViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

const OligonucleotideOrderedView: React.FC<OligonucleotideOrderedViewProps> = ({
  entryData,
  setCurrentView,
  updateEntryData,
}) => {
  const [oligoOrdered, setOligoOrdered] = useState<any>('no');

  const updateOligoOrdered = async () => {
    try {
      const isOrdered = oligoOrdered === 'yes';
      const response = await fetch('/api/updateCharacterizationDataOligoOrdered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entryData.id,
          oligo_ordered: isOrdered,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update oligonucleotide ordered status');
      }
      
      const updatedEntry = await response.json();
      updateEntryData(updatedEntry);
      setCurrentView('checklist'); // Navigate back to checklist
    } catch (error) {
      console.error('Error updating oligonucleotide ordered status:', error);
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
          <h2 className="text-xl font-bold text-gray-800">Oligonucleotide Order Status</h2>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            entryData.oligo_ordered 
              ? "text-green-700 bg-green-100" 
              : "text-yellow-700 bg-yellow-100"
          }`}>
            {entryData.oligo_ordered ? "Complete" : "Incomplete"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Update the oligonucleotide order status
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6 space-y-6">
        <div className="space-y-4">
          <Select
            label="Order Status"
            placeholder={`${entryData.oligo_ordered ? 'Yes' : 'No'}`}
            value={oligoOrdered}
            onChange={(e) => setOligoOrdered(e.target.value)}
            className="max-w-xs"
          >
            <SelectItem key="yes" value="yes">Yes</SelectItem>
            <SelectItem key="no" value="no">No</SelectItem>
          </Select>
        </div>
      </CardBody>

      <CardFooter className="px-6 pb-6 pt-6 flex justify-between items-center border-t border-gray-100">
        <button 
          onClick={updateOligoOrdered}
          className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2"
        >
          Submit
        </button>
        
        <span className="text-xs text-gray-500">
          Selection required
        </span>
      </CardFooter>
    </Card>
  );
};

export default OligonucleotideOrderedView;
