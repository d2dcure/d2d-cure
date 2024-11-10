import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Card, CardBody, Modal, ModalContent, ModalBody } from "@nextui-org/react";
import Link from 'next/link';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import Spinner from '@/components/Spinner';

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
          <Breadcrumbs className="mb-2">
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbItem>Database</BreadcrumbItem>
          </Breadcrumbs>

          <div className="pt-8">
            <h1 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-inter dark:text-white">
              Database
            </h1>
            
            {/* Characterization Data Section */}
            <div className="flex items-center gap-3 mt-12 mb-8">
              <svg width="24" height="26" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.27125 0 0 3.075 0 7V19C0 22.925 5.27125 26 12 26C18.7288 26 24 22.925 24 19V7C24 3.075 18.7288 0 12 0ZM22 13C22 14.2025 21.015 15.4288 19.2987 16.365C17.3662 17.4188 14.7738 18 12 18C9.22625 18 6.63375 17.4188 4.70125 16.365C2.985 15.4288 2 14.2025 2 13V10.92C4.1325 12.795 7.77875 14 12 14C16.2213 14 19.8675 12.79 22 10.92V13ZM4.70125 3.635C6.63375 2.58125 9.22625 2 12 2C14.7738 2 17.3662 2.58125 19.2987 3.635C21.015 4.57125 22 5.7975 22 7C22 8.2025 21.015 9.42875 19.2987 10.365C17.3662 11.4187 14.7738 12 12 12C9.22625 12 6.63375 11.4187 4.70125 10.365C2.985 9.42875 2 8.2025 2 7C2 5.7975 2.985 4.57125 4.70125 3.635ZM19.2987 22.365C17.3662 23.4188 14.7738 24 12 24C9.22625 24 6.63375 23.4188 4.70125 22.365C2.985 21.4287 2 20.2025 2 19V16.92C4.1325 18.795 7.77875 20 12 20C16.2213 20 19.8675 18.79 22 16.92V19C22 20.2025 21.015 21.4287 19.2987 22.365Z" fill="#06B7DB"/>
              </svg>
              <p className="text-4xl text-base text-gray-500 font-light lg:text-3xl">
                Characterization Data
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
              <Card 
                className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
                as={Link}
                href="/database/BglB_Characterization"
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
                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="26" viewBox="0 0 27 26" fill="none">
  <path d="M23 16C22.1161 15.9995 21.2572 16.2933 20.5587 16.835L17.67 14.585C17.8881 14.085 18.0004 13.5454 18 13C18 12.9075 18 12.815 17.99 12.7237L19.6437 12.1725C20.1669 12.9794 20.9633 13.5708 21.8871 13.8384C22.8108 14.106 23.8 14.0318 24.6735 13.6294C25.547 13.2271 26.2463 12.5235 26.6433 11.6476C27.0402 10.7716 27.1084 9.78199 26.8351 8.85991C26.5619 7.93784 25.9656 7.14508 25.1555 6.62683C24.3454 6.10858 23.3757 5.89955 22.424 6.03803C21.4723 6.1765 20.6024 6.65321 19.9736 7.38084C19.3447 8.10846 18.9991 9.03829 19 9.99999C19 10.0925 19 10.185 19.01 10.2762L17.3562 10.8275C16.9937 10.267 16.4967 9.8062 15.9105 9.487C15.3242 9.1678 14.6675 9.00038 14 8.99999C13.7793 9.00044 13.559 9.01884 13.3412 9.05499L12.4862 7.12499C13.2245 6.5351 13.7301 5.70288 13.9134 4.77584C14.0967 3.84879 13.9458 2.88679 13.4876 2.06034C13.0293 1.23388 12.2933 0.596356 11.4099 0.26075C10.5265 -0.0748561 9.55283 -0.0868656 8.66143 0.22685C7.77003 0.540565 7.01848 1.15974 6.54 1.97464C6.06151 2.78954 5.88698 3.74753 6.04735 4.67882C6.20772 5.6101 6.69263 6.45453 7.41613 7.06245C8.13962 7.67037 9.05499 8.0025 9.99997 7.99999C10.2207 7.99953 10.441 7.98113 10.6587 7.94499L11.5137 9.86999C10.7887 10.4438 10.2854 11.2517 10.09 12.1555C9.89465 13.0593 10.0192 14.0029 10.4425 14.825L7.22872 17.68C6.41995 17.1348 5.44009 16.9032 4.47281 17.0287C3.50553 17.1543 2.61724 17.6283 1.97443 18.3619C1.33163 19.0955 0.978451 20.0384 0.981094 21.0138C0.983736 21.9892 1.34202 22.9301 1.98879 23.6602C2.63556 24.3903 3.52641 24.8595 4.49435 24.9798C5.4623 25.1001 6.44089 24.8633 7.2467 24.3136C8.0525 23.764 8.6302 22.9394 8.87151 21.9943C9.11281 21.0493 9.00116 20.0486 8.55747 19.18L11.7712 16.325C12.4671 16.7935 13.2929 17.0307 14.1313 17.0029C14.9697 16.9751 15.778 16.6836 16.4412 16.17L19.33 18.42C19.1126 18.9184 19.0002 19.4562 19 20C19 20.7911 19.2346 21.5645 19.6741 22.2223C20.1136 22.8801 20.7383 23.3928 21.4692 23.6955C22.2001 23.9983 23.0044 24.0775 23.7803 23.9231C24.5563 23.7688 25.269 23.3878 25.8284 22.8284C26.3878 22.269 26.7688 21.5563 26.9231 20.7803C27.0775 20.0044 26.9982 19.2002 26.6955 18.4693C26.3927 17.7383 25.8801 17.1136 25.2223 16.6741C24.5645 16.2346 23.7911 16 23 16ZM23 7.99999C23.3955 7.99999 23.7822 8.11728 24.1111 8.33705C24.44 8.55681 24.6964 8.86917 24.8477 9.23462C24.9991 9.60007 25.0387 10.0022 24.9615 10.3902C24.8844 10.7781 24.6939 11.1345 24.4142 11.4142C24.1345 11.6939 23.7781 11.8844 23.3902 11.9616C23.0022 12.0387 22.6001 11.9991 22.2346 11.8477C21.8692 11.6964 21.5568 11.44 21.337 11.1111C21.1173 10.7822 21 10.3955 21 9.99999C21 9.46955 21.2107 8.96084 21.5858 8.58577C21.9608 8.2107 22.4695 7.99999 23 7.99999ZM7.99997 3.99999C7.99997 3.60442 8.11727 3.21774 8.33704 2.88885C8.5568 2.55995 8.86916 2.3036 9.23461 2.15223C9.60006 2.00085 10.0022 1.96124 10.3902 2.03842C10.7781 2.11559 11.1345 2.30607 11.4142 2.58577C11.6939 2.86548 11.8844 3.22184 11.9615 3.60981C12.0387 3.99777 11.9991 4.3999 11.8477 4.76535C11.6964 5.13081 11.44 5.44316 11.1111 5.66293C10.7822 5.88269 10.3955 5.99999 9.99997 5.99999C9.46954 5.99999 8.96083 5.78927 8.58576 5.4142C8.21069 5.03913 7.99997 4.53042 7.99997 3.99999ZM4.99997 23C4.60441 23 4.21773 22.8827 3.88883 22.6629C3.55994 22.4432 3.30359 22.1308 3.15222 21.7654C3.00084 21.3999 2.96123 20.9978 3.0384 20.6098C3.11557 20.2218 3.30606 19.8655 3.58576 19.5858C3.86547 19.3061 4.22183 19.1156 4.60979 19.0384C4.99776 18.9612 5.39989 19.0009 5.76534 19.1522C6.13079 19.3036 6.44315 19.5599 6.66291 19.8888C6.88268 20.2177 6.99997 20.6044 6.99997 21C6.99997 21.5304 6.78926 22.0391 6.41419 22.4142C6.03911 22.7893 5.53041 23 4.99997 23ZM12 13C12 12.6044 12.1173 12.2177 12.337 11.8888C12.5568 11.5599 12.8692 11.3036 13.2346 11.1522C13.6001 11.0009 14.0022 10.9612 14.3902 11.0384C14.7781 11.1156 15.1345 11.3061 15.4142 11.5858C15.6939 11.8655 15.8844 12.2218 15.9615 12.6098C16.0387 12.9978 15.9991 13.3999 15.8477 13.7654C15.6964 14.1308 15.44 14.4432 15.1111 14.6629C14.7822 14.8827 14.3955 15 14 15C13.4695 15 12.9608 14.7893 12.5858 14.4142C12.2107 14.0391 12 13.5304 12 13ZM23 22C22.6044 22 22.2177 21.8827 21.8888 21.6629C21.5599 21.4432 21.3036 21.1308 21.1522 20.7654C21.0008 20.3999 20.9612 19.9978 21.0384 19.6098C21.1156 19.2218 21.3061 18.8655 21.5858 18.5858C21.8655 18.3061 22.2218 18.1156 22.6098 18.0384C22.9978 17.9612 23.3999 18.0009 23.7653 18.1522C24.1308 18.3036 24.4432 18.5599 24.6629 18.8888C24.8827 19.2177 25 19.6044 25 20C25 20.5304 24.7893 21.0391 24.4142 21.4142C24.0391 21.7893 23.5304 22 23 22Z" fill="#06B7DB"/>
