// VariantSearchForm.tsx
// Author: Jason W. Labonte
// This file provides the code for a search form that locates valid enzyme
// variants.


// Imports
import { canonicalAAs } from "@/constants/biochemical";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/react";
import { useState, useEffect } from "react";


// Interfaces
interface Enzyme {
	abbr: string;
	active: boolean;
}

interface SequencePosition {
	Rosetta_resnum: number;
	resid: string;
}

interface VariantSearchFormProps {
	enzyme: string;
	variant: string;
	updateEnzyme: (new_enzyme: string) => void;
	updateVariant: (new_variant: string) => void;
}


// Main Component
// This form updates the enzyme abbreviation and variant ID for the selected
// variant. Variant IDs that are non-sensical will start with "?" or not end in
// an amino acid residue 1-letter code. The parent/calling component should
// test for this in the passed updating function.
export default function VariantSearchForm({
	enzyme,
	variant,
	updateEnzyme,
	updateVariant
}: VariantSearchFormProps) {
	// React Components
	// Set up stateful values and corresponding setters.
	const [resid, setResID] = useState<string>('?');
	const [resnum, setResnum] = useState<number>();
	const [resnum_upper_bound, setResnumUpperBound] = useState<number>(999);	// artificial upper bound
	const [resmut, setResmut] = useState<string>('');
	const [enzyme_list, setEnzymeList] = useState<Enzyme[]>([]);
	const [sequence, setSequence] = useState<SequencePosition[]>([]);

	// Construct function to be called anytime enzyme is changed.
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
				const activeEnzymes: Enzyme[] = [];
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

		async function fetchSequence() {
			try {
				const response = await fetch(
						`/api/getSequenceData?enzyme=${enzyme}`);
				if (!response.ok) {
					throw new Error(
							`GET /api/getSequenceData ${response.status} - Failed to fetch sequence data for ${enzyme}`);
				}
				const sequence = await response.json();
				if (!Array.isArray(sequence)) {
					throw new Error(
							"GET /api/getSequenceData - Invalid data format: Expected array");
				}
				setSequence(sequence);
				for (let i = sequence.length - 1; i >= 0; i-- ) {
					if (sequence[i].Rosetta_resnum != null) {
						setResnumUpperBound(sequence[i].Rosetta_resnum);
						break;
					}
				}
			} catch (error) {
				console.error("Error fetching sequence data:", error);
			}
		};

	fetchEnzymes();
		if (enzyme) {
			fetchSequence();
		}
	}, [enzyme]);


	// Helper Functions
	// Search the sequence data and return the one-letter residue code for the
	// given residue number or return '?'.
	function getResID(resnum: number):string {
		const found_residue = sequence.find(
				residue => residue.Rosetta_resnum == resnum);
		if (found_residue) { return found_residue.resid; }
		else { return '?'; }
	};

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
							updateVariant('');
							setResID('?');
							setResnum(undefined);
							setResmut('');
						}}
						placeholder="Select Enzyme"
						className="w-full md:w-[150px]"
					>
					{enzyme_list.map((enzyme) => (
						<SelectItem key={enzyme.abbr} value={enzyme.abbr}>
							{enzyme.abbr}
						</SelectItem>
					))}
					</Select>
				</div>


				{/* Residue Input */}
			{enzyme && (
				<div>
					<label htmlFor="residue" className="block mb-2">
						<abbr title="Wild Type">WT</abbr> Residue
					</label>
					<Input
						type="number"
						id="resnum"
						placeholder="#"
						value={String(resnum)}
						onChange={(e) => {
							setResID(getResID(Number(e.target.value)));
							setResnum(Number(e.target.value));
							updateVariant(
									getResID(
											Number(e.target.value)) + String(e.target.value) + resmut);
						}}
						size="md"
						variant="bordered"
						className="w-full md:w-[150px]"
						radius="sm"
						startContent={resid}
						isInvalid={
							((resnum != null) &&
									((resnum < 1) || (resnum > resnum_upper_bound))) ?
									true :
									false
						}
						errorMessage="Not a valid residue number"
					/>
				</div>
			)}


				{/* Variant AA Dropdown */}
			{resnum != null && (
				<div>
					<label htmlFor="enzyme" className="block mb-2">
						Variant Residue
					</label>
					<Select
					isRequired
					size="md"
					id="resmut"
					value={resmut}
					onChange={(e) => {
						setResmut(e.target.value);
						updateVariant(resid + String(resnum) + e.target.value);
					}}
					placeholder="Select AA"
					className="w-full md:w-[150px]"
					>
					{canonicalAAs.map((canonicalAA) => (
						<SelectItem key={canonicalAA} value={canonicalAA}>
							{canonicalAA}
						</SelectItem>
					))}
					</Select>
				</div>
			)}
			</div>
		</>
	);
}