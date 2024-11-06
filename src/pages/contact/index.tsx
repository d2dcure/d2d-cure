import React, { useState } from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Button, Input, Textarea } from "@nextui-org/react";
import Link from 'next/link';
import { DatePicker } from "@nextui-org/date-picker";
import { Card, CardBody } from '@nextui-org/react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    date: "",
    email: "",
    phone: "",
    comment: "",
  });

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      alert("There was an error sending your message.");
    }
  };

  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <Breadcrumbs className="mb-4">
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbItem>Contact Us</BreadcrumbItem>
        </Breadcrumbs>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10 mb-20">
          <div className="mt-5 flex flex-col">
            <h1 className="text-5xl md:text-5xl lg:text-5xl font-inter dark:text-white">
              Contact Us
            </h1>
            <p className="mt-5 text-left text-gray-600 max-w-sm">
              Have a question? We would love to help! Fill out this form and we’ll get back to you as soon as possible.
            </p>
          </div>
          <Card className="bg-white dark:bg-gray-900 shadow-lg-top w-full max-w-4xl">
            <CardBody className="p-6 md:p-8">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-700 dark:text-white mb-2">Full Name <span className="text-red-500">*</span></label>
                    <Input name="fullName" type="text" radius="sm" placeholder="Your Full Name" required className="w-full" onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white mb-2">Date <span className="text-red-500">*</span></label>
                    <DatePicker 
                      name="date" 
                      radius="sm" 
                      className="w-full" 
                      onChange={(date) => setFormData({ ...formData, date: date?.toString() || '' })} 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white mb-2">Email <span className="text-red-500">*</span></label>
                    <Input name="email" type="email" radius="sm" placeholder="Your Email" required className="w-full" onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white mb-2">Phone Number</label>
                    <Input name="phone" radius="sm" type="tel" placeholder="Your Phone Number" className="w-full" onChange={handleChange} />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-white mb-2">Comment <span className="text-red-500">*</span></label>
                  <Textarea name="comment" radius="sm" placeholder="Your Message" required className="w-full" onChange={handleChange} />
                </div>
                <Button 
                  type="submit"
                  variant="solid" 
                  className="w-full bg-[#06B7DB] text-white font-semibold rounded-lg hover:bg-blue-600"
                >
                  Send Message
                </Button>
              </form>
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