</svg>
                  <p className="text-4xl text-base text-gray-500 font-light lg:text-3xl">
                    Data Analysis & Submission
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                  <Card 
                    className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
                    as={Link}
                    href="/submit/single_variant"
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
                    className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
                    as={Link}
                    href="/submit/wild_type"
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
                    className="h-[170px] hover:scale-105 transition-transform cursor-pointer"
                    as={Link}
                    href="/submit/gel_image"
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
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
  <path d="M28 8H19.3337L15.8663 5.4C15.5196 5.14132 15.0988 5.00107 14.6663 5H9C8.46957 5 7.96086 5.21071 7.58579 5.58579C7.21071 5.96086 7 6.46957 7 7V9H5C4.46957 9 3.96086 9.21071 3.58579 9.58579C3.21071 9.96086 3 10.4696 3 11V25C3 25.5304 3.21071 26.0391 3.58579 26.4142C3.96086 26.7893 4.46957 27 5 27H24.1112C24.612 26.9993 25.092 26.8001 25.4461 26.4461C25.8001 26.092 25.9993 25.612 26 25.1112V23H28.1112C28.612 22.9993 29.092 22.8001 29.4461 22.4461C29.8001 22.092 29.9993 21.612 30 21.1112V10C30 9.46957 29.7893 8.96086 29.4142 8.58579C29.0391 8.21071 28.5304 8 28 8ZM24 25H5V11H10.6663L14.4 13.8C14.5731 13.9298 14.7836 14 15 14H24V25ZM28 21H26V14C26 13.4696 25.7893 12.9609 25.4142 12.5858C25.0391 12.2107 24.5304 12 24 12H15.3337L11.8663 9.4C11.5196 9.14132 11.0988 9.00107 10.6663 9H9V7H14.6663L18.4 9.8C18.5731 9.92982 18.7836 10 19 10H28V21Z" fill="#06B7DB"/>
</svg>
                  <p className="text-4xl text-base text-gray-500 font-light lg:text-3xl">
                    Curation of Data
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <Card 
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