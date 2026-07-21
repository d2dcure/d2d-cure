import NavBar from "@/components/NavBar";
import { useState, useEffect } from "react";
import "../../app/globals.css";
import { Button } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/react";
import { Input } from "@nextui-org/input";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import Footer from "@/components/Footer";
import { ErrorChecker } from "@/components/ErrorChecker";

const OligoSearchPage = () => {
  const [enzymeList, setEnzymeList] = useState<any[]>([]);
  const [enzyme, setEnzyme] = useState('');
  const [resID, setResID] = useState('?');
  const [enzymeVariant, setEnzymeVariant] = useState('');
  const [sequenceData, setSequenceData] = useState<any[]>([]);
  const [oligosData, setOligosData] = useState<any[]>([]);
  const [oligosDisplay, setOligosDisplay] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchEnzymes = async () => {
      try {
        const response = await fetch('/api/getEnzymes');
        if (!response.ok) {
          throw new Error(`GET /api/getEnzymes ${response.status} - Failed to fetch enzymes`);
        }
        const enzymes = await response.json();
        if (!Array.isArray(enzymes)) {
          throw new Error('GET /api/getEnzymes - Invalid data format: Expected array');
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
        setIsError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch enzymes');
      }
    };

    const fetchOligosData = async () => {
      try {
        const response = await fetch(`/api/getOligos?enzyme=${enzyme}`);
        if (!response.ok) {
          throw new Error(`GET /api/getOligos ${response.status} - Failed to fetch oligos`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('GET /api/getOligos - Invalid data format: Expected array');
        }
        setOligosData(data);
      } catch (error) {
        console.error('Error fetching oligos:', error);
        setIsError(true);
        setErrorMessage(error instanceof Error ? error.message : `Failed to fetch oligos for ${enzyme}`);
      }
    };

	const fetchSequenceData = async () => {
		try {
			const response = await fetch(`/api/getSequenceData?enzyme=${enzyme}`);
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

    fetchEnzymes();
	if (enzyme) {
		fetchSequenceData();
    	fetchOligosData();
	}
  }, [enzyme]);


  // Search the sequence data and return the one-letter residue code for the
  // given residue number or return '?'.
  const getResID = (resnum: number) => {
		for (let sequenceDatum of sequenceData) {
			if (resnum == sequenceDatum.Rosetta_resnum) {
				return sequenceDatum.resid;
			}
		}
		return '?';
  };


  const handleSubmit = () => {
    const foundOligo = oligosData.find(oligo => oligo.variant === enzymeVariant);
    if (foundOligo) {
      setOligosDisplay(`${foundOligo.oligo}`);
    } else {
      setOligosDisplay("No matching oligo found for the specified variant.");
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
        <div className="w-full">
          <Breadcrumbs>
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/resources">Resources</BreadcrumbItem>
            <BreadcrumbItem>Oligo Search</BreadcrumbItem>
          </Breadcrumbs>
          
          <div className="pt-8">
            <h2 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
              Oligo Search
            </h2>
            <p className="mb-12 text-left text-gray-600 max-w-2xl">
              Select the enzyme and
			  enter an enzyme variant code to search for a reverse-compliment,
			  codon-optimized <abbr title="DeoxyriboNucleic Acid">DNA</abbr> 33-mer 
			  for use as a primer for the gene mutant.
            </p>
            
            <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:items-end md:space-x-4">
              <div className="w-full md:w-auto min-w-[200px]">
                <label htmlFor="enzyme" className="block mb-2">
                  Enzyme
                </label>
                <Select
				  isRequired
                  size="sm"
                  id="enzyme"
                  value={enzyme}
                  onChange={(e) => setEnzyme(e.target.value)}
                  label="Select Enzyme"
                  className="w-full md:w-[150px]"
                >
                  {enzymeList.map((enzyme) => (
                    <SelectItem key={enzyme.abbr} value={enzyme.abbr}>
                      {enzyme.abbr}
                    </SelectItem>
                  ))}
                </Select>
              </div>

			  {enzyme && (
					<div className="w-full md:w-auto">
						<label htmlFor="residue" className="block mb-2">
							Residue
						</label>
						<Input
							type="number"
							id="resnum"
							placeholder="#"
							//value={resnum}
							onChange={(e) => setResID(getResID(Number(e.target.value)))}
							size="lg"
							variant="bordered"
							className="w-full md:w-[100px]"
							radius="sm"
							startContent={resID}
							isInvalid={false}
							errorMessage="Not a valid residue number"
						/>
					</div>
			  )}

              {enzyme && (
				<>
				<div className="w-full md:w-auto">
                <label htmlFor="enzymeVariant" className="block mb-2">
                  Enzyme Variant <small>(Use the format <code>A123C</code>.)</small>
                </label>
                <Input
                  type="text"
                  id="enzymeVariant"
                  value={enzymeVariant}
                  onChange={(e) => setEnzymeVariant(e.target.value)}
                  placeholder="Search"
                  size="lg"
                  variant="bordered"
                  className="w-full md:w-[200px]"
                  radius="sm"
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="h-[45px] bg-[#06B7DB] text-white w-full md:w-auto"
                radius="sm"
              >
                Search
              </Button>
			  </>
			  )}
            </div>

            {oligosDisplay && (
              <div className="mt-8 space-y-4">
                <h2 className="text-lg font-semibold">Results</h2>
                <div className="text-gray-600">
                  <p className="mb-4">
                    The optimized DNA oligomer sequence to use as a DNA primer for the
                    production of {enzyme} variant{" "}
                    <span className="text-black font-bold">{enzymeVariant}</span> is:
                  </p>
                  <p className="text-black font-bold break-words">{oligosDisplay}</p>
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