import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Card, CardBody } from "@nextui-org/react";
import Link from 'next/link';
import "../../app/globals.css";

const DatabasePage = () => {
  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 mb-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbItem>Database</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-8">
            <h1 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
              Database
            </h1>
            <p className="max-w-2xl mb-8 text-base md:text-lg lg:text-xl text-gray-500 dark:text-gray-200">
              Characterization Data
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <Link href="/bglb">
                <Card className="h-[190px] cursor-pointer hover:scale-105 transition-transform">
                  <CardBody className="text-4xl pt-6 font-light overflow-hidden">
                    <img src="/resources/images/database.png" className="pl-4 pt-4 w-14 h-15" alt="BglB Data" />
                    <h1 className="text-xl pl-5 pt-2 font-semibold">BglB Data</h1>
                    <p className="text-sm pl-5 pt-2 text-gray-500">View characterization data for BglB variants</p>
                  </CardBody>
                </Card>
              </Link>

              <Card className="h-[190px] cursor-not-allowed opacity-70">
                <CardBody className="text-4xl pt-6 font-light overflow-hidden">
                  <img src="/resources/images/database.png" className="pl-4 pt-4 w-14 h-15" alt="Future Data" />
                  <h1 className="text-xl pl-5 pt-2 font-semibold">Future Data</h1>
                  <p className="text-sm pl-5 pt-2 text-gray-500">Coming Soon</p>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DatabasePage;