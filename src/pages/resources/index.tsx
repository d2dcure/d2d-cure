import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Card, CardBody, CardFooter, Link } from "@nextui-org/react";

const Resources = () => {
  return (
    <>
      <NavBar />
      {/* Hero Section */}
      <div className="px-4 md:px-8 lg:px-24 py-8 md:py-10 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-36">
          <div className="flex flex-col justify-center">
            <Breadcrumbs className="mb-4">
              <BreadcrumbItem>Home</BreadcrumbItem>
              <BreadcrumbItem>Resources</BreadcrumbItem>
            </Breadcrumbs>
            <div className="pt-4 lg:pt-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-inter tracking-tight leading-tight mb-4">
                Resources
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-gray-500 max-w-lg">
                Explore Comprehensive Resources for D2D CURE: Delve into Structural Insights, Sequence Data, and Research Publications for β-glucosidase B (BglB)
              </p>
            </div>
          </div>
          <div className="hidden lg:flex justify-center items-center">
            <img 
              src="/resources/images/Design-Data-class-UC-Davis.webp" 
              alt="mockup" 
              className="max-w-full h-auto rounded-2xl mt-8"
              draggable="false"
              loading="lazy"
              unselectable="on"
            />
          </div>
        </div>
      </div>

      {/* Data Section */}
      <div className="px-4 md:px-8 lg:px-24 py-8 md:py-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl mb-8 font-inter tracking-tight">
          Data
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {[
            {
              title: "Structure & Sequence Files",
              link: "#",
              linkText: "View Files"
            },
            {
              title: "Oligo Search",
              link: "/resources/oligosearch",
              linkText: "Search Database"
            },
            {
              title: "Complete BgLb Sequence",
              link: "#",
              linkText: "View Sequence"
            },
            {
              title: "How data is calculated",
              link: "#",
              linkText: "Learn More"
            },
            {
              title: "How to interpret data",
              link: "#",
              linkText: "Learn More"
            },
            {
              title: "Enzyme Rate Calculator",
              link: "#",
              linkText: "Visit Calculator"
            }
          ].map((item, index) => (
            <Card 
              key={index} 
              className="h-[170px] hover:scale-105 transition-transform overflow-hidden cursor-pointer flex flex-col justify-between"
              as={Link}
              href={item.link}
            >
              <CardBody className="text-2xl md:text-3xl lg:text-4xl font-light overflow-hidden">
                <h3 className="pl-4 pt-2">{item.title}</h3>
              </CardBody>
              <CardFooter>
                <span className="text-sm pl-4 pb-3 text-[#06B7DB] group-hover:font-semibold hover:font-semibold">
                  {item.linkText} {'>'}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Process Section */}
      <div className="px-4 md:px-8 lg:px-24 py-4 md:py-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl mb-8 font-inter tracking-tight">
          Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Lab Manual",
              link: "#",
              linkText: "Open Manual"
            },
            {
              title: "Publications",
              link: "#",
              linkText: "Learn More"
            }
          ].map((item, index) => (
            <Card 
              key={index} 
              className="h-[170px] hover:scale-105 transition-transform overflow-hidden cursor-pointer flex flex-col justify-between"
              as={Link}
              href={item.link}
            >
              <CardBody className="text-2xl md:text-3xl lg:text-4xl font-light overflow-hidden">
                <h3 className="pl-4 pt-2">{item.title}</h3>
              </CardBody>
              <CardFooter>
                <span className="text-sm pl-4 pb-3 text-[#06B7DB] group-hover:font-semibold hover:font-semibold">
                  {item.linkText} {'>'}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Protein Science Section */}
      <div className="px-4 md:px-8 lg:px-24 py-4 md:py-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl mb-8 font-inter tracking-tight">
          Protein Science
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Rosetta Education Hub",
              link: "#",
              linkText: "Visit Website"
            }
          ].map((item, index) => (
            <Card 
              key={index} 
              className="h-[170px] hover:scale-105 transition-transform overflow-hidden cursor-pointer flex flex-col justify-between"
              as={Link}
              href={item.link}
            >
              <CardBody className="text-2xl md:text-3xl lg:text-4xl font-light overflow-hidden">
                <h3 className="pl-4 pt-2">{item.title}</h3>
              </CardBody>
              <CardFooter>
                <span className="text-sm pl-4 pb-3 text-[#06B7DB] group-hover:font-semibold hover:font-semibold">
                  {item.linkText} {'>'}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Resources;