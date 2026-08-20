import React, { useState } from 'react';
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
import {RadioGroup, Radio} from "@nextui-org/radio";


interface ProteinBandVisibleViewProps {
	enzyme: string;
	entryData: any;
	setCurrentView: (view: string) => void;
	updateEntryData: (newData: any) => void; 
}


const ProteinBandVisibleView: React.FC<ProteinBandVisibleViewProps> = ({
	enzyme,
	entryData,
	setCurrentView,
	updateEntryData
}) => {
	const [bandVisible, setBandVisible] = useState(entryData.band_visible);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const updateProteinBandVisible = async () => {
		setIsSubmitting(true);
		try {
			const response = await fetch("/api/updateCharacterizationDataBandVisible", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					enzyme: enzyme,
					id: entryData.id,
					band_visible: bandVisible
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to update protein band-visibility status.");
			}
			
			const updatedEntry = await response.json();
			updateEntryData(updatedEntry);
			setCurrentView("checklist");
		} catch (error) {
			console.error("Error updating protein band-visibility status:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-4 border-b border-gray-100">
        <button 
          className="text-[#06B7DB] hover:text-[#05a5c6] text-sm mb-4 flex items-center gap-2 transition-colors"
          onClick={() => setCurrentView("checklist")}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to checklist
        </button>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-800">SDS-PAGE Gel Protein Band-Visibility Status</h2>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            entryData.band_visible 
              ? "text-green-700 bg-green-100" 
              : "text-yellow-700 bg-yellow-100"
          }`}>
            {entryData.band_visible ? "Complete" : "Incomplete"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Can you see the protein band in the{' '}
			<abbr title="Sodium Dodecyl Sulfate–PolyacrylAmide Gel Electrophoresis">
				SDS-PAGE
			</abbr>
		  {' '}gel?
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6 space-y-6">
        <div className="space-y-4">
			<RadioGroup
				isRequired
				label="Band visible?"
				defaultValue={
					(entryData.band_visible !== null)
					? `${entryData.band_visible ? "yes" : "no"}`
					: ''
				}
				orientation="horizontal"
				onChange={(e) => setBandVisible(e.target.value === "yes")}
			>
				<Radio value="yes">Yes</Radio>
				<Radio value="no">No</Radio>
			</RadioGroup>
        </div>
      </CardBody>

      <CardFooter className="px-6 pb-6 pt-6 flex justify-between items-center border-t border-gray-100">
        <button 
          onClick={updateProteinBandVisible}
          className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
			(bandVisible === null) ||
			isSubmitting ||
			entryData.curated
			}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting&hellip;
            </>
          ) : (
            "Submit"
          )}
        </button>

		<span className="text-xs text-gray-500">
          *Response required.
        </span>
      </CardFooter>
    </Card>
  );
};

export default ProteinBandVisibleView;
