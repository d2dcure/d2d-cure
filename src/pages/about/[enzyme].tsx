import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import { getPathwayInfo } from "@/functions/database_functions";
import { useRouter } from "next/router";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { Accordion, AccordionItem, Card, CardBody, Image, Link } from "@nextui-org/react";
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
  const abbr = (enzyme) ?  enzyme : "XxxX";
  const year = (generalInfo) ?  generalInfo.year : null;
  const full_name = (generalInfo) ?  decodeHTML(generalInfo.full_name) : "the enzyme";
  const species = (generalInfo) ?  generalInfo.species : "Genus species";
  const species_link = (species) ? `http://en.wikipedia.org/wiki/${species}` : '';
  const EC_number = (generalInfo) ?  generalInfo.EC_number : "";
  const EC_numbers = EC_number.split('.');
  const EC_link = `http://www.qmul.ac.uk/sbcs/iubmb/enzyme/EC${EC_numbers.at(0)}/${EC_numbers.at(1)}/${EC_numbers.at(2)}/${EC_numbers.at(3)}.html`;
  const UniProt_number = (generalInfo) ?  generalInfo.UniProt_number : "";
  const UniProt_link = `http://www.uniprot.org/uniprotkb/${UniProt_number}`;
  const PDB_entries = (generalInfo) ?  generalInfo.PDB_entries : "";
  const pdbs = (PDB_entries) ? PDB_entries.split(' ') : [];
  const PDB_link = (pdb:string):string => { return `http://www.rcsb.org/structure/${pdb}`; }
  const AlphaFold_entries = (generalInfo) ?  generalInfo.AlphaFold_entries : "";
  const models = (AlphaFold_entries) ? AlphaFold_entries.split(' ') : [];
  const AlphaFold_link = (model:string):string => { return `http://alphafold.ebi.ac.uk/entry/${model}`; } 
  
  const subunits = (generalInfo) ?  generalInfo.subunits : 1;
  const molar_mass = (generalInfo) ?  Intl.NumberFormat().format(generalInfo.molar_mass) : '';
  const ext_coefficient = (generalInfo) ?  Intl.NumberFormat().format(generalInfo.ext_coefficient) : '';

  const pathway_desc = (generalInfo) ?  decodeHTML(generalInfo.pathway_desc) : "Loading description…";
  const assay_desc = (generalInfo) ?  decodeHTML(generalInfo.assay_desc) : "Loading description…";

  const pretty_image = (enzyme) ? `/resources/images/pretty${abbr}.png` : '';
  const pretty_image_title = (enzyme) ? `3D Structure of ${enzyme}` : '';

  const coming_soon = (generalInfo) ?  generalInfo.coming_soon : false;

  const PathwayInfo = getPathwayInfo(enzyme as string);

  // TODO: Remove all the horrible hard-coding in this file!
  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <div className="max-w-7x1 mx-auto">
          <Breadcrumbs>
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/about">About</BreadcrumbItem>
            <BreadcrumbItem>{abbr}</BreadcrumbItem>
          </Breadcrumbs>
		</div>
		<div className="max-w-7x1 mx-auto pt-8 mb-8">
            <h2 className="mb-2 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
              About {full_name} ({abbr})
            </h2>
			{coming_soon && (
				<p>(Coming soon!)</p>
			)}
			{!coming_soon && (
				<p>(Added to D2D Network in {year})</p>
			)}


      {/* Info Section */}
        <div className="inline-grid grid-cols-2 grid-rows-1 gap-4">
          <div>
            <div className="space-y-2 mb-8">
				<h3>Identifiers</h3>
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

			<div className="space-y-2">
			  <h3>Properties</h3>
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

		  {/* Image */}
          <div>
            <Image 
			  isZoomed
              src={pretty_image}
			  title={pretty_image_title}
              alt="3D Structure"

              className="w-[280px] sm:w-[320px] lg:w-[350px] max-w-full"
            />
          </div>
        </div>

        <div className="mt-12 space-y-6 max-w-3xl">
          <p className="text-gray-600 text-justify">
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
				Lorem ipsum dolor sit amet, consectetur adipiscing elit,
				sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
				Ut enim ad minim veniam,
				quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
			</AccordionItem>
		  </Accordion>
          <p className="text-gray-600 text-justify">
				{assay_desc}
          </p>
		  <Accordion isCompact variant="shadow">
			<AccordionItem
				key="3"
				title="Assay Chemistry"
				className="text-gray-600 text-justify"
			>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit,
				sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
				Ut enim ad minim veniam,
				quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
			</AccordionItem>
		  </Accordion>
        </div>
      </div>
	          </div>

            {/* Sequence Section */}
            <div className="px-6 md:px-12 lg:px-24 py-16">
        <h2 className="mb-4 text-3xl md:text-4xl font-light">Full BglB Sequence</h2>
        
        <p className="mb-6 text-gray-600">
          One-letter amino acid residue codes in plain type (not bold) were not resolved in the crystal structure used for our design study 
          (<a href="http://www.rcsb.org/structure/2JIE" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">PDB #2JIE</a>). 
          One-letter codes in blue have parameter data stored in our database. Hovering over any 1-letter code in the sequence will give that residues sequence numbers/positions.
        </p>

        <div className="font-mono text-lg leading-loose break-words">
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
      </div>

      {/* Related Resources Section */}
      <div className="px-6 md:px-12 lg:px-24 py-16">
        <h2 className="mb-8 text-3xl md:text-4xl font-light">Related Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Pathway and Mechanism",
              link: "#",
              linkText: "View Pathway and Mechanism"
            },
            {
              title: "Assay Chemistry",
              link: "#",
              linkText: "View Assay Chemistry"
            },
            {
              title: "Publications",
              link: "/resources/publications",
              linkText: "View Publications"
            }
          ].map((item, index) => (
            <Card 
              key={index}
              className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
              as={Link}
              href={item.link}
            >
              <CardBody className="flex flex-col justify-between h-full">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-light pl-4 pt-2">
                  {item.title}
                </h3>
                <span className="text-sm pl-4 pb-4 text-[#06B7DB] hover:font-semibold">
                  {item.linkText} {'>'}
                </span>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AboutEnzymePAge;




