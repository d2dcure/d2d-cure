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
	molar_mass: number;  // g/mol
	ext_coefficient: number;  // M^-1 cm^-1
}


const ProteinYieldView: React.FC<ProteinYieldViewProps> = ({
	enzyme,
	entryData,
	setCurrentView,
	updateEntryData
}) => {
	const [yieldVal, setYieldVal] = useState<number>(entryData.yield_avg ? entryData.yield_avg : 0); 
	const [selectedUnit, setSelectedUnit] = useState<string>(entryData.yield_avg != null ? "mg_per_mL" : '');
	const [enzymeParameters, setEnzymeParameters] = useState<EnzymeParameters>();
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [pathLength, setPathLength] = useState<number>(1);  // cm

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

	// Helper function that calculates concentration given a value and units.
	// If aborbance is passed, Beers's Law is used.
	// If molarity is passed, uses molar mass.
	// Returns a value in mg/mL.
	const calculateConcentration = (): number => {
		const epsilon_enz = enzymeParameters?.ext_coefficient;
		const molar_mass_enz = enzymeParameters?.molar_mass;
		if (!epsilon_enz || !molar_mass_enz) { return 0; }
		switch(selectedUnit) {
			case "mg_per_mL":
				// already in the correct units
				return yieldVal;
			case "absorbance":
				// Use Beer's Law.
				const c_enz_molar = yieldVal / (epsilon_enz * pathLength);
				return c_enz_molar * molar_mass_enz;
			case "molar":
				return yieldVal * molar_mass_enz;  // mg/mL = g/L
			case "millimolar":
				return yieldVal * molar_mass_enz / 1000;
			case "micromolar":
				return yieldVal * molar_mass_enz / 1000000;
			default:
				return 0;  // should never reach here
		} 
	};

	const updateYield = async () => {
		setIsSubmitting(true);
		try {
			// Update yield.
			const response = await fetch("/api/updateCharacterizationDataYieldAvg", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					enzyme: enzyme,
					id: entryData.id,
					yield_avg: calculateConcentration(),
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to update yield average in CharacterizationData.");
			}

			const updatedEntry = await response.json();
			updateEntryData(updatedEntry);
			setCurrentView("checklist");
		} catch (error) {
			console.error("Error updating yield average:", error);
		} finally {
			setIsSubmitting(false);
		}

		// Only set the expressed flag if the gel has not been run.
		if (entryData.band_visible === null) {
			try {
				// Update expressed flag.
				const response = await fetch("/api/updateCharacterizationDataExpressed", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						enzyme: enzyme,
						id: entryData.id,
						expressed: calculateConcentration() >= 0.2,
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to update expression status in CharacterizationData.");
				}

				const updatedEntry = await response.json();
				updateEntryData(updatedEntry);
				setCurrentView("checklist");
			} catch (error) {
				console.error("Error updating expression status:", error);
			} finally {
				setIsSubmitting(false);
			}
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
              value={yieldVal.toString()}
              onChange={(e) => setYieldVal(Number(e.target.value))}
              step="0.01"
			  isInvalid={yieldVal < 0}
				errorMessage="Negative values for yield are impossible."
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
              className="w-48"
            >
              	<SelectItem key="mg_per_mL" value="mg_per_mL">mg/mL</SelectItem>
              	<SelectItem key="absorbance" value="absorbance">
					&#120328;&#8322;&#8328;&#8320;&dagger;
				</SelectItem>
				<SelectItem key="molar" value="molar">ᴍ</SelectItem>
              	<SelectItem key="millimolar" value="millimolar">mᴍ</SelectItem>
				<SelectItem key="micromolar" value="micromolar">μᴍ</SelectItem>
            </Select>
			{selectedUnit === "absorbance" && (
            <Input
				isRequired
              type="number"
              label="Path length"
              value={pathLength.toString()}
			  endContent="cm"
              onChange={(e) => setPathLength(Number(e.target.value))}
              step="0.01"
			  isInvalid={pathLength <= 0}
				errorMessage="Negative or null values for path length are impossible."
              classNames={{
				base: "w-48",
                label: "text-default-600 text-small",
                input: "text-small",
              }}
            />
			)}
          </div>
          
          {/* Add the new informational text for A280 */}
          {selectedUnit === "absorbance" && (
            <div className="text-small text-gray-600">
              <sup>&dagger;</sup>Raw <i>A</i><sub>280</sub> values can only be used
			  to report on protein yield if the path length is also known.{' '}
			  <em>Some</em> instruments preadjust the reported value of <i>A</i>{' '}
			  for a path length of 1&nbsp;cm,
			  even if that is not the actual path length.
			  If that is the case for your instrument,
			  set the path length here to <code>1&nbsp;cm</code>.
			  Otherwise, enter the path length for your case.{' '}
			  <strong>
				It is imperative that the path length not be misreported!
			  </strong>
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

			{selectedUnit && (
				<p>
					New <abbr title="concentration">
						<i>c</i>
					</abbr> ={" "}
					<span className="font-medium text-gray-900">
						{calculateConcentration().toFixed(2)}
					</span>&nbsp;<abbr title="milligrams per milliliter">mg/mL</abbr>
				</p>
			)}
			</div>

		  {/* Extra explanatory material */}
		  {selectedUnit && (calculateConcentration() < 0.2) && !entryData.band_visible && (
			<p className="text-sm text-gray-600">
				A protein with a concentration less than 0.2 mg/mL in yield
				is considered <em>not</em> to have expressed,{' '}
				<em>unless</em> a potein band is clearly visible in the
				uploaded{' '}
				<abbr title="Sodium Dodecyl Sulfate–PolyacrylAmide Gel Electrophoresis">
					SDS-PAGE
				</abbr> gel.
				A protein not expressing is <strong>still useful data!</strong>
				{' '}Please <em>do</em> submit this dataset for curation.
			</p>
		  )}
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
			!selectedUnit ||
			yieldVal < 0 ||
			pathLength <= 0 ||
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
          *Both value and units are required.
        </span>
      </CardFooter>
    </Card>
  );
};

export default ProteinYieldView;
