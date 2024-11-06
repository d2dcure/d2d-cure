import React, { useState } from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@nextui-org/react";
import Link from 'next/link';
import { DatePicker } from "@nextui-org/date-picker";
import { Card, CardBody } from '@nextui-org/react';
import { DateValue, today } from '@internationalized/date';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    date: today('UTC') as DateValue,
    email: "",
    phone: "",
    comment: "",
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: ""
  });

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    const formDataToSend = {
      ...formData,
      date: formData.date.toString()
    };

    if (!formDataToSend.fullName || !formDataToSend.date || !formDataToSend.email || !formDataToSend.comment) {
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
      title: "Sending your message",
      message: "Please hold on while we process your request..."
    });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDataToSend),
      });

      const result = await response.json();
      if (response.ok) {
        setModalContent({
          title: "Message Sent Successfully!",
          message: "Thank you for contacting us. We'll get back to you within 24-48 business hours."
        });
        setFormData({ fullName: "", date: today('UTC') as DateValue, email: "", phone: "", comment: "" });
      } else {
        setModalContent({
          title: "Error",
          message: `Error: ${result.message}`
        });
      }
    } catch (error) {
      setModalContent({
        title: "Error",
        message: "There was an error sending your message. Please try again later."
      });
    } finally {
      setIsLoading(false);
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
                  <label className="block text-gray-700 dark:text-white mb-2">Comment <span className="text-red-500">*</span></label>
                  <Textarea
                    name="comment"
                    radius="sm"
                    placeholder="Your Message"
                    value={formData.comment}
                    isRequired
                    className="w-full"
                    onChange={handleChange}
                  />
                </div>
                <Button 
                  type="submit"
                  variant="solid" 
                  className="w-full bg-[#06B7DB] text-white font-semibold rounded-lg"
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

export default ContactUs;