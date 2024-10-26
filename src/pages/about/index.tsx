import React from 'react';
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {Card, CardBody, CardFooter} from "@nextui-org/react";
import {Button} from "@nextui-org/react";
import Link from 'next/link';
const AboutD2D = () => {
  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <div className="col-span-1 items-center">
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbItem>About</BreadcrumbItem>
          </Breadcrumbs>
          <div className="pt-6">
            <h1 className="mb-2 text-5xl md:text-5xl lg:text-6xl font-inter dark:text-white">
              About D2D Cure
            </h1>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2">
            <h2 className="text-4xl md:text-4xl lg:text-4xl dark:text-white">Our Mission</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
            The Design2Data Program involves students in an investigation of the sequence-structure-function relationship of proteins. Using the lens of protein biochemistry, students expand their knowledge and develop skills by engaging in a research workflow representative of cutting-edge biotechnology training in high demand by employers.            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
            A feature that makes D2D unique among other multi-institutional protein biochemistry CUREs is its connection to the protein modeling research community, RosettaCommons, which uses the student-generated data to improve functionally predictive enzyme-design algorithms.            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
            Large, uniformly obtained measurements of biophysical properties covering a broad and diverse sequence space across a wide range of enzymes are needed to truly begin utilizing the power of modern computational tools for creating predictive models of enzyme function. </p>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0 md:ml-16">
          <img src="/resources/images/Homepage.png" draggable="false" className="select-none max-w-full" alt="mockup" />
          </div>
        </div>
      </div>

      {/* Enzymes Section */}
      <div className="px-6 md:px-12 lg:px-24 py-8">
        <h2 className="mb-8 text-3xl md:text-4xl dark:text-white">Meet Our Enzymes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2].map((item) => (
            <Card key={item} className="h-[190px]">
              <CardBody className="text-4xl pt-6 font-light overflow-hidden">
                <img src="/resources/images/download.png" className="pl-4 pt-4 w-14 h-15" alt="mockup" />
                <h1 className="text-xl pl-5 pt-2 font-semibold">BglB.pdb</h1>
              </CardBody>
              <CardFooter>
                <Button 
                  variant="bordered" 
                  onPress={() => window.location.href = '/login'} 
                  className="w-full h-[45px] font-semibold border-[3px] hover:bg-blue-300"
                  style={{ borderColor: "#06B7DB", color: "#06B7DB" }}
                >
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Faculty Section */}
      <div className="px-6 md:px-12 lg:px-24 py-8">
        <h2 className="mb-8 text-3xl md:text-4xl dark:text-white">Meet The Faculty</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {facultyData.map((faculty) => (
            <div key={faculty.name} className="h-auto">
              <div className="text-center">
                <img
                  src={faculty.image}
                  alt={faculty.name}
                  className="w-80 h-70 mx-auto rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {faculty.name}, {faculty.degree}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{faculty.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Network Map Section */}
      <div className="px-6 md:px-12 lg:px-24 py-8">
  <h2 className="mb-8 text-3xl md:text-4xl dark:text-white">D2D Network Map</h2>
  <p className="mt-4 text-gray-600 dark:text-gray-300">
    Our D2D network map shows geographical locations of nodes and lists faculty institutions.
  </p>
  <div className="mt-8 aspect-w-16 aspect-h-9">
    <iframe 
      src="https://kumu.io/awvater/d2d-institution-network-map" 
      width="100%" 
      height="600" 
      frameBorder="0"
      title="D2D Institution Network Map"
    ></iframe>
  </div>
</div>

      {/* LinkedIn Section */}
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2">
            <h2 className="text-4xl md:text-4xl lg:text-4xl dark:text-white">D2D LinkedIn Group</h2>
            <p className="mt-4 mb-5 text-gray-600 dark:text-gray-300">
            The goal of the D2D LinkedIn group is to facilitate networking and build a community of professionals around our shared D2D research project, fostering collaboration and knowledge-sharing among members!           </p>
            <Link
              href=""
              className="px-4 py-2 font-semibold bg-[#06B7DB] text-white rounded-lg hover:bg-[#05a5c6] transition-colors duration-200"
            >
              Join our group
            </Link>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0 md:ml-16">
          <img src="/resources/images/Homepage.png" draggable="false" className="select-none max-w-full" alt="mockup" />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

const facultyData = [
  {
    name: "Jason W Labont",
    degree: "Ph.D.",
    title: "D2D Database & App Developer",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Justin B Siegel",
    degree: "Ph.D.",
    title: "Principal Investigator",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Ashley Vater",
    degree: "M.S.",
    title: "Program Director",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Geleana Alston",
    degree: "Ph.D.",
    title: "Program Evaluator",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Jeffrey J Gray",
    degree: "Ph.D.",
    title: "Rosetta Commons Consultant",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Kelly McDonald",
    degree: "Ph.D.",
    title: "CURE Pedagogy Consultant",
    image: "/resources/images/sample.jpg",
  },
];

export default AboutD2D;