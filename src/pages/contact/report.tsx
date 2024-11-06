import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Button, Input, Textarea } from "@nextui-org/react";
import Link from 'next/link';
import { DatePicker } from "@nextui-org/date-picker";
import { Card, CardBody } from '@nextui-org/react';

const ReportBug = () => {
  return (
    <>
      <NavBar />
      {/* Breadcrumb Section */}
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <Breadcrumbs className="mb-4">
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbItem>Contact Us</BreadcrumbItem>
          <BreadcrumbItem>Report a Bug</BreadcrumbItem>
        </Breadcrumbs>

        {/* Grid Layout: Text Left, Form Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10 mb-20">
          {/* Left Section - Text */}
          <div className="mt-5 flex flex-col">
            <h1 className="text-5xl md:text-5xl lg:text-5xl font-inter dark:text-white">
              Report a Bug
            </h1>
            <p className="mt-5 text-left text-gray-600 max-w-sm">
              Use this form to report any issues or bugs you encounter. Please be as detailed as possible.
            </p>
          </div>

          {/* Right Section - Bug Report Form */}
          <Card className="bg-white dark:bg-gray-900 shadow-lg-top w-full">
            <CardBody className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 dark:text-white mb-2">Full Name <span className="text-red-500">*</span></label>
                  <Input type="text" radius="sm" placeholder="Your Full Name" required className="w-full" />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-white mb-2">Date <span className="text-red-500">*</span></label>
                  <DatePicker radius="sm" className="w-full" />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-white mb-2">Email <span className="text-red-500">*</span></label>
                  <Input radius="sm" type="email" placeholder="Your Email" required className="w-full" />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-white mb-2">Phone Number</label>
                  <Input radius="sm" type="tel" placeholder="Your Phone Number" className="w-full" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 dark:text-white mb-2">Comment <span className="text-red-500">*</span></label>
                <Textarea radius="sm" placeholder="Describe the issue you're facing" required className="w-full" />
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-white mb-2">Upload File</label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" />
                  </label>
                </div>
              </div>

              <Button 
                variant="solid" 
                className="w-full bg-[#06B7DB] text-white font-semibold rounded-lg hover:bg-blue-600"
                onPress={() => alert('Bug report sent!')}
              >
                Send Message
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ReportBug;
