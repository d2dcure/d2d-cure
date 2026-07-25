import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import { getPathwayInfo, getMechanismInfo, getAssayInfo } from "@/functions/database_functions";
import { useRouter } from "next/router";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { Accordion, AccordionItem, Image, Link } from "@nextui-org/react";
import { Tooltip } from "@nextui-org/tooltip";
import React, { useEffect, useState } from "react";


interface EnzymeGeneralInfo {
	year: number;
	full_name: string;
	species: string;
	EC_number: string;
	UniProt_number: string;
	PDB_entries: string;
	AlphaFold_entries: string;

	subunits: number;
	molar_mass: number;
	ext_coefficient: number;

	pathway_desc: string;
	assay_desc: string;

	coming_soon: boolean;
}

interface SequenceData {
	id: number;
	resnum: string;
	Rosetta_resnum: number | null;
	PDBresnum: string | null;
	resid: string;
}

const AboutEnzymePAge = () => {
	const router = useRouter();
	const { enzyme } = router.query;
	const [generalInfo, setGeneralInfo] = useState<EnzymeGeneralInfo>();
	const [sequenceData, setSequenceData] = useState<SequenceData[]>([]);
	const [characterizationData, setCharacterizationData] = useState<any[]>([]);

	// Fetch data whenever selected enzyme changes.
	useEffect(() => {
		const fetchData = async () => {
			try {
		// Fetch enzyme general information data.
		const infoResponse = await fetch(`/api/getEnzymeGeneralInfo?enzyme=${enzyme}`);
				if (infoResponse.ok) {
					const infoData = await infoResponse.json();
					setGeneralInfo(infoData);
				}

				// Fetch sequence data.
				const seqResponse = await fetch(`/api/getSequenceData?enzyme=${enzyme}`);
				if (seqResponse.ok) {
					const seqData = await seqResponse.json();
					setSequenceData(seqData);
				}

				// Fetch characterization data.
				const charResponse = await fetch('/api/getCharacterizationData');
				if (charResponse.ok) {
					const charData = await charResponse.json();
					setCharacterizationData(charData);
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};

		fetchData();
	}, [enzyme]);

	// Helper function to check if a residue has characterization data
	const hasCharacterizationData = (rosettaNum: number | null):boolean => {
		if (!rosettaNum) return false;
		return characterizationData.some(item => item.resnum === rosettaNum);
	};

	// Helper function to properly display HTML entities.
	const decodeHTML = (html:string):string => {
		var txt = document.createElement("textarea");
		txt.innerHTML = html;
		return txt.value;
	}


	// Prepopulate fields or use placeholder text.
	const abbr = (enzyme) ?	enzyme : "XxxX";
	const year = (generalInfo) ?	generalInfo.year : null;
	const full_name = (generalInfo) ?	decodeHTML(generalInfo.full_name) : "the enzyme";
	const species = (generalInfo) ?	generalInfo.species : "Genus species";
	const species_link = (species) ? `http://en.wikipedia.org/wiki/${species}` : '';
	const EC_number = (generalInfo) ?	generalInfo.EC_number : "";
	const EC_numbers = EC_number.split('.');
	const EC_link = `http://www.qmul.ac.uk/sbcs/iubmb/enzyme/EC${EC_numbers.at(0)}/${EC_numbers.at(1)}/${EC_numbers.at(2)}/${EC_numbers.at(3)}.html`;
	const UniProt_number = (generalInfo) ?	generalInfo.UniProt_number : "";
	const UniProt_link = `http://www.uniprot.org/uniprotkb/${UniProt_number}`;
	const PDB_entries = (generalInfo) ?	generalInfo.PDB_entries : "";
	const pdbs = (PDB_entries) ? PDB_entries.split(' ') : [];
	const PDB_link = (pdb:string):string => { return `http://www.rcsb.org/structure/${pdb}`; }
	const AlphaFold_entries = (generalInfo) ?	generalInfo.AlphaFold_entries : "";
	const models = (AlphaFold_entries) ? AlphaFold_entries.split(' ') : [];
	const AlphaFold_link = (model:string):string => { return `http://alphafold.ebi.ac.uk/entry/${model}`; } 
	
	const subunits = (generalInfo) ?	generalInfo.subunits : 1;
	const molar_mass = (generalInfo) ?	Intl.NumberFormat().format(generalInfo.molar_mass) : '';
	const ext_coefficient = (generalInfo) ?	Intl.NumberFormat().format(generalInfo.ext_coefficient) : '';

	const pathway_desc = (generalInfo) ?	decodeHTML(generalInfo.pathway_desc) : "Loading description…";
	const assay_desc = (generalInfo) ?	decodeHTML(generalInfo.assay_desc) : "Loading description…";

	const pretty_image = (enzyme) ? `/resources/images/pretty${abbr}.png` : '';
	const pretty_image_title = (enzyme) ? `3D Structure of ${enzyme}` : '';

	const coming_soon = (generalInfo) ?	generalInfo.coming_soon : false;

	const PathwayInfo = getPathwayInfo(enzyme as string);
	const MechanismInfo = getMechanismInfo(enzyme as string);
	const AssayInfo = getAssayInfo(enzyme as string);

	// TODO: Remove all the horrible hard-coding in this file!
	return (
		<>
			<NavBar />

			{/* Main Body: TODO: Add <main>? */}
			<div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
				{/* Breadcrumbs: TODO: Autogenerate, standardize, and import. */}
				<div className="max-w-7x1 mx-auto">
					<Breadcrumbs>
						<BreadcrumbItem href="/">Home</BreadcrumbItem>
						<BreadcrumbItem href="/about">About</BreadcrumbItem>
						<BreadcrumbItem>{abbr}</BreadcrumbItem>
					</Breadcrumbs>
				</div>

				{/* Page Title */}
				<div className="max-w-7x1 mx-auto pt-8 mb-4">
					<h2 className="mb-2 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
						About {full_name} ({abbr})
					</h2>
					{coming_soon && (
						<p>(Coming soon!)</p>
					)}
					{!coming_soon && (
						<p>(Added to D2D Network in {year})</p>
					)}
				</div>

				{/* Sub-Sections */}
				<div className="max-w-7x1 mx-auto pt-8 mb-4">

					{/* General Information Sub-Section: 2 Columns */}
					<div className="inline-grid grid-cols-2 grid-rows-1 gap-4 w-full">
						{/* Column 1*/}
						<div>
							{/* Idenifiers Sub-sub Section */}
							<div className="space-y-2 mb-8">
								<h4>Identifiers</h4>
								<div className="flex items-center gap-3">
									<span className="font-semibold w-44 text-sm text-gray-600">
										Species:
									</span>
									<Link
										href={species_link}
										className="text-sm text-blue-500"
										underline="hover"
										isExternal
										showAnchorIcon
									>
										<i>{species}</i>
									</Link>
								</div>
								<div className="flex items-center gap-3">
									<span className="font-semibold w-44 text-sm text-gray-600">
										<abbr title="Enzyme Commission">EC</abbr> Number:
									</span>
									<Link
										href={EC_link}
										className="text-sm text-blue-500"
										underline="hover"
										isExternal
										showAnchorIcon
									>
										{EC_number}
									</Link>
								</div>
								<div className="flex items-center gap-3">
									<span className="font-semibold w-44 text-sm text-gray-600">
										<abbr title="Universal Protein Resource">UniProt</abbr> Number:
									</span>
									<Link
										href={UniProt_link}
										className="text-sm text-blue-500"
										underline="hover"
										isExternal
										showAnchorIcon
									>
										{UniProt_number}
									</Link>
								</div>
							{PDB_entries && (
								<div className="flex items-center gap-3">
									<span className="font-semibold w-44 text-sm text-gray-600">
										<abbr title="Protein Data Bank">PDB</abbr> Entries:
									</span>
									<div className="flex flex-wrap gap-2 text-sm">
									{pdbs.map((pdb) => (
										<Link
											key={pdb}
											href={PDB_link(pdb)}
											className="text-sm text-blue-500"
											underline="hover"
											isExternal
											showAnchorIcon
										>
											{pdb}
										</Link>
									))}
									</div>
								</div>
							)}
							{AlphaFold_entries && (
								<div className="flex items-center gap-3">
									<span className="font-semibold w-44 text-sm text-gray-600">
										AlphaFold Entries:
									</span>
									<div className="flex flex-wrap gap-2 text-sm">
									{models.map((model) => (
										<Link
											key={model}
											href={AlphaFold_link(model)}
											className="text-sm text-blue-500"
											underline="hover"
											isExternal
											showAnchorIcon
										>
											AF-{model}
										</Link>
									))}
									</div>
								</div>
							)}
							</div>

							{/* Properties Sub-sub Section */}
							<div className="space-y-2 mb-4">
								<h4>Properties</h4>
								<div className="flex items-center gap-3">
									<span className="font-semibold w-44 text-sm text-gray-600">
										Subunits (in active form):
									</span>
									<span className="text-sm text-gray-600">{subunits}</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="font-semibold w-44 text-sm text-gray-600">
										Molar Mass (<i>M</i>, per subunit):
									</span>
									<span className="text-sm text-gray-600">
										{molar_mass}{' '}
										<abbr title="daltons (g/mol)">Da</abbr>
									</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="font-semibold w-44 text-sm text-gray-600">
										Extinction Coefficient (ε):
									</span>
									<span className="text-sm text-gray-600">
										{ext_coefficient}{' '}
										<abbr title="inverse molar per centimeter">
											ᴍ<sup>&minus;1</sup> cm<sup>&minus;1</sup>
										</abbr>
									</span>
								</div>
							</div>
						</div>

						{/* Column 2: Image */}
						<div>
							<Image 
								src={pretty_image}
								title={pretty_image_title}
								alt="3D Structure"
								className="w-[280px] sm:w-[320px] lg:w-[350px] max-w-full"
							/>
						</div>
					</div>

					{/* Detailed Description Sub-Section 1 Column */}
					<div className="w-full pt-8 mb-4">
						<p className="text-gray-600 text-justify mb-4">
							{pathway_desc}
						</p>
						<Accordion isCompact variant="shadow">
							<AccordionItem
								key="1"
								title="Biochemical Pathway"
								className="text-gray-600 text-justify"
							>
								<PathwayInfo />
							</AccordionItem>
							<AccordionItem
								key="2"
								title="Reaction Mechanism"
								className="text-gray-600 text-justify"
							>
								<MechanismInfo />
							</AccordionItem>
						</Accordion>
						<p className="text-gray-600 text-justify pt-4 mb-4">
							{assay_desc}
						</p>
						<Accordion isCompact variant="shadow">
							<AccordionItem
								key="3"
								title="Assay Chemistry"
								className="text-gray-600 text-justify"
							>
								<AssayInfo />
							</AccordionItem>
						</Accordion>
					</div>

					{/* Sequence Sub-Section */}
					<div className="w-full pt-8 mb-4">
						<h3 className="mb-4 text-3xl md:text-4xl font-light">
							Full {abbr} Sequence
						</h3>
					{!sequenceData && (
						<p className="text-gray-600 text-justify mb-4">
							No sequence data found for this enzyme.
						</p>
					)}
					{sequenceData && (
						<>
						<p className="text-gray-600 text-justify mb-4">
							One-letter amino acid residue codes in plain type
							(not bold), if present, were not resolved in the
							crystal structure of the enzyme used for our design
							study
							{(pdbs[0]) ?
								(
									<>
									{" ("}<Link
										href={PDB_link(pdbs[0])}
										className="text-sm text-blue-500"
										underline="hover"
										isExternal
										showAnchorIcon
									>
										PDB #{pdbs[0]}
									</Link>{')'}
									</>
								) :
								''
							}
							.
							Undelrined one-letter codes are catalytic residues.
							Hovering over any one-letter code in the sequence
							will give that residue’s sequence numbers/positions.
							One-letter codes in blue have parameter data stored in our database.
							Clicking any blue one-letter code will take you to a
							list of studied variants at that position. 
						</p>

						{/* Sequence */}
						<div className="px-6 md:px-12 lg:px-24 py-6 font-mono text-lg leading-loose break-words">
							{sequenceData.map((residue, index) => {
								const hasStructure = residue.PDBresnum !== null;
								const hasData = hasCharacterizationData(residue.Rosetta_resnum);

								return (
									<React.Fragment key={residue.id}>
										<Tooltip
											content={
												<div className="text-sm">
													{`${residue.resid}${residue.resnum}`}
													{residue.Rosetta_resnum && (
														<>
															<br />
															{`Rosetta/Foldit: ${residue.resid}${residue.Rosetta_resnum}`}
														</>
													)}
													{residue.PDBresnum && (
														<>
															<br />
															{`PDB: ${residue.resid}${residue.PDBresnum}`}
														</>
													)}
												</div>
											}
										>
											<span 
												className={`
													${hasData ? 'text-blue-500 cursor-pointer' : 'text-black'}
													${hasStructure ? 'font-bold' : ''}
												`}
												onClick={() => {
													if (hasData && residue.Rosetta_resnum) {
														window.location.href = `/database/characterization_data/${enzyme}?highlight=${residue.Rosetta_resnum}`;
													}
												}}
											>
												{residue.resid}
											</span>
										</Tooltip>
										{(index + 1) % 10 === 0 ? ' ' : ''}
									</React.Fragment>
								);
							})}
						</div>
						</>
					)}
					</div>

					{/* Publications Sub-Section */}
					<div className="w-full pt-8 mb-4">
						<h3 className="mb-4 text-3xl md:text-4xl font-light">Publications Related to {enzyme}</h3>
						<p  className="mb-6 text-gray-600">Coming soon...</p>
					</div>
				</div>
			</div>

			<Footer />
		</>
	);
};

export default AboutEnzymePAge;




