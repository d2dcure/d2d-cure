// VariantSearchForm.tsx
// Author: Jason W. Labonte
// This file provides the code for a search form that locates valid enzyme
// variants.


// Imports
import { Select, SelectItem } from "@nextui-org/react";
import { useState, useEffect } from "react";


interface VariantSerachFormProps {
	enzyme: string;
	variant: string;
	updateEnzyme: (new_enzyme: string) => void;
	updateVariant: (new_variant: string) => void;
}


export default function VariantSearchForm({
	enzyme,
	variant,
	updateEnzyme,
	updateVariant
}: VariantSerachFormProps) {
	// Set up stateful values and corresponding setters.
	const [resid, setResID] = useState<string>('?');
	const [resnum, setResnum] = useState<number>();
	const [resmut, setResmut] = useState<string>('');
	const [enzymeList, setEnzymeList] = useState<any[]>([]);

	
	// Call anytime enzyme is changed.
	useEffect(() => {
		async function fetchEnzymes() {
			try {
				const response = await fetch("/api/getEnzymes");
				if (!response.ok) {
					throw new Error(
							`GET /api/getEnzymes ${response.status} - Failed to fetch enzymes`);
				}
				const enzymes = await response.json();
				if (!Array.isArray(enzymes)) {
					throw new Error(
							"GET /api/getEnzymes - Invalid data format: Expected array");
				}
				const activeEnzymes: any[] = [];
				for (let enzyme of enzymes) {
					if (enzyme.active === true) {
						activeEnzymes.push(enzyme);
					}
				}
				setEnzymeList(activeEnzymes);
			} catch (error) {
				console.error('Error fetching enzymes:', error);
			}
		};
	fetchEnzymes();
		if (enzyme) {
			//fetchSequenceData();
		}
	}, [enzyme]);


	return (
		<>
			<div className="inline-grid grid-cols-3 grid-rows-1 gap-4">
				{/* Enzyme Dropdown */}
				<div>
					<label htmlFor="enzyme" className="block mb-2">
						Enzyme
					</label>
					<Select
						isRequired
						size="md"
						id="enzyme"
						value={enzyme}
						onChange={(e) => {
							updateEnzyme(e.target.value);
							setResID('?');
							setResnum(undefined);
							setResmut('');
						}}
						placeholder="Select Enzyme"
						className="w-full md:w-[150px]"
					>
					{enzymeList.map((enzyme) => (
						<SelectItem key={enzyme.abbr} value={enzyme.abbr}>
							{enzyme.abbr}
						</SelectItem>
					))}
					</Select>
				</div>
			</div>

			<p>Result: {enzyme} {variant}</p>
		</>
	);
}