import React, { useEffect, useState } from 'react';
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {Card, CardBody} from "@nextui-org/react";
import Link from 'next/link';
import { Tooltip } from "@nextui-org/tooltip";

interface SequenceData {
  id: number;
  resnum: string;
  Rosetta_resnum: number | null;
  PDBresnum: string | null;
  resid: string;
}

const BglBPage = () => {
  const [sequenceData, setSequenceData] = useState<SequenceData[]>([]);
  const [characterizationData, setCharacterizationData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sequence data
        const seqResponse = await fetch('/api/getSequenceData');
        if (seqResponse.ok) {
          const seqData = await seqResponse.json();
          setSequenceData(seqData);
        }

        // Fetch characterization data
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
  }, []);

  // Helper function to check if a residue has characterization data
  const hasCharacterizationData = (rosettaNum: number | null) => {
    if (!rosettaNum) return false;
    return characterizationData.some(item => item.resnum === rosettaNum);
  };

  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <div className="col-span-1 items-center">
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/about">About</BreadcrumbItem>
            <BreadcrumbItem>β-glucosidase B</BreadcrumbItem>
          </Breadcrumbs>
          <div className="pt-6">
            <h1 className="mb-2 text-4xl md:text-4xl lg:text-4xl font-light dark:text-white">
              About β-glucosidase B
            </h1>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-6 md:px-12 lg:px-24 py-4 bg-white">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="lg:w-1/2">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-semibold w-44 text-sm text-gray-600">Species:</span>
                <span className="text-sm text-gray-600">Paenibacillus polymyxa</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold w-44 text-sm text-gray-600">EC Number:</span>
                <span className="text-sm text-gray-600">3.2.1.21</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold w-44 text-sm text-gray-600">UniProt Number:</span>
                <span className="text-sm text-gray-600">P22505</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold w-44 text-sm text-gray-600">PCB Entries:</span>
                <span className="text-sm text-gray-600">2JIE 2O9P 2O9R 2O9T 2Z1S</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold w-44 text-sm text-gray-600">Molar Mass:</span>
                <span className="text-sm text-gray-600">51,573 Da</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold w-44 text-sm text-gray-600">Extinction Coefficient (εBglB):</span>
                <span className="text-sm text-gray-600">113,330 m−1 cm−1</span>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 mt-8 lg:-mt-24 lg:-ml-32 flex justify-center lg:justify-start">
            <img 
              src="/resources/images/prettyBglB.png"
              alt="BglB Structure"
              className="w-[280px] sm:w-[320px] lg:w-[350px] max-w-full"
            />
          </div>
        </div>

        <div className="mt-12 space-y-6 max-w-3xl">
          <p className="text-gray-600">
            β-glucosidase B (BglB, lovingly called &quot;Bagel B&quot; by our teams) is an enzyme that catalyzes 
            the hydrolysis of glucose monosaccharides from larger molecules at a β-glycosidic linkage. 
            It is an essential enzyme for the degradation of cellulose by bacteria and fungi.
          </p>
          <p className="text-gray-600">
            Our computational designs and kinetic measurements will utilize para-nitrophenyl-β-d-glucopyranose (pNPG) 
            as a colorimetric reporter substrate.
          </p>
        </div>
      </div>

            {/* Sequence Section */}
            <div className="px-6 md:px-12 lg:px-24 py-16">
        <h2 className="mb-4 text-3xl md:text-4xl font-light">Full BglB Sequence</h2>
        
        <p className="mb-6 text-gray-600">
          One-letter amino acid residue codes in plain type (not bold) were not resolved in the crystal structure used for our design study 
          (<a href="http://www.rcsb.org/structure/2JIE" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">PDB #2JIE</a>). 
          One-letter codes in blue have parameter data stored in our database. Hovering over any 1-letter code in the sequence will give that residue's sequence numbers/positions.
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
                        window.location.href = `/database/BglB_characterization?highlight=${residue.Rosetta_resnum}`;
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
              link: "#",
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

export default BglBPage;




