import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import "../app/globals.css"; 
import NavBar from '@/components/NavBar';
import { useUser } from '@/components/UserProvider';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { Button } from "@nextui-org/react";
import Footer from '@/components/Footer';

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user?.user_name) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div>
      <NavBar />
      {/* Container for content with responsive padding */}
<section
  className="pt-14 lg:pt-14 bg-[url('/resources/images/ng.png')] bg-center bg-fill bg-no-repeat"
>
  <div className="max-w-2xl text-center mx-auto">
    <div className="flex pb-3 flex-row justify-center items-center pb-1">
      <img src="/resources/images/D2D_Logo.svg" draggable="false" className="h-12 sm:h-16 lg:h-20 select-none pr-2 lg:pr-3" alt="logo" />
      <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold font-poppins" style={{ color: '#3C99AC', opacity: 0.38 }}>CURE</h1>
    </div>
    <p className="text-base sm:text-lg lg:text-xl font-light text-[#518C98]">
      Unpacking protein structure-to-function relationships
    </p>
    <p className="text-base sm:text-lg lg:text-xl mb-5 font-light text-[#518C98]">
      through large, high-resolution, quantitative datasets.
    </p>
    <div className="flex space-x-4 pt-2 pb-10 justify-center">
      <Button
        className="bg-[#06B7DB] text-white rounded-lg px-6 py-2 text-lg transition-all duration-300 hover:scale-105"
        size="md"
      >
        Get Started
      </Button>
      <Button
        className="bg-transparent text-[#06B7DB] border border-[#06B7DB] rounded-lg px-6 py-2 text-lg transition-all duration-300 hover:scale-105"
        size="md"
        color="primary"
      >
        Learn More
      </Button>
    </div>
  </div>

  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 relative text-center">
    <div className="flex justify-center">
      <img
        src="/resources/images/thumb.png"
        alt="Dashboard image" 
        className="rounded-t-3xl w-full max-w-[1000px] select-none h-auto object-cover" 
        draggable="false"
      />
    </div>
  </div>
</section>
                                            




      <div className="mx-4 sm:mx-8 lg:mx-24 py-20 bg-white">

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
              className="w-[250px] h-[40px] font-semibold border-[#06B7DB] border-2 text-[#06B7DB] transition-all duration-300 hover:bg-[#06B7DB] hover:text-white hover:shadow-xl hover:scale-105"
            >
              Learn More
            </Button>
          </div>
          <div className="flex justify-center lg:justify-start">
            <img 
              src="/resources/images/Homepage.png" 
              draggable="false" 
              className="select-none rounded-lg object-cover max-w-full" 
              alt="mockup" 
            />
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
          <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
            <img src="/resources/images/card_large.png" draggable="false" 
            className="max-w-full select-none" alt="mockup" />
          </div>
          <div className="order-1 lg:order-2 lg:pt-1">
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
            className="w-[250px] h-[40px] font-semibold bg-[#06B7DB] text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Submit Data
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
