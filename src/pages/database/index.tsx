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
            <div className="flex items-center gap-3 mt-12 mb-8">
              <svg width="24" height="26" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.27125 0 0 3.075 0 7V19C0 22.925 5.27125 26 12 26C18.7288 26 24 22.925 24 19V7C24 3.075 18.7288 0 12 0ZM22 13C22 14.2025 21.015 15.4288 19.2987 16.365C17.3662 17.4188 14.7738 18 12 18C9.22625 18 6.63375 17.4188 4.70125 16.365C2.985 15.4288 2 14.2025 2 13V10.92C4.1325 12.795 7.77875 14 12 14C16.2213 14 19.8675 12.79 22 10.92V13ZM4.70125 3.635C6.63375 2.58125 9.22625 2 12 2C14.7738 2 17.3662 2.58125 19.2987 3.635C21.015 4.57125 22 5.7975 22 7C22 8.2025 21.015 9.42875 19.2987 10.365C17.3662 11.4187 14.7738 12 12 12C9.22625 12 6.63375 11.4187 4.70125 10.365C2.985 9.42875 2 8.2025 2 7C2 5.7975 2.985 4.57125 4.70125 3.635ZM19.2987 22.365C17.3662 23.4188 14.7738 24 12 24C9.22625 24 6.63375 23.4188 4.70125 22.365C2.985 21.4287 2 20.2025 2 19V16.92C4.1325 18.795 7.77875 20 12 20C16.2213 20 19.8675 18.79 22 16.92V19C22 20.2025 21.015 21.4287 19.2987 22.365Z" fill="#06B7DB"/>
              </svg>
              <p className="text-4xl text-base text-gray-500 font-light lg:text-3xl">
                Characterization Data
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <Card 
                className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
                as={Link}
                href="/data/char"
              >
                <CardBody className="flex flex-col justify-between h-full">
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-light pl-4 pt-2">
                    BglB Data
                  </h3>
                  <span className="text-sm pl-4 pb-4 text-[#06B7DB] hover:font-semibold">
                    View characterization data {'>'}
                  </span>
                </CardBody>
              </Card>

              <Card 
                className="h-[170px] cursor-not-allowed opacity-70"
              >
                <CardBody className="flex flex-col justify-between h-full">
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-light pl-4 pt-2">
                    Future Data
                  </h3>
                  <span className="text-sm pl-4 pb-4 text-gray-500">
                    Coming Soon
                  </span>
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