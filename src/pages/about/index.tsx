import React from 'react';
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {Card, CardBody, CardFooter} from "@nextui-org/react";
import {Button} from "@nextui-org/react";
import Link from 'next/link';
import { MdEmail } from "react-icons/md";
import { FaLinkedin } from "react-icons/fa";
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
      <div className="px-6 md:px-12 lg:px-24 py-16 bg-white">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-light dark:text-white">Our Mission</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
            The Design2Data Program involves students in an investigation of the sequence-structure-function relationship of proteins. Using the lens of protein biochemistry, students expand their knowledge and develop skills by engaging in a research workflow representative of cutting-edge biotechnology training in high demand by employers.            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
            A feature that makes D2D unique among other multi-institutional protein biochemistry CUREs is its connection to the protein modeling research community, RosettaCommons, which uses the student-generated data to improve functionally predictive enzyme-design algorithms.            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
            Large, uniformly obtained measurements of biophysical properties covering a broad and diverse sequence space across a wide range of enzymes are needed to truly begin utilizing the power of modern computational tools for creating predictive models of enzyme function. </p>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0 md:ml-16">
            <img 
              src="/resources/images/AboutUs-Header.png" 
              draggable="false" 
              className="select-none w-full h-[400px] object-cover rounded-lg" 
              alt="mockup" 
            />
          </div>
        </div>
      </div>

      {/* Enzymes Section */}
      <div className="px-6 md:px-12 lg:px-24 py-16">
        <h2 className="mb-8 text-3xl md:text-4xl font-light dark:text-white">Meet Our Enzymes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="p-6 hover:scale-105 transition-transform cursor-pointer w-full"
            as={Link}
            href="/about/bglb"
          >
            <img 
              src="/resources/images/prettyBglB.png" 
              alt="β-glucosidase B" 
              className="w-16 h-16 mx-4 mb-4"
            />
            <h3 className="text-3xl font-light mx-4 mb-2">β-glucosidase B</h3>
            <p className="text-gray-600 py-4 mx-4 ">
              An enzyme that catalyzes the hydrolysis of glucose monosaccharides from larger molecules at a β-glycosidic linkage
            </p>
            <span className="text-[#06B7DB] mx-4 mb-2 hover:font-semibold">
              Learn More {'>'}
            </span>
          </Card>
          <Card 
            className="p-6 hover:scale-105 transition-transform cursor-pointer w-full"
            as={Link}
            href="/enzymes/beta-glucosidase-b"
          >
            <img 
              src="/resources/images/FutureData-QuesitonMark.png" 
              alt="β-glucosidase B" 
              className="w-16 h-16 mx-4 mb-4"
            />

            <h3 className="text-3xl font-light mx-4 mb-2">Future Data</h3>
            <p className="text-gray-600 pt-4 pb-10 mx-4 ">
            We are actively seeking to identify more enzymes to expand our database.            </p>
            <span className="text-[#06B7DB] mx-4 mb-2 hover:font-semibold">
              Learn More {'>'}
            </span>
          </Card>
        </div>
      </div>



      {/* Faculty Section */}
      <div className="px-6 md:px-12 lg:px-24 py-16">
        <h2 className="mb-8 text-3xl md:text-4xl font-light dark:text-white">Meet The Faculty</h2>
        
        {/* D2D Operations Subheading */}
        <h3 className="text-2xl mb-6 font-light">D2D Operations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {facultyData.slice(0, 3).map((faculty) => (
            <div key={faculty.name} className="h-auto">
              <div className="text-center">
                <div className="max-w-[250px] mx-auto">
                  <img
                    src={faculty.image}
                    alt={faculty.name}
                    className="w-full aspect-square object-cover rounded-lg mb-4"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {faculty.name}, {faculty.degree}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{faculty.title}</p>
                <div className="flex justify-center gap-4 mt-2">
                  <a 
                    href={`mailto:${faculty.email}`} 
                    className="text-gray-600 hover:text-[#06B7DB] transition-colors"
                    aria-label={`Email ${faculty.name}`}
                  >
                    <MdEmail size={24} />
                  </a>
                  <a 
                    href={faculty.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-600 hover:text-[#0077B5] transition-colors"
                    aria-label={`LinkedIn profile of ${faculty.name}`}
                  >
                    <FaLinkedin size={24} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* D2D Consultant Subheading */}
        <h3 className="text-2xl mb-6 font-light">D2D Consultant</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {facultyData.slice(3).map((faculty) => (
            <div key={faculty.name} className="h-auto">
              <div className="text-center">
                <div className="max-w-[250px] mx-auto">
                  <img
                    src={faculty.image}
                    alt={faculty.name}
                    className="w-full aspect-square object-cover rounded-lg mb-4"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {faculty.name}, {faculty.degree}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{faculty.title}</p>
                <div className="flex justify-center gap-4 mt-2">
                  <a 
                    href={`mailto:${faculty.email}`} 
                    className="text-gray-600 hover:text-[#06B7DB] transition-colors"
                    aria-label={`Email ${faculty.name}`}
                  >
                    <MdEmail size={24} />
                  </a>
                  <a 
                    href={faculty.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-600 hover:text-[#0077B5] transition-colors"
                    aria-label={`LinkedIn profile of ${faculty.name}`}
                  >
                    <FaLinkedin size={24} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Network Map Section */}
      <div className="px-6 md:px-12 lg:px-24 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="mb-4 text-4xl font-light dark:text-white">D2D Network Map</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            D2D Network Map shows geographical locations of nodes, lists faculty<br />
            instructors, includes course descriptions, and categorizes CURE variations
          </p>
          <Link
            href="/map"
            className="inline-block mt-8 px-4 py-2 font-semibold bg-[#06B7DB] text-white rounded-lg hover:bg-[#05a5c6] transition-colors duration-200"
          >
            View Map
          </Link>
        </div>
        <div className="mt-8 aspect-w-16 aspect-h-9">
          <iframe 
            src="https://embed.kumu.io/54d29a647a7b3825ed3a1111620c9a5e" 
            width="100%" 
            height="600" 
            frameBorder="0"
            title="D2D Institution Network Map"
          ></iframe>
        </div>
      </div>

      {/* LinkedIn Section */}
      <div className="px-6 md:px-12 lg:px-24 py-16 bg-white">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-light dark:text-white">D2D LinkedIn Group</h2>
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
            <img 
              src="/resources/images/AboustUs-LinkedinGroup.jpeg" 
              draggable="false" 
              className="select-none w-full h-[400px] object-cover rounded-lg" 
              alt="mockup" 
            />
          </div>
        </div>
      </div>

      {/* CodeLab Section */}
      <div className="px-6 md:px-12 lg:px-24 py-16 bg-white">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:mr-16">
            <img 
              src="/resources/images/d2d-aboutus.png" 
              draggable="false" 
              className="select-none w-full h-[400px] object-cover rounded-lg" 
              alt="CodeLab Logo" 
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-4xl font-light dark:text-white">Special thanks to our technical team</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              This website was designed and developed by a group of students from 
              <img 
                src="/resources/images/codelablogo.png"
                alt="CodeLab"
                className="inline-block h-3 ml-1 mb-1.5"
              />
              , a software development and design agency at the University of California, Davis.
            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              <strong>Project Managers:</strong> Mohnish Gopi and Jess Fong
            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              <strong>Developers:</strong> Vishal Koppuru, Ryan Uyeki, Hussain Ali, Kevin Bao, Vikram Karmarkar, Rahul Buhdiraja
            </p>
            <p className="mt-4 mb-5 text-gray-600 dark:text-gray-300">
              <strong>Designers:</strong> Edyn Stepler, Samantha Tran
            </p>
            <Link
              href="https://www.codelabdavis.com/"
              className="px-4 py-2 font-semibold bg-[#06B7DB] text-white rounded-lg hover:bg-[#05a5c6] transition-colors duration-200"
            >
              Learn more about CodeLab
            </Link>
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
    email: "example@email.com",
    linkedin: "https://www.linkedin.com/in/username",
  },
  {
    name: "Justin B Siegel",
    degree: "Ph.D.",
    title: "Principal Investigator",
    image: "/resources/images/sample.jpg",
    email: "example@email.com",
    linkedin: "https://www.linkedin.com/in/username",
  },
  {
    name: "Ashley Vater",
    degree: "M.S.",
    title: "Program Director",
    image: "/resources/images/sample.jpg",
    email: "example@email.com",
    linkedin: "https://www.linkedin.com/in/username",
  },
  {
    name: "Geleana Alston",
    degree: "Ph.D.",
    title: "Program Evaluator",
    image: "/resources/images/sample.jpg",
    email: "example@email.com",
    linkedin: "https://www.linkedin.com/in/username",
  },
  {
    name: "Jeffrey J Gray",
    degree: "Ph.D.",
    title: "Rosetta Commons Consultant",
    image: "/resources/images/sample.jpg",
    email: "example@email.com",
    linkedin: "https://www.linkedin.com/in/username",
  },
  {
    name: "Kelly McDonald",
    degree: "Ph.D.",
    title: "CURE Pedagogy Consultant",
    image: "/resources/images/sample.jpg",
    email: "example@email.com",
    linkedin: "https://www.linkedin.com/in/username",
  },
    // don't have degree from Ashley
  {
    name: "Kari Stone",
    degree: "", 
    title: "NETs Working Group Lead",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Aeisha Thomas",
    degree: "", 
    title: "LOFT Working Group Lead",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Emma Feeney",
    degree: "", 
    title: "Advisory Board Member",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Heather Seitz",
    degree: "", 
    title: "Advisory Board Member",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Daniel Montezano",
    degree: "", 
    title: "Learning Evaluator, Advisory Board Member",
    image: "/resources/images/sample.jpg",
  },
    // don't have degree from Ashley
  {
    name: "Kari Stone",
    degree: "", 
    title: "NETs Working Group Lead",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Aeisha Thomas",
    degree: "", 
    title: "LOFT Working Group Lead",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Emma Feeney",
    degree: "", 
    title: "Advisory Board Member",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Heather Seitz",
    degree: "", 
    title: "Advisory Board Member",
    image: "/resources/images/sample.jpg",
  },
  {
    name: "Daniel Montezano",
    degree: "", 
    title: "Learning Evaluator, Advisory Board Member",
    image: "/resources/images/sample.jpg",
  },
];

export default AboutD2D;




