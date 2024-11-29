import React, { useState, useEffect } from 'react';
import {Input} from "@nextui-org/input";
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";

interface ProteinModeledViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
  updateEntryData: (newData: any) => void; 
}

interface ValidationMessage {
  type: 'error' | 'warning';
  message: string;
  field: 'WT' | 'variant';
}

const ProteinModeledView: React.FC<ProteinModeledViewProps> = ({ entryData, setCurrentView, updateEntryData }) => {
  const [WT, setWT] = useState<string>('');
  const [variant, setVariant] = useState<string>('');
  const [validationMessages, setValidationMessages] = useState<ValidationMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expectedWTScore = -1089.697; // Example expected score

  const validateScores = () => {
    let isValid = true;
    const messages: ValidationMessage[] = [];
    const wtScore = parseFloat(WT);
    const variantScore = parseFloat(variant);

    if (!isNaN(wtScore) && !isNaN(variantScore)) {
      if (wtScore !== expectedWTScore) {
        messages.push({
          type: 'warning',
          message: `The expected score for the WT enzyme is ${expectedWTScore}. Please confirm and resubmit.`,
          field: 'WT'
        });
        isValid = false;
      }

      if (wtScore === variantScore) {
        messages.push({
          type: 'warning',
          message: 'It is highly unlikely for both WT and Variant scores to be the same. Please confirm.',
          field: 'variant'
        });
        isValid = false;
      }

      const delta = variantScore - wtScore;
      if (delta < -20 || delta > 20) {
        messages.push({
          type: 'error',
          message: 'Variants rarely express if the change in score is greater than 20. Please review the values.',
          field: 'variant'
        });
        isValid = false;
      }
    } else {
      if (isNaN(wtScore)) {
        messages.push({
          type: 'error',
          message: 'Please enter a valid number for WT score',
          field: 'WT'
        });
        isValid = false;
      }
      if (isNaN(variantScore)) {
        messages.push({
          type: 'error',
          message: 'Please enter a valid number for Variant score',
          field: 'variant'
        });
        isValid = false;
      }
    }

    setValidationMessages(messages);
    return isValid;
  };

  // Add useEffect to validate on input change
  useEffect(() => {
    if (WT || variant) {
      validateScores();
    }
  }, [WT, variant]);

  const updateRosettaScore = async () => {
    const isValid = validateScores();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/updateCharacterizationDataRosettaScore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entryData.id,
          Rosetta_score: parseFloat(variant) - parseFloat(WT),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update Rosetta score');
      }

      const updatedEntry = await response.json();
      updateEntryData(updatedEntry);
      setCurrentView('checklist');
    } catch (error) {
      console.error('Error updating Rosetta score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get messages for a specific field
  const getMessagesForField = (field: 'WT' | 'variant') => {
    return validationMessages.filter(msg => msg.field === field);
  };

  // Add helper function to check if all validations pass
  const allChecksPass = () => {
    return WT && variant && validationMessages.length === 0;
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
          <h2 className="text-xl font-bold text-gray-800">Foldit Scores</h2>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            entryData.Rosetta_score !== null 
              ? "text-green-700 bg-green-100" 
              : "text-yellow-700 bg-yellow-100"
          }`}>
            {entryData.Rosetta_score !== null ? "Complete" : "Incomplete"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Enter the Foldit scores for F253M BglB from UC Davis
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6 space-y-6">
        <div className="space-y-6">
          <div>
            <Input
              type="text"
              label="WT (starting) score"
              value={WT}
              onChange={(e) => setWT(e.target.value)}
              classNames={{
                label: "text-default-600 text-small",
                input: "text-small",
              }}
            />
            {getMessagesForField('WT').map((msg, index) => (
              <div 
                key={index}
                className={`mt-2 text-sm flex items-center gap-2 ${
                  msg.type === 'error' ? 'text-red-600' : 'text-yellow-700'
                }`}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {msg.message}
              </div>
            ))}
          </div>

          <div>
            <Input
              type="text"
              label="Variant (ending) score"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              classNames={{
                label: "text-default-600 text-small",
                input: "text-small",
              }}
            />
            {getMessagesForField('variant').map((msg, index) => (
              <div 
                key={index}
                className={`mt-2 text-sm flex items-center gap-2 ${
                  msg.type === 'error' ? 'text-red-600' : 'text-yellow-700'
                }`}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {msg.message}
              </div>
            ))}
          </div>
        </div>

        {/* Simplified current score display */}
        {entryData.Rosetta_score !== null && (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Current Rosetta score: <span className="font-medium text-gray-900">{entryData.Rosetta_score}</span>
          </div>
        )}
      </CardBody>

      <CardFooter className="px-6 pb-6 pt-6 flex justify-between items-center border-t border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={updateRosettaScore}
            className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!WT || !variant || validationMessages.length > 0 || isSubmitting}
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

          {/* Move success message here */}
          {allChecksPass() && (
            <div className="text-sm text-green-600 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              All checks passed!
            </div>
          )}
        </div>
        
        <span className="text-xs text-gray-500">
          All fields are required
        </span>
      </CardFooter>
    </Card>
  );
};

export default ProteinModeledView;
