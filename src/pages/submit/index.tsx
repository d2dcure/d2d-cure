import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/UserProvider';
import { useRouter } from 'next/router';
import { AuthChecker } from '@/components/AuthChecker';
import NavBar from '@/components/NavBar';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { Select, SelectItem, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Card, CardBody } from "@nextui-org/react";
import StatusChip from '@/components/StatusChip';
import Footer from '@/components/Footer';

const SubmitPage = () => {
  const { user } = useUser();
  const router = useRouter();


  // part 1 - which form do you want? 
  const [selection, setSelection] = useState('');

  // part 2 - enter the enzyme (and, if single variant, the variant)
  const [enzymeList, setEnzymeList] = useState<any[]>([]);
  const [enzyme, setEnzyme] = useState('');
  const [enzymeVariant, setEnzymeVariant] = useState('');
  const [sequences, setSequences] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [resid, setResid] = useState('');
  const [resnum, setResnum] = useState('');
  const [resmut, setResmut] = useState('');

  // part 3 - how many records already exist, if none, then make your own 
  const [entered, setEntered] = useState('null');
  const [matchedData, setMatchedData] = useState<any[]>([]);
  const [charData, setCharData] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState<any>();


  const handleSubmitSingleVar = () => {
    setError('');
    setEntered('null');
    // Regular expression to match the format {resid}{resnum}{resmut}
    const variantRegex = /^([A-Za-z])(\d+)([A-Za-z])$/;
    const match = enzymeVariant.match(variantRegex);
  
    if (!match) {
      setError('Incorrect format. Please use the format: {resid}{resnum}{resmut}.');
      return;
    }
  
    const [, resid, resnum, resmut] = match;

    const sequenceMatch = sequences.find(seq => String(seq.Rosetta_resnum) === resnum && String(seq.resid) === resid);
  
    if (!sequenceMatch) {
      setError('That variant combination is not possible.');
      return;
    }
  
    // check if variant the user entered is valid + show list of other variants from same school
    console.log('Variant is valid:', { resid, resnum, resmut });
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
    setEntered('null');

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
          username: user?.user_name, 
          institution: user?.institution, 
          pi: user?.pi, 
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


  // for new dataset navigation to work 
  useEffect(() => {
    if (newEntry && newEntry.id && newEntry.resid == 'X') {
      router.push(`/submit/wild_type/${newEntry.id}`);
    } 
    else if (newEntry && newEntry.id) {
      router.push(`/submit/single_variant/${newEntry.id}`);
    }
  }, [newEntry, router]);

  useEffect(() => {
    const fetchEnzymes = async () => {
      const response = await fetch('/api/getEnzymes');
      const data = await response.json();
      setEnzymeList(data);
    };
    const fetchSequences = async () => {
      const response = await fetch('/api/getSequenceData');
      const data = await response.json();
      setSequences(data);
    };
    const fetchData = async () => {
        const response = await fetch('/api/getCharacterizationData');
        const data = await response.json();
        setCharData(data);
      };
  
    fetchData(); 
    fetchSequences(); 
    fetchEnzymes(); 
  }, []);

  return (
    <div>
      <NavBar />
      <AuthChecker minimumStatus="student">
        <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 mb-10 bg-white">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs className="mb-2">
              <BreadcrumbItem>Home</BreadcrumbItem>
              <BreadcrumbItem>Data Analysis & Submission</BreadcrumbItem>
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
                  'Select the enzyme and enter an enzyme variant code (e.g., A123C) corresponding to your mutation.' :
                selection === 'wild_type' ? 
                  'Submit characterization data for wild type enzyme variants.' :
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
                        <div className="w-full md:w-auto min-w-[200px]">
                          <label htmlFor="enzyme" className="block mb-2">
                            Enzyme
                          </label>
                          <Select
                            size="sm"
                            id="enzyme"
                            value={enzyme}
                            onChange={(e) => setEnzyme(e.target.value)}
                            label="Select Enzyme"
                            className="w-full"
                          >
                            {enzymeList.map((enzyme) => (
                              <SelectItem key={enzyme.id} value={enzyme.abbr}>
                                {enzyme.abbr}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div className="w-full md:w-auto">
                          <label htmlFor="enzymeVariant" className="block mb-2">
                            Enzyme Variant
                          </label>
                          <Input
                            type="text"
                            id="enzymeVariant"
                            value={enzymeVariant}
                            onChange={(e) => setEnzymeVariant(e.target.value)}
                            placeholder="A123C"
                            size="lg"
                            variant="bordered"
                            className="w-full md:w-[200px]"
                            radius="sm"
                          />
                        </div>

                        <Button
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
                              {matchedData.length} records found
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
                                  <TableCell>BglB</TableCell>
                                  <TableCell>{`${item.resid}${item.resnum}${item.resmut}`}</TableCell>
                                  <TableCell>{item.creator || 'Unknown'}</TableCell>
                                  <TableCell>{item.id}</TableCell>
                                  <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
                                    {item.comments || 'No comments'}
                                  </TableCell>
                                  <TableCell>
                                    <Link href={`/submit/single_variant/${item.id}`} className="text-[#06B7DB]">
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
                          size="sm"
                          id="enzyme"
                          value={enzyme}
                          onChange={(e) => setEnzyme(e.target.value)}
                          label="Select Enzyme"
                          className="w-full"
                        >
                          {enzymeList.map((enzyme) => (
                            <SelectItem key={enzyme.id} value={enzyme.abbr}>
                              {enzyme.abbr}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      <Button
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
                            {matchedData.length} records found
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
                                <TableCell>BglB</TableCell>
                                <TableCell>{`WT`}</TableCell>
                                <TableCell>{item.creator || 'Unknown'}</TableCell>
                                <TableCell>{item.id}</TableCell>
                                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
                                  {item.comments || 'No comments'}
                                </TableCell>
                                <TableCell>
                                  <Link href={`/submit/wild_type/${item.id}`} className="text-[#06B7DB]">
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