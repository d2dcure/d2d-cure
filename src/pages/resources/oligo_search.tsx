import { ErrorChecker } from "@/components/ErrorChecker";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { useState, useEffect } from "react";
import VariantSearchForm from "@/components/VariantSearchForm"


// Copied from InfoSidebar
// TODO: Move to shared location.
const useClipboard = () => {
  const [copied, setCopied] = useState(false);
  
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { copied, copy };
};


const OligoSearchPage = () => {
	const [enzyme, setEnzyme] = useState<string>('');
	const [resID, setResID] = useState<string>('?');
	const [resnum, setResnum] = useState<number>();
	const [resmut, setResmut] = useState<string>('');
	const [enzymeVariant, setEnzymeVariant] = useState<string>('');
	const [sequenceData, setSequenceData] = useState<any[]>([]);
	const [oligosData, setOligosData] = useState<any[]>([]);
	const [isError, setIsError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState('');

	const clipboard = useClipboard();  // Copied from InfoSidebar


	// Construct function to be called anytime enzyme is changed.
	useEffect(() => {
		const fetchOligosData = async () => {
			try {
				const response = await fetch(`/api/getOligos?enzyme=${enzyme}`);
				if (!response.ok) {
					throw new Error(
							`GET /api/getOligos ${response.status} - Failed to fetch oligos`);
				}
				const data = await response.json();
				if (!Array.isArray(data)) {
					throw new Error(
							'GET /api/getOligos - Invalid data format: Expected array');
				}
				setOligosData(data);
			} catch (error) {
				console.error('Error fetching oligos:', error);
				setIsError(true);
				setErrorMessage(
						error instanceof Error ?
						error.message :
						`Failed to fetch oligos for ${enzyme}`);
			}
		};

		const fetchSequenceData = async () => {
			try {
				const response = await fetch(
						`/api/getSequenceData?enzyme=${enzyme}`);
				if (!response.ok) {
					throw new Error(
							`GET /api/getSequenceData ${response.status} - Failed to fetch sequence data for ${enzyme}`);
				}
				const sequenceData = await response.json();
				if (!Array.isArray(sequenceData)) {
					throw new Error(
							"GET /api/getSequenceData - Invalid data format: Expected array");
				}
				setSequenceData(sequenceData);
			} catch (error) {
				console.error("Error fetching sequence data:", error);
				setIsError(true);
				setErrorMessage(
					error instanceof Error ?
					error.message :
					`Failed to fetch sequence data for ${enzyme}`);
			}
		};

		if (enzyme) {
			fetchSequenceData();
			fetchOligosData();
		}
	}, [enzyme]);


	// Helper functions
	// Return the variant using PDB numbering.
	const getPDBNumbering = ():string => {
		if (enzymeVariant) {
			const resid = enzymeVariant.at(0);
			const resnum = Number(enzymeVariant.slice(1,-1));
			const resmut = enzymeVariant.at(-1);
			const foundResidue = sequenceData.find(
					residue => residue.Rosetta_resnum == resnum);
			if (foundResidue) {
				const PDBresnum = foundResidue.PDBresnum;
				if (PDBresnum) {
					return resid + PDBresnum + resmut;
				}
			}
		}
		return "missing from PDB";
	}

	const findOligo = () => {
		const foundOligo = oligosData.find(oligo => oligo.variant === enzymeVariant);
		if (foundOligo) {
			return foundOligo.oligo;
		} else {
			return "No matching oligo found for the specified variant."
		}
	};


	// Functions to pass to child component
	const updateEnzyme = (new_enzyme: string) => {
    	setEnzyme(new_enzyme);
	};

	const updateEnzymeVariant = (new_variant: string) => {
		// Only update if a valid variant string.
		if ((new_variant.at(0) != '?') && (isNaN(Number(new_variant.slice(-1))))) {
    		setEnzymeVariant(new_variant);
		} else {  // If not, blank the variant string.
			setEnzymeVariant('');
		}
	};


	return (
		<ErrorChecker 
			isError={isError} 
			errorMessage={errorMessage}
			errorType="api"
		>
			<NavBar />
			<div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 mb-10 bg-white">
				<div className="max-w-7xl mx-auto">
					<Breadcrumbs>
						<BreadcrumbItem href="/">Home</BreadcrumbItem>
						<BreadcrumbItem href="/resources">Resources</BreadcrumbItem>
						<BreadcrumbItem>Oligo Search</BreadcrumbItem>
					</Breadcrumbs>
					
					<div className="pt-8">
						<h2 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
							Oligo Search
						</h2>
						<p className="mb-4 text-justify  text-gray-600 max-w-2xl">
							Select the enzyme and
							choose an enzyme variant
							(using Rosetta/Foldit numbering)
							to search for a reverse-compliment,
							codon-optimized <abbr title="DeoxyriboNucleic Acid">DNA</abbr> 33-mer 
							for use as a primer for the gene mutant for that variant.
						</p>
						<p className="mb-4 text-justify  text-gray-600 max-w-2xl">
							Tip: If you are in the D2D Network,
							you can also get a primer sequence
							by simply starting the process of{" "}
							<a href="../submit?single_variant=1">submitting data</a>{" "}
							for an enzyme variant.
						</p>
						<p className="mb-12 text-justify  text-gray-600 max-w-2xl">
							Note: Primers may not be feasible
							for the first and last several residues in an enzyme sequence.
						</p>

						<h3 className="text-lg font-semibold">Search Form</h3>
						<VariantSearchForm
							enzyme={enzyme}
							variant={enzymeVariant}
							updateEnzyme={updateEnzyme}
							updateVariant={updateEnzymeVariant}
						/>

						{/* Search Results */}
					{enzyme && enzymeVariant && (
						<div className="mt-8 space-y-4">
							<h3 className="text-lg font-semibold">Results</h3>
							<div className="text-gray-600">
								<p className="mb-4 text-justify  text-gray-600 max-w-2xl">
									The optimized DNA oligomer sequence to use as a DNA primer for the
									production of {enzyme} variant{" "}
									<strong>{enzymeVariant}</strong>{" "}
									(<abbr title="Protein DataBank">PDB</abbr>{" "}
									numbering: {getPDBNumbering()}) is:
								</p>
								<p
									className="text-black font-bold break-words cursor-pointer hover:text-[#06B7DB]"
									onClick={() => clipboard.copy(findOligo())}
                					title="Click to copy"
								>
									{findOligo()}
								</p>
							</div>
						</div>
					)}
					</div>
				</div>
			</div>
			<Footer />
		</ErrorChecker>
	);
};

export default OligoSearchPage;