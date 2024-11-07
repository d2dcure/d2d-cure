import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/UserProvider';
import { useRouter } from 'next/router';
import { AuthChecker } from '@/components/AuthChecker';
import NavBar from '@/components/NavBar';

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

  return (
    <div>
      <NavBar />
      <AuthChecker minimumStatus="student">
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold">Data Analysis and Submission</h1>
          <div className="space-x-4">
            {/* Initial options */}
            {!selection && (
              <div>
              <h2>What type of data would you like to submit?</h2>
              <div className="space-x-4">
                  <button onClick={() => setSelection('single_variant')} className="text-blue-500 hover:text-blue-700">Single Variant Data</button>
                  <button onClick={() => setSelection('wild_type')} className="text-blue-500 hover:text-blue-700">Wild Type Data</button>
              </div>
            </div>
            )}

            {/* Single Variant form */}
            {selection === 'single_variant' && (
              <div>
                    <h2>Single Variant Form</h2>
                    <div className="space-x-4">
                        <button onClick={() => setSelection('single_variant')} className="text-blue-500 hover:text-blue-700">Single Variant Data</button>
                        <button onClick={() => setSelection('wild_type')} className="text-blue-500 hover:text-blue-700">Wild Type Data</button>
                    </div>
                    <p>Select the enzyme from the list and enter the enzyme variant code (e.g., A123C) corresponding to your mutation.</p>
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <span className="font-bold">Enzyme:</span>
                        <select className="border border-gray-300 rounded p-1"
                                value={enzyme}
                                onChange={(e) => setEnzyme(e.target.value)}>
                        <option value="">Select an enzyme</option>
                        {enzymeList.map((enzyme) => (
                            <option key={enzyme.id} value={enzyme.abbr}>{enzyme.abbr}</option>
                        ))}
                        </select>
                        <span className="font-bold">Enzyme Variant:</span>
                        <input type="text" 
                            className="border border-gray-300 rounded p-1"
                            value={enzymeVariant}
                            onChange={(e) => setEnzymeVariant(e.target.value)}
                            placeholder="A123C" 
                        />
                        <button onClick={handleSubmit} className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Submit
                        </button>
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
      </AuthChecker>
    </div>
  );
};

export default SubmitPage;