import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Card, CardBody, Modal, ModalContent, ModalBody } from "@nextui-org/react";
import Link from 'next/link';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import Spinner from '@/components/Spinner';
import { DatabaseIcon, GlobeIcon, FolderIcon } from 'lucide-react';

const DatabasePage = () => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center">
          <Spinner 
            size="lg" 
            classNames={{
              circle1: "border-b-[#06B7DB]",
              circle2: "border-b-[#06B7DB]"
            }}
          />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 mb-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs className="mb-4">
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem>Database</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-8">
            <h1 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
              Database
            </h1>
            
            {/* Characterization Data Section */}
            <div className="flex items-center gap-3 mt-12 mb-8">
              <DatabaseIcon className="w-6 h-6 text-[#06B7DB]" />
              <p className="text-4xl text-base text-gray-500 font-light lg:text-3xl">
                Characterization Data
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
              <Card 
                isPressable
                className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
                as={Link}
                href="/database/characterization_data/BglB"
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

            {/* Data Analysis & Submission Section - Only visible to logged in users */}
            {user && (
              <>
                <div className="flex items-center gap-3 mt-12 mb-8">
                  <GlobeIcon className="w-6 h-6 text-[#06B7DB]" />
                  <p className="text-4xl text-base text-gray-500 font-light lg:text-3xl">
                    Data Analysis & Submission
                  </p>
                </div>
                  <p className="text-4xl text-base text-gray-500 font-light lg:text-3xl">
                    Data Analysis & Submission
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                  <Card 
                    isPressable
                    className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
                    as={Link}
                    href="/submit"
                  >
                    <CardBody className="flex flex-col justify-between h-full">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light pl-4 pt-2">
                        Single Variant
                      </h3>
                      <span className="text-sm pl-4 pb-4 text-[#06B7DB] hover:font-semibold">
                        Submit Data {'>'}
                      </span>
                    </CardBody>
                  </Card>

                  <Card 
                    isPressable
                    className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
                    as={Link}
                    href="/submit"
                  >
                    <CardBody className="flex flex-col justify-between h-full">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light pl-4 pt-2">
                        Wild Type
                      </h3>
                      <span className="text-sm pl-4 pb-4 text-[#06B7DB] hover:font-semibold">
                        Submit Data {'>'}
                      </span>
                    </CardBody>
                  </Card>

                  <Card 
                    isPressable
                    className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
                    as={Link}
                    href="/submit/gel_image_upload"
                  >
                    <CardBody className="flex flex-col justify-between h-full">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light pl-4 pt-2">
                        Gel Image
                      </h3>
                      <span className="text-sm pl-4 pb-4 text-[#06B7DB] hover:font-semibold">
                        Upload Image {'>'}
                      </span>
                    </CardBody>
                  </Card>
                </div>
              </>
            )}

            {/* Curation Section - Only visible to admin/professor */}
            {user?.status === "professor" || user?.status === "ADMIN" ? (
              <>
                <div className="flex items-center gap-3 mt-12 mb-8">
                  <FolderIcon className="w-8 h-8 text-[#06B7DB]" />
                  <p className="text-4xl text-base text-gray-500 font-light lg:text-3xl">
                    Curation of Data
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <Card 
                    isPressable
                    className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
                    as={Link}
                    href="/curate"
                  >
                    <CardBody className="flex flex-col justify-between h-full">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-light pl-4 pt-2">
                        Curate Data
                      </h3>
                      <span className="text-sm pl-4 pb-4 text-[#06B7DB] hover:font-semibold">
                        Review submissions {'>'}
                      </span>
                    </CardBody>
                  </Card>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DatabasePage;