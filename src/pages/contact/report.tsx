import React, { useState } from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure, Select, SelectItem } from "@nextui-org/react";
import Link from 'next/link';
import { DatePicker } from "@nextui-org/date-picker";
import { Card, CardBody } from '@nextui-org/react';
import { DateValue, today } from '@internationalized/date';
import { FaBug, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const ReportBug = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    date: today('UTC') as DateValue,
    email: "",
    phone: "",
    comment: "",
    file: null as File | null,
    category: ""
  });

  const [preview, setPreview] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    type: ""
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

    if (!formData.fullName || !formData.email || !formData.comment || !formData.category) {
      setModalContent({
        title: "Required Fields Missing",
        message: "Please fill in all required fields to proceed.",
        type: "error"
      });
      onOpen();
      return;
    }

    setIsLoading(true);
    onOpen();
    setModalContent({
      title: "Processing Report",
      message: "Analyzing bug details...",
      type: "loading"
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
      formDataToSend.append('category', formData.category);

      const response = await fetch("/api/report-bug", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();
      
      if (response.ok) {
        setModalContent({
          title: "Report Submitted Successfully",
          message: "Thank you for your report. Our team will review it within 24-48 hours.",
          type: "success"
        });
        setFormData({
          fullName: "",
          date: today('UTC') as DateValue,
          email: "",
          phone: "",
          comment: "",
          file: null,
          category: ""
        });
        setPreview(null);
      } else {
        setModalContent({
          title: "Submission Error",
          message: `Unable to process request: ${result.message}`,
          type: "error"
        });
      }
    } catch (error) {
      setModalContent({
        title: "System Error",
        message: "An unexpected error occurred. Please try again later.",
        type: "error"
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
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem href="/contact">Contact Us</BreadcrumbItem>
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
                    <label className="block text-gray-700 dark:text-white mb-2">Date of Occurrence<span className="text-red-500">*</span></label>
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
                  <label className="block text-gray-700 dark:text-white mb-2">Category <span className="text-red-500">*</span></label>
                  <Select
                    name="category"
                    radius="sm"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Select a category"
                    isRequired
                    errorMessage={formData.category === "" && "Category is required"}
                  >
                    <SelectItem key="" value="">Select a category</SelectItem>
                    <SelectItem key="UI/Interface" value="ui">UI/Interface</SelectItem>
                    <SelectItem key="Functionality" value="functionality">Functionality</SelectItem>
                    <SelectItem key="Performance" value="performance">Performance</SelectItem>
                    <SelectItem key="Security" value="security">Security</SelectItem>
                    <SelectItem key="Other" value="other">Other</SelectItem>
                  </Select>
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-white mb-2">Bug Description <span className="text-red-500">*</span></label>
                  <Textarea
                    name="comment"
                    radius="sm"
                    placeholder="Describe the bug, what you were doing, and any error messages"
                    value={formData.comment}
                    isRequired
                    className="w-full"
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-white mb-2">Upload file</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 relative">
                      {preview ? (
                        <div className="relative w-full h-full">
                          <button
                            onClick={handleDeleteFile}
                            className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors duration-200"
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
                          <img 
                            src={preview} 
                            alt="Preview" 
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                          </svg>
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            SVG, PNG, JPG or GIF (Up to 50 MB)
                          </p>
                        </div>
                      )}
                      <Input
                        name="file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleChange}
                      />
                    </label>
                  </div>
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
      
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        backdrop="blur" 
        classNames={{
          base: "border border-gray-200 dark:border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            {modalContent.type === "success" && <FaCheckCircle className="text-green-500 text-xl" />}
            {modalContent.type === "error" && <FaExclamationTriangle className="text-red-500 text-xl" />}
            {modalContent.type === "loading" && <FaBug className="text-[#06B7DB] text-xl" />}
            {modalContent.title}
          </ModalHeader>
          <ModalBody className="py-6">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#06B7DB]" />
                <p>{modalContent.message}</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <p>{modalContent.message}</p>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ReportBug;
