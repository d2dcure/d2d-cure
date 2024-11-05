import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/UserProvider';
import { useRouter } from 'next/router';
import NavBar from '@/components/NavBar';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Button } from "@nextui-org/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight} from '@fortawesome/free-solid-svg-icons'; 
import { Select, SelectItem } from "@nextui-org/react";
import { Input } from "@nextui-org/input";

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


  const handleSubmit = () => {
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
  
    // Variant the user entered is valid 
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
      //router.push(`/submit/single_variant/${newEntry.id}`);

  
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to create new dataset. Please try again.');
    }
  };

  const handleSelectDataset = (id:any) => {
    router.push(`/submit/single_variant/${id}`);
  };


  // for new dataset navigation to work 
  useEffect(() => {
    if (newEntry && newEntry.id) {
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

  const sizes = ["sm", "md", "lg"];
  const variants = ["flat", "bordered", "underlined", "faded"];

  return (
    <>
    <NavBar />
    <div className="m-24 bg-white">
      <div className="col-span-1 items-center">
      <Breadcrumbs
            itemClasses={{
              item: "text-black data-[current=true]:text-gray-300", // White text for breadcrumb items, lighter for current item
              separator: "text-black/40", // Lighter white for separators
            }}
          >
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href = "/submit">Data Analysis & Submission</BreadcrumbItem>
              {selection === 'single_variant' && (
                <BreadcrumbItem>Single Variant Data</BreadcrumbItem>
              )}
              {selection === 'wild_type' && (
                <BreadcrumbItem>Wild Type Data</BreadcrumbItem>
              )}
          </Breadcrumbs>
        {/* Initial options */}
        <div className = "pt-8" style = {{marginBottom: "24px", }}>
          
          {selection === '' && (
            <h1 className="text-2xl font-bold" style = {{fontSize: "40px", lineHeight: "28px", fontWeight: "350", font: "inter"}}>Data Analysis & Submission</h1>
          )}
          {selection == 'single_variant' && (
            <>
            <h1 className="text-2xl font-bold" style = {{fontSize: "40px", lineHeight: "28px", fontWeight: "350", font: "inter", marginBottom: '30px'}}>Single Variant Data Submission</h1>
            <p className="mb-2 text-left" style={{ color: 'grey', marginBottom: '50px' }}>
              Select the enzyme from the list and enter the variant code (e.g., A123C) corresponding to your mutation.
            </p>
            </>
          )}
          {selection === 'wild_type' && (
            <h1 className="text-2xl font-bold" style = {{fontSize: "40px", lineHeight: "28px", fontWeight: "350", font: "inter"}}>Wild Type Data Submission</h1>
          )}
        </div>
        {!selection && (
          <div>
            <h2 style = {{fontSize: "18px", lineHeight: "28px", font: "inter", fontWeight: "300", color: "var(--Text-text-secondary, rgba(82, 82, 82, 1))", marginBottom: "64px"}}>Please select one of the options to submit data or upload a gel image.</h2>
          <div className="space-x-4" style = {{display: "flex", gap: "64px"}}>
            <Card style={{width: "301px", height: "192px"}}>
              <CardBody style={{fontSize: "30px", fontWeight: "300", lineHeight: "40px", paddingRight: "8px", gap: "8px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "20px", marginLeft: "5px", marginTop: "20px"}}>Single Variant</CardBody>
              <CardFooter>
                <button onClick={() => setSelection('single_variant')} className="text-blue-500 hover:text-blue-700" style={{gap: "8px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "20px", color: "var(--colors-base-primary, rgba(6, 183, 219, 1))"}}>
                  Submit Data
                  <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: '8px' }} />
                </button>
              </CardFooter>
            </Card>

            <Card style={{width: "301px", height: "192px"}}>
              <CardBody style={{fontSize: "30px", fontWeight: "300", lineHeight: "40px", paddingRight: "3.27px", gap: "8px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "20px", marginLeft: "5px", marginTop: "20px"}}>Wild Type</CardBody>
              <CardFooter>
                <button onClick={() => setSelection('wild_type')} className="text-blue-500 hover:text-blue-700" style={{gap: "8px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "20px", color: "var(--colors-base-primary, rgba(6, 183, 219, 1))"}}>
                  Submit Data
                  <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: '8px' }} />
                </button>
              </CardFooter>
            </Card>

            <Card style={{width: "301px", height: "192px"}}>
              <CardBody style={{fontSize: "30px", fontWeight: "300", lineHeight: "40px", paddingRight: "3.27px", gap: "8px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "20px", marginLeft: "5px", marginTop: "20px"}}>Gel Image</CardBody>
              <CardFooter>
                <button className="text-blue-500 hover:text-blue-700" style={{gap: "8px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "20px", color: "var(--colors-base-primary, rgba(6, 183, 219, 1))"}}>
                  Upload Image
                  <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: '8px' }} />
                </button>
              </CardFooter>
            </Card>
          </div>
        </div>
        )}

        {/* Single Variant form */}
        {selection === 'single_variant' && (
                    <div className="pt-8">
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
                        <div style={{ marginBottom: '10px', marginRight: '50px' }}>
                          <label htmlFor="enzyme" style={{ display: 'block', marginBottom: '10px' }}>Enzyme</label>
                          {sizes.includes("sm") && (
                            <Select
                              size="sm"
                              id="enzyme"
                              value={enzyme}
                              onChange={(e) => setEnzyme(e.target.value)}
                              label="Select Enzyme"
                              style={{ width: '300px', borderRadius: '8px' }}
                            >
                              {enzymeList.map((enzyme) => (
                                <SelectItem key={enzyme.id} value={enzyme.abbr}>
                                  {enzyme.abbr}
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        </div>
                        <div>
                          <label htmlFor="enzymeVariant">Enzyme Variant</label>
                          {variants.map((variant) => (
                            sizes.map((size) => (
                              variant === "bordered" && size === "lg" && (
                                <div key={`${size}-${variant}`} style={{ marginTop: '10px' }}>
                                  <Input
                                    key={`${size}-${variant}`}
                                    type="text"
                                    id="enzymeVariant"
                                    value={enzymeVariant}
                                    onChange={(e) => setEnzymeVariant(e.target.value)}
                                    placeholder="Search"
                                    size={size}
                                    variant={variant}
                                    style={{ width: '200px' }}
                                    radius="sm"
                                  />
                                </div>
                              )
                            ))
                          ))}
                        </div>

                <Button
                  onClick={handleSubmit}
                  style={{ marginTop: '35px', height: '45px', backgroundColor: "#06B7DB", color: "white" }}
                  radius="sm"
                >
                  Search
                </Button>
                    {error && <p className="text-red-500">{error}</p>}
                </div>
                {entered !== 'null' && (
                  <>
                  <div className="text-center mb-10">
                    <p className="mb-2">Previous datasets:</p>
                    {matchedData.length > 0 ? (
                      <ul>
                        {matchedData.map((item) => (
                          <li key={item.id}>
                            <button onClick={() => handleSelectDataset(item.id)} className="mr-3">Select</button>
                            Dataset created by {item.creator}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>There are no records that match from your school.</p>
                    )}
                  </div>
                  <button onClick={handleCreateNewDataset} className="mt-5 text-blue font-bold py-2 px-4 rounded">Create New Dataset</button>
                  </>
                )}
              </div>
            </div>
        )}

        {/* Wild Type form */}
        {selection === 'wild_type' && (
          <div>
            <h2>Wild Type Form</h2>
            <div className="space-x-4">
                <button onClick={() => setSelection('single_variant')} className="text-blue-500 hover:text-blue-700">Single Variant Data</button>
                <button onClick={() => setSelection('wild_type')} className="text-blue-500 hover:text-blue-700">Wild Type Data</button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default SubmitPage;