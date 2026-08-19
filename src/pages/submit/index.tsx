import VariantSearchForm from "@/components/VariantSearchForm";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/components/UserProvider";
import { useRouter } from "next/router";
import { AuthChecker } from "@/components/AuthChecker";
import NavBar from "@/components/NavBar";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import {
	Select, SelectItem,
	Button,
	Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
	Card, CardBody
} from "@nextui-org/react";
import StatusChip from "@/components/StatusChip";
import Footer from "@/components/Footer";

const SubmitPage = () => {
  const { user } = useUser();
  const router = useRouter();


  // part 1 - which form do you want? 
  const [selection, setSelection] = useState('');

  // part 2 - enter the enzyme (and, if single variant, the variant)
  const [enzymeList, setEnzymeList] = useState<any[]>([]);
  const [enzyme, setEnzyme] = useState<string>('');
  const [enzymeVariant, setEnzymeVariant] = useState<string>('');
  const [error, setError] = useState('');
  const [resid, setResid] = useState('');
  const [resnum, setResnum] = useState('');
  const [resmut, setResmut] = useState('');

  // part 3 - how many records already exist, if none, then make your own
  const [entered, setEntered] = useState('null');
  const [matchedData, setMatchedData] = useState<any[]>([]);
  const [charData, setCharData] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState<any>();

  // Add this new state to store the related data
  const [actualData, setActualData] = useState<Record<number, any>>({});


  const handleSubmitSingleVar = () => {
    setError('');
    setEntered('null');
    // Regular expression to match the format {resid}{resnum}{resmut}
    const variantRegex = /^([A-Za-z])(\d+)([A-Za-z])$/;
    const match = enzymeVariant.match(variantRegex);
  
    if (!match) {
      setError('Error searching database for selected variant; no match found.');
      return;
    }
  
    const [, resid, resnum, resmut] = match;

    setEntered(resid); 
    setResid(resid); 
    setResnum(resnum); 
    setResmut(resmut); 
    const filteredData = charData.filter((data) => 
    String(data.resid) === resid &&
    String(data.resnum) === resnum &&
    String(data.resmut) === resmut &&
    String(data.institution) === user?.institution 
    );

    setMatchedData(filteredData);
  };

  const handleSubmitWT = () => {
	setError('');

	setEntered('X'); 
	setResid('X'); 
	setResnum('0'); 
	setResmut('X'); 
	const filteredData = charData.filter((data) => 
	String(data.resid) === 'X' &&
	String(data.resnum) === '0' &&
	String(data.resmut) === 'X' &&
	String(data.institution) === user?.institution 
	);

	setMatchedData(filteredData);
  };

  const handleCreateNewDataset = async () => {
    try {
      const response = await fetch('/api/createNewCharacterizationDataEntry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
		  enzyme: enzyme,
          username: user?.user_name, 
          institution: user?.institution, 
          pi: user?.pi || user?.given_name,
          resid: resid, 
          resnum: resnum, 
          resmut: resmut, 
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create new dataset');
      }

      const newDataEntry = await response.json();
      setNewEntry(newDataEntry);
      console.log("New dataset created successfully!", newDataEntry);

  
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to create new dataset. Please try again.');
    }
  };

  // Add an effect to initialize filters from URL on page load.
  useEffect(() => {
    // Wait for router to be ready.
    if (!router.isReady) return;
    
    const { 
      single_variant, 
      wild_type, 
    } = router.query;
    
    // Set initial selection of submission type.
    if (single_variant !== undefined) setSelection('single_variant');
    if (wild_type !== undefined) setSelection('wild_type');
  }, [router.isReady, router.query]);

  // for new dataset navigation to work 
  useEffect(() => {
    if (newEntry && newEntry.id && newEntry.resid == 'X') {
      router.push(`/submit/wild_type/${enzyme}/${newEntry.id}`);
    } 
    else if (newEntry && newEntry.id) {
      router.push(`/submit/single_variant/${enzyme}/${newEntry.id}`);
    }
  }, [enzyme, newEntry, router]);

	useEffect(() => {
		const fetchEnzymes = async () => {
			const response = await fetch('/api/getEnzymes');
			const data = await response.json();
			const activeEnzymes= [];
			for (let enzyme of data) {
				if (enzyme.active === true) {
					activeEnzymes.push(enzyme);
				}
			}
			setEnzymeList(activeEnzymes); 
		};
		fetchEnzymes();
	}, []);

	useEffect(() => {
    	const fetchData = async () => {
        	const response = await fetch(`/api/getCharacterizationData?enzyme=${enzyme}`);
        	const data = await response.json();
        	setCharData(data);
      	};
		if (enzyme) {
    		fetchData();
		} else {
			setCharData([]);
			setMatchedData([]);
		}
	}, [enzyme]);

  // Add this new useEffect to fetch related data when matchedData changes
  useEffect(() => {
    const fetchLinkedData = async () => {
      if (matchedData.length === 0) return;
      
      try {
        const ids = matchedData.map(item => item.id);
        const response = await fetch('/api/getLinkedRawDataFromIDs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enzyme, ids }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch related data');
        }
        
        const data = await response.json();
        setActualData(data);
      } catch (error) {
        console.error('Error fetching related data:', error);
      }
    };
    
    fetchLinkedData();
  }, [enzyme, matchedData]);


	// Functions to pass to child component
	const updateEnzyme = (new_enzyme: string) => {
		setEnzymeVariant('');
    	setEnzyme(new_enzyme);
		setEntered('null');
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
    <div>
      <NavBar />
      <AuthChecker minimumStatus="student">
        <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 mb-10 bg-white">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs className="mb-2">
              <BreadcrumbItem href="/">Home</BreadcrumbItem>
              <BreadcrumbItem>Submit Data</BreadcrumbItem>
            </Breadcrumbs>

            <div className="pt-8">
              <h1 className="text-2xl md:text-2xl lg:text-4xl font-inter dark:text-white mb-2">
                {selection ? (
                  selection === 'single_variant' ? 'Single Variant Submission' :
                  selection === 'wild_type' ? 'Wild Type Submission' :
                  'Data Analysis & Submission'
                ) : 'Data Analysis & Submission'}
              </h1>
              <p className="text-gray-500 mb-14">
                {selection === 'single_variant' ? 
                  "Select the enzyme and choose an enzyme variant (using Rosetta/Foldit numbering). Then click Search to see if that variant has been tested at your institution." :
                selection === 'wild_type' ? 
                  "Select the enzyme and click Search to see which WT datasets have been collected at your institution." :
                'Please select one of the options to submit data or upload a gel image.'}
              </p>

              {/* Initial Selection Cards */}
              {!selection && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                  <Card 
                    isPressable
                    onPress={() => setSelection('single_variant')}
                    className="h-[170px] hover:scale-105 transition-transform"
                  >
                    <CardBody className="flex flex-col justify-between h-full">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light pl-4 pt-2">
                        Single Variant
                      </h3>
                      <span className="text-sm pl-4 pb-4 text-[#06B7DB] hover:font-semibold">
                        Submit Data {'>'}
                      </span>
                    </CardBody>
                  </Card>

                  <Card 
                    isPressable
                    onPress={() => setSelection('wild_type')}
                    className="h-[170px] hover:scale-105 transition-transform"
                  >
                    <CardBody className="flex flex-col justify-between h-full">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light pl-4 pt-2">
                        Wild Type
                      </h3>
                      <span className="text-sm pl-4 pb-4 text-[#06B7DB] hover:font-semibold">
                        Submit Data {'>'}
                      </span>
                    </CardBody>
                  </Card>

                  <Card 
                    isPressable
                    onPress={() => router.push('/submit/gel_image_upload')}
                    className="h-[170px] hover:scale-105 transition-transform"
                  >
                    <CardBody className="flex flex-col justify-between h-full">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light pl-4 pt-2">
                        Gel Image
                      </h3>
                      <span className="text-sm pl-4 pb-4 text-[#06B7DB] hover:font-semibold">
                        Upload Image {'>'}
                      </span>
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* Form Sections */}
              {selection && (
                <div className="mt-8">
                  {/* Single Variant Form */}
                  {selection === 'single_variant' && (
                    <div>
                      <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:items-end md:space-x-4">
						<VariantSearchForm
							enzyme={enzyme}
							variant={enzymeVariant}
							updateEnzyme={updateEnzyme}
							updateVariant={updateEnzymeVariant}
						/>

                        <Button
						  isDisabled={(!enzyme) || (!enzymeVariant) || (!charData.length)}
                          onClick={handleSubmitSingleVar}
                          className="h-[45px] bg-[#06B7DB] text-white w-full md:w-auto"
                          radius="sm"
                        >
                          Search
                        </Button>
                      </div>

                      {error && (
                        <div className="text-red-500 mt-4">{error}</div>
                      )}

                      {entered !== 'null' && (
                        <div className="mt-8">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-small text-default-400">
                              The {`${resid}${resnum}${resmut} ${enzyme}`} variant
							  has been studied {matchedData.length} time(s)
							  at {user.institution}.
							  Select which dataset you would like to modify or
							  click the Create New Dataset button.
                            </span>
                          </div>

                          <Table 
                            aria-label="Variant records"
                            classNames={{
                              table: "min-h-[100px]",
                            }}
                          >
                            <TableHeader>
                              <TableColumn>STATUS</TableColumn>
                              <TableColumn>ENZYME</TableColumn>
                              <TableColumn>VARIANT</TableColumn>
                              <TableColumn>CREATOR</TableColumn>
                              <TableColumn>ID</TableColumn>
                              <TableColumn>KINETIC DATA</TableColumn>
                              <TableColumn>TEMPERATURE DATA</TableColumn>
                              <TableColumn>COMMENTS</TableColumn>
                              <TableColumn>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                              {matchedData.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                  <StatusChip 
                                    status={
                                      item.submitted_for_curation 
                                        ? item.approved_by_pi 
                                          ? 'approved' 
                                          : !item.curated 
                                            ? 'pending_approval' 
                                            : 'in_progress'
                                        : 'in_progress'
                                    } 
                                  />
                                  </TableCell>
                                  <TableCell>{enzyme}</TableCell>
                                  <TableCell>{`${item.resid}${item.resnum}${item.resmut}`}</TableCell>
                                  <TableCell>{item.creator || 'Unknown'}</TableCell>
                                  <TableCell>{item.id}</TableCell>
                                  <TableCell>
                                  {actualData[item.id]?.kineticData?.length > 0 ? 
                                    `updated ${new Date(actualData[item.id].kineticData[0].updated).toLocaleDateString()}` : 
                                    ''}
                                  </TableCell>
                                  <TableCell>
                                  {actualData[item.id]?.tempData?.length > 0 ? 
                                    `updated ${new Date(actualData[item.id].tempData[0].updated).toLocaleDateString()}` : 
                                    ''}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
                                    {item.comments || 'No comments'}
                                  </TableCell>
                                  <TableCell>
                                    <Link href={`/submit/single_variant/${enzyme}/${item.id}`} className="text-[#06B7DB]">
                                      View
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>

                          <Button
                            className="mt-6 border border-[#06B7DB] text-[#06B7DB] hover:bg-[#06B7DB] hover:text-white"
                            variant="bordered"
                            onClick={handleCreateNewDataset}
                          >
                            Create New Dataset
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wild Type Form */}
                  {selection === 'wild_type' && (
                  <div>
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
                          onChange={(e) => {
							setEnzyme(e.target.value);
							setEntered('null');
						  }}
                          label="Select Enzyme"
                          className="w-full"
                        >
                          {enzymeList.map((enzyme) => (
                            <SelectItem key={enzyme.abbr} value={enzyme.abbr}>
                              {enzyme.abbr}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      <Button
					    isDisabled={!enzyme || !charData.length}
                        onClick={handleSubmitWT}
                        className="h-[45px] bg-[#06B7DB] text-white w-full md:w-auto"
                        radius="sm"
                      >
                        Search
                      </Button>
                    </div>

                    {error && (
                      <div className="text-red-500 mt-4">{error}</div>
                    )}

                    {entered !== 'null' && (
                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-small text-default-400">
                          Data for the wild-type {enzyme} enzyme have been
						  collected {matchedData.length} time(s)
						  at {user.institution}.
						  Select which dataset you would like to modify or
						  click the Create New Dataset button.
                          </span>
                        </div>

                        <Table 
                          aria-label="Variant records"
                          classNames={{
                            base: "max-h-[400px]",
                          }}
                        
                        >
                          <TableHeader>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>ENZYME</TableColumn>
                            <TableColumn>VARIANT</TableColumn>
                            <TableColumn>CREATOR</TableColumn>
                            <TableColumn>ID</TableColumn>
                            <TableColumn>KINETIC DATA</TableColumn>
                            <TableColumn>TEMPERATURE DATA</TableColumn>
                            <TableColumn>COMMENTS</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {matchedData.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                <StatusChip 
                                    status={
                                      item.submitted_for_curation 
                                        ? item.approved_by_pi 
                                          ? 'approved' 
                                          : !item.curated 
                                            ? 'pending_approval' 
                                            : 'in_progress'
                                        : 'in_progress'
                                    } 
                                  />
                                </TableCell>
                                <TableCell>{enzyme}</TableCell>
                                <TableCell>{`WT`}</TableCell>
                                <TableCell>{item.creator || 'Unknown'}</TableCell>
                                <TableCell>{item.id}</TableCell>
                                <TableCell>
                                  {actualData[item.id]?.kineticData?.length > 0 ? 
                                    `updated ${new Date(actualData[item.id].kineticData[0].updated).toLocaleDateString()}` : 
                                    ''}
                                </TableCell>
                                <TableCell>
                                  {actualData[item.id]?.tempData?.length > 0 ? 
                                    `updated ${new Date(actualData[item.id].tempData[0].updated).toLocaleDateString()}` : 
                                    ''}
                                </TableCell>
                                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
                                  {item.comments || 'No comments'}
                                </TableCell>
                                <TableCell>
                                  <Link href={`/submit/wild_type/${enzyme}/${item.id}`} className="text-[#06B7DB]">
                                    View
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        <Button
                          className="mt-6 border border-[#06B7DB] text-[#06B7DB] hover:bg-[#06B7DB] hover:text-white"
                          variant="bordered"
                          onClick={handleCreateNewDataset}
                        >
                          Create New Dataset
                        </Button>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </AuthChecker>
      <Footer />
    </div>
  );
};

export default SubmitPage;