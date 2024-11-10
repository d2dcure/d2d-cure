import React from 'react';
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {Card, CardBody, CardFooter} from "@nextui-org/react";
import {Button} from "@nextui-org/react";
import Link from 'next/link';
import { MdEmail } from "react-icons/md";
import { FaLinkedin } from "react-icons/fa";
import { Tabs, Tab } from "@nextui-org/react";

const AboutD2D = () => {
  const [selected, setSelected] = React.useState<"operations" | "consultants">("operations");

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

        {/* Logo Carousels */}
        <div className="w-full mt-16">
          {/* Left to Right carousel */}
          <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll">
              {networkLogos.slice(0, 17).map((logo, index) => (
                <li key={index}>
                  <img src={logo.src} alt={logo.alt} className="h-16 w-auto object-contain" />
                </li>
              ))}
            </ul>
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll" aria-hidden="true">
              {networkLogos.slice(0, 17).map((logo, index) => (
                <li key={index}>
                  <img src={logo.src} alt={logo.alt} className="h-16 w-auto object-contain" />
                </li>
              ))}
            </ul>
          </div>

          {/* Right to Left carousel */}
          <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)] my-8">
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll-reverse">
              {networkLogos.slice(17, 34).map((logo, index) => (
                <li key={index}>
                  <img src={logo.src} alt={logo.alt} className="h-16 w-auto object-contain" />
                </li>
              ))}
            </ul>
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll-reverse" aria-hidden="true">
              {networkLogos.slice(17, 34).map((logo, index) => (
                <li key={index}>
                  <img src={logo.src} alt={logo.alt} className="h-16 w-auto object-contain" />
                </li>
              ))}
            </ul>
          </div>

          {/* Left to Right carousel */}
          <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll">
              {networkLogos.slice(34).map((logo, index) => (
                <li key={index}>
                  <img src={logo.src} alt={logo.alt} className="h-16 w-auto object-contain" />
                </li>
              ))}
            </ul>
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll" aria-hidden="true">
              {networkLogos.slice(34).map((logo, index) => (
                <li key={index}>
                  <img src={logo.src} alt={logo.alt} className="h-16 w-auto object-contain" />
                </li>
              ))}
            </ul>
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
        
        <div className="flex w-full flex-col">
          <Tabs 
            aria-label="Faculty categories"
            selectedKey={selected}
            onSelectionChange={(key) => setSelected(key as "operations" | "consultants")}
          >
            <Tab key="operations" title="D2D Operations">
              <div className="grid mt-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {facultyData.slice(0, 3).map((faculty) => (
                  <div key={faculty.name} className="h-auto">
                    <div className="text-center">
                      <div className="max-w-[250px] mx-auto">
                        {faculty.image === "/resources/images/sample.jpg" ? (
                          <div className="w-full aspect-square rounded-lg mb-4 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-4xl">No Image</span>
                          </div>
                        ) : (
                          <img
                            src={faculty.image}
                            alt={faculty.name}
                            className="w-full aspect-square object-cover rounded-lg mb-4"
                          />
                        )}
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
            </Tab>
            <Tab key="consultants" title="D2D Consultants">
              <div className="grid mt-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {facultyData.slice(3).map((faculty) => (
                  <div key={faculty.name} className="h-auto">
                    <div className="text-center">
                      <div className="max-w-[250px] mx-auto">
                        {faculty.image === "/resources/images/sample.jpg" ? (
                          <div className="w-full aspect-square rounded-lg mb-4 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-4xl">No Image</span>
                          </div>
                        ) : (
                          <img
                            src={faculty.image}
                            alt={faculty.name}
                            className="w-full aspect-square object-cover rounded-lg mb-4"
                          />
                        )}
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
            </Tab>
          </Tabs>
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
        
        

        {/* Map iframe */}
        <div className="mt-8 aspect-w-16 aspect-h-9">
          <iframe 
            src="https://embed.kumu.io/54d29a647a7b3825ed3a1111620c9a5e" 
            width="100%" 
            height="600" 
            frameBorder="0"
            title="D2D Institution Network Map"
          />
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

