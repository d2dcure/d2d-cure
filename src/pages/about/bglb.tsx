import React from 'react';
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {Card, CardBody} from "@nextui-org/react";
import Link from 'next/link';

const BglBPage = () => {
  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <div className="col-span-1 items-center">
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbItem>About</BreadcrumbItem>
            <BreadcrumbItem>β-glucosidase B</BreadcrumbItem>
          </Breadcrumbs>
          <div className="pt-6">
            <h1 className="mb-2 text-4xl md:text-4xl lg:text-4xl font-light dark:text-white">
              About β-glucosidase B
            </h1>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-6 md:px-12 lg:px-24 py-8 bg-white">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/2">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-semibold w-48">Species:</span>
                <span>Paenibacillus polymyxa</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold w-48">EC Number:</span>
                <span>3.2.1.21</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold w-48">UniProt Number:</span>
                <span>P22505</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold w-48">PCB Entries:</span>
                <span>2JIE 2O9P 2O9R 2O9T 2Z1S</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold w-48">Molar Mass:</span>
                <span>51,573 Da</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold w-48">Extinction Coefficient (εBglB):</span>
                <span>113,330 m−1 cm−1</span>
              </div>
              <Link 
                href="#"
                className="inline-block mt-4 text-[#06B7DB] hover:underline"
              >
                View Full Sequence {'>'}
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2">
            <img 
              src="/resources/images/prettyBglB.png"
              alt="BglB Structure"
              className="w-[400px] mx-auto"
            />
          </div>
        </div>

        <div className="mt-12 space-y-6">
          <p className="text-gray-600">
            β-glucosidase B (BglB, lovingly called "Bagel B" by our teams) is an enzyme that catalyzes 
            the hydrolysis of glucose monosaccharides from larger molecules at a β-glycosidic linkage. 
            It is an essential enzyme for the degradation of cellulose by bacteria and fungi.
          </p>
          <p className="text-gray-600">
            Our computational designs and kinetic measurements will utilize para-nitrophenyl-β-d-glucopyranose (pNPG) 
            as a colorimetric reporter substrate.
          </p>
        </div>
      </div>

      {/* Related Resources Section */}
      <div className="px-6 md:px-12 lg:px-24 py-16">
        <h2 className="mb-8 text-3xl md:text-4xl font-light">Related Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Pathway and Mechanism",
              link: "#",
              linkText: "View Pathway and Mechanism"
            },
            {
              title: "Assay Chemistry",
              link: "#",
              linkText: "View Assay Chemistry"
            },
            {
              title: "Publications",
              link: "#",
              linkText: "View Publications"
            }
          ].map((item, index) => (
            <Card 
              key={index}
              className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
              as={Link}
              href={item.link}
            >
              <CardBody className="text-2xl md:text-3xl lg:text-4xl font-light">
                <h3 className="pl-4 pt-2">{item.title}</h3>
                <span className="text-sm pl-4 pt-4 text-[#06B7DB] hover:font-semibold">
                  {item.linkText} {'>'}
                </span>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default BglBPage;




