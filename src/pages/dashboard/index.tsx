import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Card, CardBody, Chip, Avatar, Tooltip, Input, Modal, ModalContent, ModalBody, Spinner, Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { CardFooter } from "@nextui-org/react";
import { useUser } from '@/components/UserProvider';
import { useDisclosure } from "@nextui-org/react";
import { AuthChecker } from '@/components/AuthChecker';
import { RiSparklingFill } from "react-icons/ri";
import StatusChip from '@/components/StatusChip';
import { ErrorChecker } from '@/components/ErrorChecker';
import s3 from '../../../s3config';

interface CharacterizationData {
  curated: boolean;
  submitted_for_curation: boolean;
  id: string;
  comments?: string;
  resid?: string;
  resnum?: string;
  resmut?: string;
}

interface GelImage {
  key: string;
  url: string;
  filename: string;
  institution: string;
  userName: string;
  fileDate: string;
}

const Dashboard = () => {
  const { user, loading: userLoading } = useUser();
  const [activeIndex, setActiveIndex] = useState(null);
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [characterizationData, setCharacterizationData] = useState<CharacterizationData[]>([]);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gelImages, setGelImages] = useState<GelImage[]>([]);

  useEffect(() => {
    if (userLoading) return;
    
    if (!user) {
      onOpen();
      return;
    }

    if (user.user_name) {
      fetchCharacterizationData(user.user_name);
      fetchGelImages();
    }
  }, [user, userLoading]);

  const fetchCharacterizationData = async (userName: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/getCharacterizationDataForUser?userName=${userName}`);
      
      if (!response.ok) {
        throw new Error(`GET /api/getCharacterizationDataForUser ${response.status} - Failed to fetch characterization data`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('GET /api/getCharacterizationDataForUser - Invalid data format: Expected array');
      }

      setCharacterizationData(data);
    } catch (error) {
      console.error('Error fetching characterization data:', error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch characterization data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGelImages = async () => {
    const params = {
      Bucket: 'd2dcurebucket',
      Prefix: 'gel-images/',
    };
    try {
      const data = await s3.listObjectsV2(params).promise();
      if (data && data.Contents) {
        const imagesWithMetadata = await Promise.all(
          data.Contents
            .filter((file): file is Required<typeof file> => 
              file.Key !== undefined && 
              !file.Key.endsWith('/') // Skip folder entries
            )
            .map(async (file) => {
              try {
                const metadata = await s3.headObject({
                  Bucket: params.Bucket,
                  Key: file.Key
                }).promise();
                
                const pathParts = file.Key.split('/');
                const formattedFilename = pathParts[pathParts.length - 2];
                
                const [institution, userName, ...dateParts] = formattedFilename.split('-');
                const fileDate = dateParts.join('-').split('.')[0];
                
                return {
                  key: file.Key,
                  url: `https://${params.Bucket}.s3.amazonaws.com/${file.Key}`,
                  filename: formattedFilename,
                  institution: institution || 'Unknown',
                  userName: userName || 'Unknown',
                  fileDate: fileDate || 'Unknown'
                };
              } catch (err) {
                console.error(`Error fetching metadata for ${file.Key}:`, err);
                return null;
              }
            })
        );

        // Filter out null values and user's images only
        const userImages = imagesWithMetadata
          .filter((img): img is GelImage => 
            img !== null && img.userName === user?.user_name
          )
          .sort((a, b) => new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime());

        setGelImages(userImages);
      }
    } catch (err) {
      console.error('Error fetching gel images:', err);
    }
  };

  const toggleAccordion = (index:any) => {
    setActiveIndex(activeIndex === index ? null : index);
  };


  const renderStatus = (data:any) => {
    const statusConfig = {
      Curated: {
        color: "success",
        bgColor: "bg-success-50",
        textColor: "text-success-600",
      },
      Submitted: {
        color: "warning",
        bgColor: "bg-warning-50",
        textColor: "text-warning-600",
      },
      "Not Submitted": {
        color: "danger",
        bgColor: "bg-danger-50",
        textColor: "text-danger-600",
      }
    };

    const status = data.curated ? 'Curated' : data.submitted_for_curation ? 'Submitted' : 'Not Submitted';
    const config = statusConfig[status];

    return (
      <Chip
        className={`${config.bgColor} ${config.textColor}`}
        variant="flat"
        size="sm"
      >
        {status}
      </Chip>
    );
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

  const ResearchInsight = () => {
    const curatedCount = characterizationData.filter(d => d.curated).length;
    const reviewCount = characterizationData.filter(d => !d.curated && d.submitted_for_curation).length;
    const readyCount = characterizationData.filter(d => !d.submitted_for_curation).length;

    let message ="";
    
    if (characterizationData.length === 0) {
      message += "No variants have been submitted. Would you like to begin your research submission?";
    } else {
      message += `You have successfully contributed ${characterizationData.length} variants to the research database. `;
      
      if (curatedCount > 0) {
        message += `\n\n✅ ${curatedCount} submissions have completed the curation process`;
      }
      if (reviewCount > 0) {
        message += `\n\n🔍 ${reviewCount} submissions are pending review`;
      }
      if (readyCount > 0) {
        message += `\n\n💡 ${readyCount} variants are prepared for submission`;
      }
    }

    return (
      <div className="text-gray-600 leading-relaxed whitespace-pre-line">
        {message}
      </div>
    );
  };

  return (
    <>
      <NavBar />
      <AuthChecker minimumStatus="student">
        <ErrorChecker 
          isError={isError} 
          errorMessage={errorMessage}
          errorType="api"
        >
          {userLoading || isLoading ? (
            <div className="flex justify-center items-center min-h-screen">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
              {/* Welcome Section */}
              <div className="flex items-center space-x-4 mb-16">
                {user?.user_name && (
                  <>
                    <div>
                      <Chip className="bg-[#E6F1FE] mb-2 text-[#06B7DB]" variant="flat">{(user?.status)}</Chip>
                      <div className="flex items-center gap-2">
                        <h1 className="text-4xl">Welcome, <span className="text-[#06B7DB]">{user?.user_name}</span>!</h1>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Cards Section */}
              <div className={`grid gap-6 mb-20 ${user?.status === 'ADMIN' || user?.status === 'PROFESSOR' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {[
                  {
                    title: "Single Variant",
                    link: "/submit",
                    linkText: "Submit Data",
                  },
                  {
                    title: "Wild Type",
                    link: "/submit",
                    linkText: "Submit Data",
                  },
                  {
                    title: "Gel Image",
                    link: "/submit/gel_image_upload",
                    linkText: "Upload Image",
                  },
                  ...(user?.status === 'ADMIN' || user?.status === 'PROFESSOR' ? [{
                    title: "Curate",
                    link: "/curate",
                    linkText: "Curate Data",
                  }] : [])
                ].map((item, index) => (
                  <Card 
                    key={index} 
                    className="h-[150px] w-full transition-transform duration-200 hover:scale-105"
                  >
                    <CardBody className="text-3xl pt-2 font-light">
                      <h3 className="pl-4 pt-2 pb-5 text-3xl whitespace-nowrap overflow-hidden text-ellipsis">
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
                  <Table 
                    aria-label="Variant Profiles"
                    classNames={{
                      base: "max-h-[400px]", // Fixed height
                      table: "min-h-[100px]",
                      wrapper: "max-h-[400px]" // Makes table scrollable
                    }}
                  >
                    <TableHeader>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>Enzyme</TableColumn>
                      <TableColumn>Variant</TableColumn>
                      <TableColumn>ID</TableColumn>
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
                              <StatusChip 
                                status={
                                  data.curated 
                                    ? 'approved'
                                    : data.submitted_for_curation 
                                      ? 'pending_approval'
                                      : 'in_progress'
                                } 
                              />
                            </TableCell>
                            <TableCell>BglB</TableCell>
                            <TableCell>{variant}</TableCell>
                            <TableCell>{data.id}</TableCell> 
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
                              {data.comments || 'No comments'}
                            </TableCell>
                            <TableCell>
                              <Link href={viewUrl} className="text-[#06B7DB]">
                                View
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
                    <Link href="/submit/gel_image_upload" passHref>
                      <Button color="primary" className="bg-[#06B7DB]">Upload New Image</Button>
                    </Link>
                  </div>
                  <Table 
                    aria-label="Gel Image Uploads"
                    classNames={{
                      base: "max-h-[400px]",
                      table: "min-h-[100px]",
                      wrapper: "max-h-[400px]"
                    }}
                  >
                    <TableHeader>
                      <TableColumn>PREVIEW</TableColumn>
                      <TableColumn>DATE</TableColumn>
                      <TableColumn>FILENAME</TableColumn>
                      <TableColumn>INSTITUTION</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {(isLoading || gelImages.length === 0) ? (
                        <TableRow>
                          <TableCell>
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        gelImages.map((image, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <img
                                src={image.url}
                                alt={`Gel Image ${index + 1}`}
                                className="w-16 h-16 object-cover rounded"
                              />
                            </TableCell>
                            <TableCell>{image.fileDate}</TableCell>
                            <TableCell>{image.filename}</TableCell>
                            <TableCell>{image.institution}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </ErrorChecker>
      </AuthChecker>
      <Footer />
      {/* Floating star icon with insights */}
      <Popover placement="top-end">
        <PopoverTrigger>
          <div className="fixed bottom-6 right-6 z-50 cursor-pointer">
            <div className="bg-white/30 backdrop-blur-md rounded-full p-2 shadow-lg border border-white/50 hover:bg-white/40 transition-all duration-200">
              <RiSparklingFill className="text-gray-600 text-xl" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="max-w-[300px]">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <RiSparklingFill className="text-gray-600" />
              <h4 className="text-sm font-medium text-gray-700">Quick Insights</h4>
            </div>
            <div className="text-sm text-gray-600">
              You have successfully contributed {characterizationData.length} variants to the research database.
              
              {characterizationData.filter(d => d.curated).length > 0 && (
                <div className="mt-2">
                  ✓ {characterizationData.filter(d => d.curated).length} submissions have completed the curation process
                </div>
              )}
              
              {characterizationData.filter(d => !d.curated && d.submitted_for_curation).length > 0 && (
                <div className="mt-2">
                  🔍 {characterizationData.filter(d => !d.curated && d.submitted_for_curation).length} submissions are pending review
                </div>
              )}
              
              {characterizationData.filter(d => !d.submitted_for_curation).length > 0 && (
                <div className="mt-2">
                  💡 {characterizationData.filter(d => !d.submitted_for_curation).length} variants are prepared for submission
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default Dashboard;
