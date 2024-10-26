import React from 'react';
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import {Button} from "@nextui-org/react";
import Footer from '@/components/Footer';
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/react";

const Test = () => {
  return (
    <>
      <NavBar/>
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <div className="col-span-1 items-center">
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbItem>Resources</BreadcrumbItem>
            <BreadcrumbItem>Structure & Sequence Files</BreadcrumbItem>
          </Breadcrumbs>
          <div className="pt-6">
            <h1 className="mb-2 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
              Structure & Sequence Files
            </h1>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-2">
        <h1 className="mb-8 text-2xl md:text-3xl text-slate-500 font-inter tracking-tight leading-none dark:text-white">
          β-glucosidase B (BglB)
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="h-[190px]">
              <CardBody className="text-4xl pt-6 font-light overflow-hidden">
                <img src="/resources/images/download.png" className="pl-4 pt-4 w-14 h-15" alt="mockup" />
                <h1 className="text-xl pl-5 pt-2 font-semibold">BglB.pdb</h1>
              </CardBody>
              <CardFooter>
                <Button 
                  variant="bordered" 
                  onPress={() => window.location.href = '/login'} 
                  className="w-full h-[45px] font-semibold border-[3px]"
                  style={{ borderColor: "#06B7DB", color: "#06B7DB" }}
                >
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8">
        <h1 className="mb-8 text-2xl md:text-3xl text-slate-500 font-inter dark:text-white">
          Assay Data Spreadsheet Templates
        </h1>
        
        <div className="grid mb-10  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      <Footer/>
    </>
  );
};

export default Test;