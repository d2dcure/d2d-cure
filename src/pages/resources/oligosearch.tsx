import NavBar from '@/components/NavBar';
import React, { useState, useEffect } from 'react';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import { NextUIProvider } from "@nextui-org/react";
import { Button } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/react";
import { Input } from "@nextui-org/input";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import Footer from '@/components/Footer';

const OligoSearchPage = () => {
  const { user } = useUser();
  const [enzymeList, setEnzymeList] = useState<any[]>([]);
  const [enzyme, setEnzyme] = useState('');
  const [enzymeVariant, setEnzymeVariant] = useState('');
  const [oligosData, setOligosData] = useState<any[]>([]);
  const [oligosDisplay, setOligosDisplay] = useState("");
  const [filePath, setFilePath] = useState('/path/to/your/file.txt');

  useEffect(() => {
    const fetchEnzymes = async () => {
      const response = await fetch('/api/getEnzymes');
      const data = await response.json();
      setEnzymeList(data);
    };
    const fetchOligosData = async () => {
      const response = await fetch('/api/getOligos');
      const data = await response.json();
      setOligosData(data);
    };

    fetchEnzymes();
    fetchOligosData();
  }, []);

  const handleSubmit = () => {
    const foundOligo = oligosData.find(oligo => oligo.variant === enzymeVariant);
    if (foundOligo) {
      setOligosDisplay(`${foundOligo.oligo}`);
    } else {
      setOligosDisplay("No matching oligo found for the specified variant.");
    }
  };

  const sizes = ["sm", "md", "lg"];
  const variants = ["flat", "bordered", "underlined", "faded"];

  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 mb-10 bg-white ">
        <div className="w-full">
          <Breadcrumbs
          >
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem>Resources</BreadcrumbItem>
            <BreadcrumbItem>Oligo Search</BreadcrumbItem>
          </Breadcrumbs>
          
          <div className="pt-8">
            <h1 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
              Oligo Search
            </h1>
            <p className="mb-12 text-left text-gray-600 max-w-2xl">
              Select the enzyme and enter an enzyme variant code to search for a reverse-compliment,
              codon-optimized DNA 33-mer for use as a primer for the gene mutant.
            </p>
            
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
            </div>

            {oligosDisplay && (
              <div className="mt-8 space-y-4">
                <h2 className="text-lg font-semibold">Results</h2>
                <div className="text-gray-600">
                  <p className="mb-4">
                    The optimized DNA oligomer sequence to use as a DNA primer for the
                    production of BgIB variant{" "}
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
    </>
  );
};

export default OligoSearchPage;