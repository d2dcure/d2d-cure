import React, { useState, useEffect } from 'react';
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
import {Input} from "@nextui-org/input";  // TODO: Change to NumberInput to remove up-down stepper.
import {Select, SelectItem} from "@nextui-org/select";


interface ProteinYieldViewProps {
	enzyme: string;
	entryData: any;
	setCurrentView: (view: string) => void;
	updateEntryData: (newData: any) => void; 
}

interface EnzymeParameters {
	molar_mass: number;
	ext_coefficient: number;
}


const ProteinYieldView: React.FC<ProteinYieldViewProps> = ({
	enzyme,
	entryData,
	setCurrentView,
	updateEntryData
}) => {
	const [yieldVal, setYieldVal] = useState<number>(); 
	const [selectedUnit, setSelectedUnit] = useState<string>('');
	const [enzymeParameters, setEnzymeParameters] = useState<EnzymeParameters>();
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch enzyme parameters needed for Beer's Law calculations of conc.
	useEffect(() => {
		const fetchEnzymeInfo = async () => {
			try {
				// Fetch enzyme general parameters.
				const infoResponse = await fetch(`/api/getEnzymeGeneralInfo?enzyme=${enzyme}`);
				if (infoResponse.ok) {
					const infoData = await infoResponse.json();
					setEnzymeParameters(infoData);
				}
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};

		fetchEnzymeInfo();
	}, [enzyme]);

	const mapYieldUnits = (value: string): "A280_" | "mg_mL_" | "mM_" | "M_" => {
		switch (value.trim()) {
			case "A280*":
				return "A280_";
			case "mg/mL":
				return "mg_mL_";
			case "mM":
				return "mM_";
			case "M":
				return "M_";
			default:
				throw new Error(`Invalid yield_units value: ${value}`);
		}
	};

  const updateYield = async () => {
    setIsSubmitting(true);
    //const roundedValue = parseFloat(parseFloat(yieldVal.toFixed(2));
    try {
      const yield_units_mapped = mapYieldUnits(selectedUnit);

      // Update CharacterizationData
      const response2 = await fetch('/api/updateCharacterizationDataYieldAvg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
		  enzyme: enzyme,
          id: entryData.id,
          yield_avg: yieldVal,
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
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to checklist
        </button>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-800">Protein Yield</h2>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            entryData.yield_avg !== null 
              ? "text-green-700 bg-green-100" 
              : "text-yellow-700 bg-yellow-100"
          }`}>
            {entryData.yield_avg !== null ? "Complete" : "Incomplete"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Enter the value of your measurement of protein yield,
		  and <strong>be sure to also select the correct units</strong>{' '}
		  from the dropdown menu.{' '}
		  {'('}Measurements can be provided as absorbances
		  or concentrations.
		  Absorbances will automatically be converted to concentrations
		  using Beer&apos;s Law.{')'}
        </p>
      </CardHeader>

      <CardBody className="px-6 py-6 space-y-6">
        <div className="space-y-6">
          <div className="flex gap-4">
            <Input
				isRequired
              type="number"
              label="Value"
              value={yieldVal?.toString()}
              onChange={(e) => setYieldVal(Number(e.target.value))}
              step="0.01"
              classNames={{
                label: "text-default-600 text-small",
                input: "text-small",
              }}
            />
            <Select
				isRequired
              label="Units"
              selectedKeys={selectedUnit ? [selectedUnit] : []}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-32"
            >
              <SelectItem key="mg/mL" value="mg/mL">mg/mL</SelectItem>
              	<SelectItem key="A280*" value="A280*">
					&#120328;&#8322;&#8328;&#8320;&dagger;
				</SelectItem>
              <SelectItem key="mM" value="mM">mᴍ</SelectItem>
              <SelectItem key="M" value="M">ᴍ</SelectItem>
            </Select>
          </div>
          
          {/* Add the new informational text for A280 */}
          {selectedUnit === 'A280*' && (
            <div className="text-small text-gray-600 italic">
              <sup>&dagger;</sup>If used,
			  raw A<sub>280</sub> values should be preadjusted for a path length of 1 cm.
            </div>
          )}

          {/* Current value display */}
			<div className="text-sm text-gray-600 flex items-center gap-2">
				<svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			{entryData.yield_avg !== null && (
				<p>
					Current <abbr title="concentration">
						<i>c</i>
					</abbr> ={" "}
					<span className="font-medium text-gray-900">
						{entryData.yield_avg.toFixed(2)}
					</span>&nbsp;<abbr title="milligrams per milliliter">mg/mL</abbr>
				</p>
			)}

			{yieldVal && selectedUnit && (
				<p>
					New <abbr title="concentration">
						<i>c</i>
					</abbr> ={" "}
					<span className="font-medium text-gray-900">
						{entryData.yield_avg.toFixed(2)}
					</span>&nbsp;<abbr title="milligrams per milliliter">mg/mL</abbr>
				</p>
			)}
			</div>

		  {/* Extra explanatory material */}
		  <p className="text-sm text-gray-600">
		  		<strong>Note:</strong>{' '}
				Enter the initial protein yield here,{' '}
				<em>not</em> whatever diluted concentration that you used for
				any assays performed.
				Submission of data for individual assays will include a field
				for recording dilution factors used for that assay.
				{selectedUnit}
		  </p>
        </div>
      </CardBody>

      <CardFooter className="px-6 pb-6 pt-6 flex justify-between items-center border-t border-gray-100">
        <button 
          onClick={updateYield}
          className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors focus:ring-2 focus:ring-[#06B7DB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
			!yieldVal ||
			!selectedUnit ||
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
            'Submit'
          )}
        </button>
        
        <span className="text-xs text-gray-500">
          *Both value and units are required.
        </span>
      </CardFooter>
    </Card>
  );
};

export default ProteinYieldView;
