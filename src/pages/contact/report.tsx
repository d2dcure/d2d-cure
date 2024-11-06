import React, { useState } from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@nextui-org/react";
import Link from 'next/link';
import { DatePicker } from "@nextui-org/date-picker";
import { Card, CardBody } from '@nextui-org/react';
import { DateValue, today } from '@internationalized/date';

const ReportBug = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    date: today('UTC') as DateValue,
    email: "",
    phone: "",
    comment: "",
    file: null as File | null
  });

  const [preview, setPreview] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: ""
  });

  const handleChange = (e: { target: { name: string; value: any; files?: FileList | null; }; }) => {
    if (e.target.name === 'file' && e.target.files) {
      const file = e.target.files[0];
      setFormData({ ...formData, file });
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.comment) {
      setModalContent({
        title: "Validation Error",
        message: "Please fill in all required fields."
      });
      onOpen();
      return;
    }

    setIsLoading(true);
    onOpen();
    setModalContent({
      title: "Sending your bug report",
      message: "Please hold on while we process your request..."
    });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('date', formData.date.toString());
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('comment', formData.comment);
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      const response = await fetch("/api/report-bug", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();
      
      if (response.ok) {
        setModalContent({
          title: "Bug Report Sent Successfully!",
          message: "Thank you for reporting this issue. Our team will investigate and respond within 24-48 business hours."
        });
        setFormData({
          fullName: "",
          date: today('UTC') as DateValue,
          email: "",
          phone: "",
          comment: "",
          file: null
        });
        setPreview(null);
      } else {
        setModalContent({
          title: "Error",
          message: `Error: ${result.message}`
        });
      }
    } catch (error) {
      setModalContent({
        title: "Error",
        message: "There was an error sending your bug report. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = () => {
    setFormData({ ...formData, file: null });
    setPreview(null);
  };

  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        <Breadcrumbs className="mb-4">
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbItem>Contact Us</BreadcrumbItem>
          <BreadcrumbItem>Report Bug</BreadcrumbItem>
        </Breadcrumbs>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10 mb-20">
          <div className="mt-5 flex flex-col">
            <h1 className="text-5xl md:text-5xl lg:text-5xl font-inter dark:text-white">
              Report a Bug
            </h1>
            <p className="mt-5 text-left text-gray-600 max-w-sm">
              Found a bug? Help us improve by reporting it. Please provide as much detail as possible to help us understand and fix the issue.
            </p>
          </div>
          <Card className="bg-white dark:bg-gray-900 shadow-lg-top w-full max-w-4xl">
            <CardBody className="p-6 md:p-8">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-700 dark:text-white mb-2">Full Name <span className="text-red-500">*</span></label>
                    <Input
                      name="fullName"
                      type="text"
                      radius="sm"
                      placeholder="Your Full Name"
                      value={formData.fullName}
                      isRequired
                      errorMessage={formData.fullName === "" && "Full name is required"}
                      className="w-full"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white mb-2">Date <span className="text-red-500">*</span></label>
                    <DatePicker 
                      name="date" 
                      radius="sm" 
                      isRequired
                      className="w-full" 
                      value={formData.date}
                      errorMessage={!formData.date && "Date is required"}
                      onChange={(date) => setFormData({ ...formData, date })} 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white mb-2">Email <span className="text-red-500">*</span></label>
                    <Input
                      name="email"
                      type="email"
                      radius="sm"
                      placeholder="Your Email"
                      value={formData.email}
                      isRequired
                      errorMessage={formData.email === "" && "Email is required"}
                      className="w-full"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white mb-2">Phone Number</label>
                    <Input
                      name="phone"
                      radius="sm"
                      type="tel"
                      placeholder="Your Phone Number"
                      value={formData.phone}
                      className="w-full"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-white mb-2">Bug Description <span className="text-red-500">*</span></label>
                  <Textarea
                    name="comment"
                    radius="sm"
                    placeholder="Please describe the bug in detail. Include what you were doing when it occurred and any error messages you saw."
                    value={formData.comment}
                    isRequired
                    className="w-full"
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-white mb-2">Attach Screenshot</label>
                  <Input
                    name="file"
                    type="file"
                    radius="sm"
                    accept="image/*"
                    className="w-full"
                    onChange={handleChange}
                  />
                  {preview && (
                    <div className="mt-4 relative">
                      <button
                        onClick={handleDeleteFile}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors duration-200"
                        aria-label="Delete attachment"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <img src={preview} alt="Preview" className="w-full h-auto rounded-lg shadow-md" />
                    </div>
                  )}
                </div>
                <Button 
                  type="submit"
                  variant="solid" 
                  className="w-full bg-[#06B7DB] text-white font-semibold rounded-lg"
                >
                  Submit Bug Report
                </Button>
              </form>
              <div className="mt-4 text-right">
                <Link href="/contact" className="text-[#06B7DB] hover:underline">
                  Back to Contact Form
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      <Footer />
      
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>{modalContent.title}</ModalHeader>
          <ModalBody className="py-6">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#06B7DB]" />
                <p>{modalContent.message}</p>
              </div>
            ) : (
              <p>{modalContent.message}</p>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ReportBug;
