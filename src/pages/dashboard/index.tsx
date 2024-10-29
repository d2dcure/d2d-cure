import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Card, CardBody, Chip, Avatar, Tooltip, Input, Modal, ModalContent, ModalBody, Spinner } from "@nextui-org/react";
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { CardFooter } from "@nextui-org/react";
import { useUser } from '@/components/UserProvider';
import { useDisclosure } from "@nextui-org/react";
import LoadingSpinner from '@/components/LoadingSpinner';

const Dashboard = () => {
  const { user, loading } = useUser(); // Assume useUser now returns a loading state
  const [activeIndex, setActiveIndex] = useState(null);
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [characterizationData, setCharacterizationData] = useState([]);
  
  useEffect(() => {
    if (!loading && user) {
      fetchCharacterizationData(user.user_name);
    } else if (!loading && !user) {
      onOpen(); // Trigger the modal if the user isn't logged in.
    }
  }, [user, loading]);

  const fetchCharacterizationData = async (userName:any) => {
    try {
      const response = await fetch(`/api/getCharacterizationDataForUser?userName=${userName}`);
      const data = await response.json();
      setCharacterizationData(data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const toggleAccordion = (index:any) => {
    setActiveIndex(activeIndex === index ? null : index);
  };


  const renderStatus = (data:any) => {
    if (data.curated) return 'Curated';
    if (data.submitted_for_curation) return 'Submitted';
    return 'Not Submitted';
  };

  const renderVariant = (data:any) => `${data.resid}${data.resnum}${data.resmut}`;
  
  const faqs = [
    {
      question: "What is D2D Cure and how does it work?",
      answer: "D2D Cure is a research platform designed to predict enzyme function using large datasets and machine learning models. It helps researchers explore the intricate relationships between protein structure and function.",
    },
    {
      question: "How do I submit a new variant profile?",
      answer: "To submit a new variant profile, navigate to the 'Submit Data' section, fill in the required fields, and upload any relevant documentation. Once submitted, your profile will be reviewed by the D2D Cure team.",
    },
    {
      question: "What type of data can I upload to the platform?",
      answer: "You can upload enzyme variants, protein structures, gel images, and any other data that contributes to the understanding of enzyme functionality. Ensure that all submissions follow the D2D Cure data formatting guidelines.",
    },
    {
      question: "How do I analyze my gel images?",
      answer: "Once you upload your gel images through the 'SDS-PAGE Gel Image Upload' section, D2D Cure provides automated analysis tools to help you evaluate the images and associate them with specific variant profiles.",
    },
    {
      question: "How can I collaborate with other researchers on D2D Cure?",
      answer: "D2D Cure allows you to connect with other researchers by sharing your findings, collaborating on joint projects, or participating in community forums. Use the collaboration tools available in your dashboard.",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-grow flex rounded-full items-center justify-center">
          <LoadingSpinner isOpen={true} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <NavBar />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
          <h1 className="text-6xl font-bold text-[#06B7DB]">404</h1>
          <p className="text-2xl text-gray-600 mb-8">Oops! The page you are looking for doesn&apos;t exist.</p>
          <Link href="/login" passHref>
            <Button color="primary" className="bg-[#06B7DB]">
              Go to Login
            </Button>
          </Link>
        </div>
        <Footer />

        <Modal backdrop="blur" isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalBody className="py-12 text-center">
              <h1 className="text-4xl font-bold mb-4">Whoa there, enzyme explorer! 🧬</h1>
              <p className="text-xl mb-8">
                We can&apos;t let you into our top-secret enzyme research lab until you log in. 
                Your enzyme predictions will have to wait… for now! 🔐
              </p>
              <Link href="/login" passHref>
                <Button color="primary" className="bg-[#06B7DB]">
                  Go to Login
                </Button>
              </Link>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
        {/* Welcome Section */}
        <div className="flex items-center space-x-4 mb-16">
          {user?.user_name && (
            <>
              <div>
                <h1 className="text-4xl">Welcome, <span className="text-[#06B7DB]">{user?.user_name}</span>!</h1>
                <Chip className="bg-[#E6F1FE] mt-2 text-[#06B7DB]" variant="flat">{(user?.status)}</Chip>
              </div>
            </>
          )}
        </div>

        {/* Action Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {[
            {
              title: "Single Variant",
              link: "#",
              linkText: "Submit Data",
            },
            {
              title: "Wild Type",
              link: "#",
              linkText: "Submit Data",
            },
            {
              title: "SDS-PAGE Gel Image Upload",
              link: "#",
              linkText: "Upload Image",
            },
          ].map((item, index) => (
            <Card key={index} className="h-[150px] w-full">
              <CardBody className="text-3xl pt-2 font-light">
                <h3 className="pl-4 pt-2 pb-5 text-3xl  whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.title}
                </h3>
              </CardBody>
              <CardFooter>
                <Link href={item.link} className="text-sm px-4 pb-3 text-[#06B7DB]">
                  {item.linkText} {'>'}
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

    

        {/* Submissions Section */}
        <div className="mb-12">
          <h2 className="text-4xl mb-8">My Submissions</h2>

          {/* Variant Profiles Table */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-gray-500">Variant Profiles</h3>
              <Link href="/submit" passHref>
                <Button color="primary" className="bg-[#06B7DB]">
                  Submit New Data
                </Button>
              </Link>
            </div>
            <Table aria-label="Variant Profiles">
              <TableHeader>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>Enzyme</TableColumn>
                <TableColumn>Variant</TableColumn>
                <TableColumn>Comments</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {characterizationData.map((data: any, index: any) => {
                  const variant = renderVariant(data);
                  const viewUrl = 
                    variant === "XOX" 
                      ? `/submit/wild_type/${data.id}` 
                      : `/submit/single_variant/${data.id}`;

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip className="bg-[#E6F1FE] text-[#06B7DB]" variant="flat">
                          {renderStatus(data)}
                        </Chip>
                      </TableCell>
                      <TableCell>BglB</TableCell>
                      <TableCell>{variant}</TableCell>
                      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
                        {data.comments || 'No comments'}
                      </TableCell>
                      <TableCell>
                        <Link href={viewUrl} passHref>
                          <Button as="a" color="primary" className="bg-[#06B7DB]">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Gel Image Uploads Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-gray-500">Gel Image Uploads</h3>
              <Button color="primary" className="bg-[#06B7DB]">Upload New Image</Button>
            </div>
            <Table aria-label="Gel Image Uploads">
              <TableHeader>
                <TableColumn>Gel ID</TableColumn>
                <TableColumn>Upload Date</TableColumn>
                <TableColumn>Associated Profile</TableColumn>
                <TableColumn>Comments</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow key="1">
                  <TableCell><img src="/resources/images/gel_image.png" alt="Gel" style={{ width: '50px' }} /></TableCell>
                  <TableCell>04-13-2022</TableCell>
                  <TableCell>Q124W</TableCell>
                  <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
                    Need to be revised
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Chip className="bg-[#E6F1FE] mt-2 text-[#06B7DB]" variant="flat">FAQs</Chip> {/* Role Tag */}
          <h2 className="text-4xl text-gray-900 leading-[3.25rem]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`accordion py-6 px-6 border border-solid border-gray-200 rounded-2xl transition-all duration-500 ${
                activeIndex === index ? '' : ''
              }`}
            >
              <button
                className="accordion-toggle flex items-center justify-between leading-8 text-gray-900 w-full text-left font-medium"
                onClick={() => toggleAccordion(index)}
              >
                <h5 className="text-lg hover:text-[#06B7DB]">{faq.question}</h5>
                <svg
                  className={`transition-transform duration-500 ${
                    activeIndex === index ? 'rotate-180' : ''
                  }`}
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.5 8.25L12.4142 12.3358C11.7475 13.0025 11.4142 13.3358 11 13.3358C10.5858 13.3358 10.2525 13.0025 9.58579 12.3358L5.5 8.25"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </button>

              <div
                className={`accordion-content transition-all duration-500 overflow-hidden ${
                  activeIndex === index ? 'max-h-64' : 'max-h-0'
                }`}
              >
                <p className="text-base text-gray-600 leading-6 mt-4">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

      <Footer />
    </>
  );
};

export default Dashboard;
