import React from 'react';
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import {Button} from "@nextui-org/react";
import Footer from '@/components/Footer';
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/react";
import { useUser } from '@/components/UserProvider';
import { Link } from "@nextui-org/react";

interface ResourceCard {
  id: number;
  title: string;
  subtitle?: string;
  imagePath: string;
  downloadUrl: string;
}

const bglbFiles: ResourceCard[] = [
  { id: 1, title: "BglB.pdb", imagePath: "/resources/images/download.svg", downloadUrl: "/downloads/BglB.pdb" },
  { id: 2, title: "BglB Foldit Files (zipped)", imagePath: "/resources/images/download.svg", downloadUrl: "/downloads/BglB-foldit.zip" },
  { id: 3, title: "BglB FastA Sequence File", imagePath: "/resources/images/download.svg", downloadUrl: "/downloads/BglB.fasta" },
];

const assayTemplates: ResourceCard[] = [
  { id: 1, title: "Kinetic Assay Data",     imagePath: "/resources/images/Microsoft_Excel-Logo.wine.svg",
     downloadUrl: "/downloads/kinetic-assay-template.xlsx" },
  { 
    id: 2, 
    title: "Temperature Assay Data",
    subtitle: "(standard vertical temperature gradient)", 
    imagePath: "/resources/images/Microsoft_Excel-Logo.wine.svg",
    downloadUrl: "/downloads/temperature-assay-template-1.xlsx"
  },
  { 
    id: 3, 
    title: "Temperature Assay Data",
    subtitle: "(alternate horizontal temperature gradient)", 
    imagePath: "/resources/images/Microsoft_Excel-Logo.wine.svg",
    downloadUrl: "/downloads/temperature-assay-template-2.xlsx"
  },
];

const ResourceCardComponent: React.FC<ResourceCard> = ({ title, subtitle, imagePath, downloadUrl }) => (
  <Card className="h-[200px] w-full sm:w-[300px] hover:scale-105 transition-transform">
    <CardBody className="text-4xl pt-8 font-light overflow-hidden">
      <img 
        src={imagePath}
        className="pl-4 pt-2 w-14 h-12 select-none pointer-events-none" 
        draggable="false"
        alt="mockup" 
      />
      <h1 className="text-lg pl-5 pt-2 font-regular">{title}</h1>
      {subtitle && (
        <p className="text-xs pl-5 text-gray-500 -mt-1">{subtitle}</p>
      )}
    </CardBody>
    <CardFooter>
      <Button 
        variant="bordered" 
        onPress={() => window.location.href = downloadUrl} 
        className="w-full h-[45px] font-regular border-[2px] hover:bg-[#06B7DB] group"
        style={{ borderColor: "#06B7DB", color: "#06B7DB" }}
      >
        <span className="group-hover:text-white">Download</span>
      </Button>
    </CardFooter>
  </Card>
);

interface ResourceSectionProps {
  title: string;
  resources: ResourceCard[];
}

const ResourceSection: React.FC<ResourceSectionProps> = ({ title, resources }) => (
  <div>
    <h2 className="mb-8 text-2xl text-[#525252] font-light md:text-3xl font-inter tracking-tight leading-none dark:text-white">
      {title}
    </h2>
    <div className="grid mb-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 justify-items-center">
      {resources.map((resource) => (
        <ResourceCardComponent key={resource.id} {...resource} />
      ))}
    </div>
  </div>
);

const Test = () => {
  const { user } = useUser();

  return (
    <>
      <NavBar/>
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <div className="col-span-1 items-center">
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/resources">Resources</BreadcrumbItem>
            <BreadcrumbItem>Structure & Sequence Files</BreadcrumbItem>
          </Breadcrumbs>
          <div className="pt-6">
            <h1 className="mb-2 text-3xl md:text-4xl lg:text-5xl font-inter">
              Structure & Sequence Files
            </h1>
          </div>
        </div>
      </div>
      <div className="px-6 md:px-12 lg:px-24 mb-20 flex flex-col gap-8">
        <ResourceSection title="β-glucosidase B (BglB)" resources={bglbFiles} />
        {user && (
          <ResourceSection title="Assay Data Spreadsheet Templates" resources={assayTemplates} />
        )}
        {!user && (
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-[#06B7DB]/10 rounded-lg">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-[#06B7DB]" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                Assay Templates Available
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Sign in to your D2D account to access assay data spreadsheet templates and other exclusive research materials.
                </p>
                <div className="flex items-center space-x-3">
                  <Button
                    className="bg-[#06B7DB] text-white hover:bg-[#05a5c6] transition-colors duration-200"
                    onPress={() => window.location.href = '/login'}
                  >
                    Sign In
                  </Button>
                  <span className="text-sm text-gray-500">or</span>
                  <Link 
                    href="/signup" 
                    className="text-sm text-[#06B7DB] hover:underline"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer/>
    </>
  );
};

export default Test;