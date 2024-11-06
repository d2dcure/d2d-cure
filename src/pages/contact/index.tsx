import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Button, Input, Textarea } from "@nextui-org/react";
import Link from 'next/link';
import { DatePicker } from "@nextui-org/date-picker";
import { Card, CardBody } from '@nextui-org/react';

const ContactUs = () => {
  return (
    <>
      <NavBar />
      {/* Breadcrumb Section */}
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <Breadcrumbs className="mb-4">
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbItem>Contact Us</BreadcrumbItem>
        </Breadcrumbs>

        {/* Grid Layout: Text Left, Form Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10 mb-20">
          {/* Left Section - Text */}
          <div className="mt-5 flex flex-col">
            <h1 className="text-5xl md:text-5xl lg:text-5xl font-inter dark:text-white">
              Contact Us
            </h1>
            <p className="mt-5 text-left text-gray-600 max-w-sm">
              Have a question? We would love to help! Fill out this form and we’ll get back to you as soon as possible.
            </p>
          </div>

          {/* Right Section - Contact Form */}
          <Card className="bg-white dark:bg-gray-900 shadow-lg-top w-full max-w-4xl">
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
                <Textarea radius="sm" placeholder="Your Message" required className="w-full" />
              </div>

              <Button 
                variant="solid" 
                className="w-full bg-[#06B7DB] text-white font-semibold rounded-lg hover:bg-blue-600"
                onPress={() => alert('Message Sent!')}
              >
                Send Message
              </Button>
              <div className="mt-4 text-right">
                <Link href="contact/report" className="text-[#06B7DB] hover:underline">
                  Need to report a bug?
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ContactUs;