import React, { useContext } from 'react';
import "../app/globals.css"; 
import NavBar from '@/components/NavBar';
import { useUser } from '@/components/UserProvider';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { Button } from "@nextui-org/react";
import Footer from '@/components/Footer';

export default function Home() {
  const { user } = useUser();

  return (
    <div>
      <NavBar />
      {/* Container for content with responsive padding */}
      <div className="mx-4 sm:mx-8 lg:mx-24 py-20 bg-white">
        <div className="mt-8 text-center">
          <div className="flex flex-col lg:flex-row justify-center items-center pb-2">
            <img src="/resources/images/D2D_Logo.svg" draggable="false" className="h-16 select-none sm:h-20 pr-0 lg:pr-6 pb-3" alt="logo" />
            <h1 className="text-3xl sm:text-4xl lg:text-6xl mb-5 font-semibold" style={{ color: '#06B7DB' }}>Database</h1>
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">
            Unpacking protein structure-to-function relationships
          </h1>
          <h1 className="text-lg sm:text-xl lg:text-2xl mb-5 font-semibold">
            through large, high-resolution, quantitative datasets.
          </h1>
          <Button
            className="mb-10 lg:mb-40"
            onPress={() => window.location.href = '/login'}
            style={{ width: '250px', height: '40px', fontWeight: 'semibold', backgroundColor: "#06B7DB", color: "white" }}
          >
            About us
          </Button>

          {/* Conditionally render message */}
          {user?.user_name && (
            <p>Hello, {user?.user_name}</p>
          )}
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-40 mt-10">
          <div className="lg:pt-1">
            <p className="text-lg font-semibold text-gray-500" style={{ color: '#06B7DB' }}>
              Our mission
            </p>
            <h1 className="text-2xl lg:text-4xl mb-4 font-inter dark:text-white">Innovative Protein Engineering</h1>
            <p className="mb-6 pb-6 text-gray-500 text-lg dark:text-gray-200">
            The Design-to-Data workflow was developed in the Siegel Lab with the central research of improving the current predictive limitations of protein modeling software by functionally characterizing single amino acid mutants in a robust model system. This workflow is undergraduate-friendly, and students have an opportunity to practice protein design, kunkel mutagenesis, and enzyme characterization assays. The workflow is intuitively organized through engineering’s conceptual progression of design-build-test. 
            </p>
            <Button
              variant="bordered"
              onPress={() => window.location.href = '/login'}
              style={{ width: '250px', height: '40px', fontWeight: 'semibold', borderColor: "#06B7DB", borderWidth: '2px', color: "#06B7DB" }}
            >
              Learn More
            </Button>
          </div>
          <div className="flex justify-center lg:justify-start">
            <img src="/resources/images/Homepage.png" draggable="false" className="select-none max-w-full" alt="mockup" />
          </div>
        </div>

        {/* Analyze and Submit Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mt-20 items-center">
          <div className="lg:pt-1">
            <p className="text-lg font-semibold text-gray-500" style={{ color: '#06B7DB' }}>
              HOW IT WORKS
            </p>
            <h1 className="text-2xl lg:text-4xl mb-4 font-inter dark:text-white">Analyze and Submit</h1>
            <p className="text-lg text-gray-500 dark:text-gray-200 max-w-lg">
              After conducting research on their enzyme, students will upload and submit their data for approval...
            </p>
          </div>
          <div className="flex justify-center lg:justify-start">
            <img src="/resources/images/card_2.png" draggable="false" className="max-w-full select-none" alt="mockup" />
          </div>
        </div>

        {/* Curate Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-40 mt-10 items-center">
          <div className="flex justify-center lg:justify-start">
            <img src="/resources/images/card_large.png"  draggable="false" 
            className="max-w-full select-none" alt="mockup" />
          </div>
          <div className="lg:pt-1">
            <h1 className="text-2xl lg:text-4xl mb-4 font-inter dark:text-white">Curate</h1>
            <p className="text-lg text-gray-500 dark:text-gray-200 max-w-lg">
              Instructors and faculty members can approve or reject submitted data...
            </p>
          </div>
        </div>

        {/* Characterize Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mt-10 items-center">
          <div className="lg:pt-1">
            <h1 className="text-2xl lg:text-4xl mb-4 font-inter dark:text-white">Characterize</h1>
            <p className="text-lg text-gray-500 dark:text-gray-200 max-w-lg">
              Once the data is approved it will be available for the public to view...
            </p>
          </div>
          <div className="flex justify-center lg:justify-start">
            <img src="/resources/images/card_3.png" draggable="false" className="max-w-full select-none" alt="mockup" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-10 lg:mt-20">
          <Button
            onPress={() => window.location.href = '/login'}
            style={{ width: '250px', height: '40px', fontWeight: 'semibold', backgroundColor: "#06B7DB", color: "white" }}
          >
            Submit Data
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}