const networkLogos = [
  // row1
  { src: "/resources/school_logos/row1/Augustana_logo.png", alt: "Augustana University" },
  { src: "/resources/school_logos/row1/CCC_logo.png", alt: "California Community Colleges" },
  { src: "/resources/school_logos/row1/Crown_logo.png", alt: "Crown College" },
  { src: "/resources/school_logos/row1/FIU_logo.png", alt: "Florida International University" },
  { src: "/resources/school_logos/row1/Hamline_logo.png", alt: "Hamline University" },
  { src: "/resources/school_logos/row1/JHU_logo.png", alt: "Johns Hopkins University" },
  { src: "/resources/school_logos/row1/Lewis_logo.png", alt: "Lewis University" },
  { src: "/resources/school_logos/row1/MiraCosta_logo.png", alt: "MiraCosta College" },
  { src: "/resources/school_logos/row1/TMCC_logo.png", alt: "Truckee Meadows Community College" },
  { src: "/resources/school_logos/row1/UGA_logo.png", alt: "University of Georgia" },
  { src: "/resources/school_logos/row1/UNLV_logo.png", alt: "University of Nevada, Las Vegas" },
  { src: "/resources/school_logos/row1/Wayne_logo.png", alt: "Wayne State University" },
  
  // row2
  { src: "/resources/school_logos/row2/Campbell_logo.png", alt: "Campbell University" },
  { src: "/resources/school_logos/row2/CNM_logo.png", alt: "Central New Mexico Community College" },
  { src: "/resources/school_logos/row2/CSS_logo.png", alt: "College of St. Scholastica" },
  { src: "/resources/school_logos/row2/CSU_logo.png", alt: "Colorado State University" },
  { src: "/resources/school_logos/row2/DUNY_logo.png", alt: "Dominican University New York" },
  { src: "/resources/school_logos/row2/JCCC_logo.png", alt: "Johnson County Community College" },
  { src: "/resources/school_logos/row2/KWC_logo.png", alt: "Kentucky Wesleyan College" },
  { src: "/resources/school_logos/row2/LUC_logo.png", alt: "Loyola University Chicago" },
  { src: "/resources/school_logos/row2/Mercy_logo.png", alt: "Mercy College" },
  { src: "/resources/school_logos/row2/MJC_logo.png", alt: "Modesto Junior College" },
  { src: "/resources/school_logos/row2/SUNY_Geneseo_logo.png", alt: "SUNY Geneseo" },
  { src: "/resources/school_logos/row2/Taylor_logo.png", alt: "Taylor University" },
  { src: "/resources/school_logos/row2/UAH_logo.png", alt: "University of Alabama in Huntsville" },
  { src: "/resources/school_logos/row2/UMW_logo.png", alt: "University of Mary Washington" },
  { src: "/resources/school_logos/row2/UNH_logo.png", alt: "University of New Hampshire" },
  { src: "/resources/school_logos/row2/VSU_logo.png", alt: "Valdosta State University" },
  { src: "/resources/school_logos/row2/Yale_logo.png", alt: "Yale University" },

  // row3
  { src: "/resources/school_logos/row3/Creighton_logo.png", alt: "Creighton University" },
  { src: "/resources/school_logos/row3/CSU_Fresno_logo.png", alt: "CSU Fresno" },
  { src: "/resources/school_logos/row3/Gettysburg_logo.png", alt: "Gettysburg College" },
  { src: "/resources/school_logos/row3/GHC_logo.png", alt: "Georgia Highlands College" },
  { src: "/resources/school_logos/row3/Hofstra_logo.png", alt: "Hofstra University" },
  { src: "/resources/school_logos/row3/JCQUST_logo.png", alt: "JCQUST" },
  { src: "/resources/school_logos/row3/Juniata_logo.png", alt: "Juniata College" },
  { src: "/resources/school_logos/row3/KCKCC_logo.png", alt: "Kansas City Kansas Community College" },
  { src: "/resources/school_logos/row3/La_Sierra_logo.png", alt: "La Sierra University" },
  { src: "/resources/school_logos/row3/NSU_logo.png", alt: "Norfolk State University" },
  { src: "/resources/school_logos/row3/Regis_logo.png", alt: "Regis University" },
  { src: "/resources/school_logos/row3/Smith_logo.png", alt: "Smith College" },
  { src: "/resources/school_logos/row3/UNF_logo.png", alt: "University of North Florida" },

  // row4
  { src: "/resources/school_logos/row4/Carthage_logo.png", alt: "Carthage College" },
  { src: "/resources/school_logos/row4/ECU_logo.png", alt: "East Carolina University" },
  { src: "/resources/school_logos/row4/Elmhurst_logo.png", alt: "Elmhurst University" },
  { src: "/resources/school_logos/row4/KU_logo.png", alt: "University of Kansas" },
  { src: "/resources/school_logos/row4/Mines_logo.png", alt: "Colorado School of Mines" },
  { src: "/resources/school_logos/row4/MWSU_logo.png", alt: "Missouri Western State University" },
  { src: "/resources/school_logos/row4/PolyU_logo.png", alt: "Hong Kong Polytechnic University" },
  { src: "/resources/school_logos/row4/SMCC_logo.png", alt: "Southern Maine Community College" },
  { src: "/resources/school_logos/row4/UMass_Amherst_logo.png", alt: "University of Massachusetts Amherst" },
  { src: "/resources/school_logos/row4/UNR_logo.png", alt: "University of Nevada, Reno" }
];

export default AboutD2D;




