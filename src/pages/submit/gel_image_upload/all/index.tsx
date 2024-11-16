import React, { useEffect, useState } from 'react';
import { AuthChecker } from '@/components/AuthChecker';
import NavBar from '@/components/NavBar';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { useRouter } from 'next/router';
import s3 from '../../../../../s3config';
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner } from "@nextui-org/react";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useUser } from '@/components/UserProvider';
import Toast from '@/components/Toast';
import ConfirmationModal from '@/components/ConfirmationModal';

interface GelImage {
  key: string;
  url: string;
  filename: string;
  institution: string;
  userName: string;
  fileDate: string;
}

const ViewAllGelImages: React.FC = () => {
  const router = useRouter();
  const [gelImages, setGelImages] = useState<GelImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageData, setSelectedImageData] = useState<GelImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'top' | 'bottom' | null>(null);
  const { user } = useUser();
  const [sortDescriptor, setSortDescriptor] = useState<{
    column: string;
    direction: "ascending" | "descending";
  }>({
    column: "fileDate",
    direction: "descending",
  });
  const [toastConfig, setToastConfig] = useState<{
    show: boolean;
    title: string;
    message?: string;
    type?: 'success' | 'error' | 'info' | 'warning';
  }>({
    show: false,
    title: '',
  });
  const [confirmationModal, setConfirmationModal] = useState<{
    show: boolean;
    imageKey: string | null;
  }>({
    show: false,
    imageKey: null
  });

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' | 'warning' = 'error') => {
    setToastConfig({
      show: true,
      title,
      message,
      type,
    });
  };

  useEffect(() => {
    const fetchGelImages = async () => {
      setIsLoading(true);
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
                  
                  // Get the formatted filename from the parent folder
                  const pathParts = file.Key.split('/');
                  const formattedFilename = pathParts[pathParts.length - 2];
                  
                  // Parse the formatted filename which should be in format: institution-username-date.extension
                  const [institution, userName, ...dateParts] = formattedFilename.split('-');
                  const fileDate = dateParts.join('-').split('.')[0]; // Join any remaining parts and remove extension
                  
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
                  return {
                    key: file.Key,
                    url: `https://${params.Bucket}.s3.amazonaws.com/${file.Key}`,
                    filename: 'Unknown',
                    institution: 'Unknown',
                    userName: 'Unknown',
                    fileDate: 'Unknown'
                  };
                }
              })
          );
          // Sort the images by date in descending order before setting state
          const sortedImages = imagesWithMetadata.sort((a, b) => 
            new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime()
          );
          setGelImages(sortedImages);
        }
      } catch (err) {
        console.error('Error fetching gel images:', err);
        showToast('Failed to fetch gel images', 'Please try again later');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGelImages();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToBottom(window.scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPosition = (position: 'top' | 'bottom') => {
    setIsScrolling(true);
    setScrollDirection(position);
    
    if (position === 'top') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      const tableElement = document.getElementById('gel-images-table');
      if (tableElement) {
        const tableBottom = tableElement.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;
        const scrollTarget = window.scrollY + tableBottom - windowHeight + 100;
        
        window.scrollTo({
          top: scrollTarget,
          behavior: 'smooth'
        });
      }
    }

    setTimeout(() => {
      setIsScrolling(false);
      setScrollDirection(null);
    }, 1000);
  };

  const handlePrevImage = () => {
    if (!selectedImageData) return;
    const currentIndex = gelImages.findIndex(img => img.key === selectedImageData.key);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : gelImages.length - 1;
    setSelectedImageData(gelImages[prevIndex]);
  };

  const handleNextImage = () => {
    if (!selectedImageData) return;
    const currentIndex = gelImages.findIndex(img => img.key === selectedImageData.key);
    const nextIndex = currentIndex < gelImages.length - 1 ? currentIndex + 1 : 0;
    setSelectedImageData(gelImages[nextIndex]);
  };

  const handleDeleteImage = async (imageKey: string) => {
    setConfirmationModal({
      show: true,
      imageKey
    });
  };

  const handleConfirmDelete = async () => {
    const imageKey = confirmationModal.imageKey;
    if (!imageKey) return;

    try {
      const params = {
        Bucket: 'd2dcurebucket',
        Key: imageKey
      };

      await s3.deleteObject(params).promise();
      
      setGelImages(prevImages => prevImages.filter(img => img.key !== imageKey));
      
      if (selectedImageData?.key === imageKey) {
        setSelectedImageData(null);
      }

      showToast('Image deleted successfully', undefined, 'success');
    } catch (err) {
      console.error('Error deleting image:', err);
      showToast('Failed to delete image', 'Please try again later');
    } finally {
      setConfirmationModal({ show: false, imageKey: null });
    }
  };

  const sortedItems = React.useMemo(() => {
    let sortedData = [...gelImages];
    
    const getValue = (item: GelImage, column: string) => {
      switch (column) {
        case "preview":
          return item.url;
        case "institution":
          return item.institution;
        case "userName":
          return item.userName;
        case "fileDate":
          return item.fileDate;
        default:
          return "";
      }
    };

    if (sortDescriptor.column) {
      sortedData.sort((a, b) => {
        const first = getValue(a, sortDescriptor.column);
        const second = getValue(b, sortDescriptor.column);
        const cmp = first.localeCompare(second);

        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      });
    }

    return sortedData;
  }, [gelImages, sortDescriptor]);

  return (
    <>
      <NavBar />
      <AuthChecker minimumStatus="student">
        <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs className="mb-2">
              <BreadcrumbItem href="/">Home</BreadcrumbItem>
              <BreadcrumbItem href="/submit">Data Analysis & Submission</BreadcrumbItem>
              <BreadcrumbItem href="/submit/gel_image_upload">Gel Images</BreadcrumbItem>
              <BreadcrumbItem href="/submit/gel_image_upload/all">View All Gel Images</BreadcrumbItem>
            </Breadcrumbs>

            <div className="pt-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl md:text-2xl lg:text-4xl font-inter dark:text-white">
                  All Gel Images
                </h1>
                <Button
                  className="bg-[#06B7DB] text-white"
                  onClick={() => router.push('/submit/gel_image_upload')}
                >
                  Upload New Image
                </Button>
              </div>

              <Toast
                show={toastConfig.show}
                onClose={() => setToastConfig(prev => ({ ...prev, show: false }))}
                title={toastConfig.title}
                message={toastConfig.message}
                type={toastConfig.type}
              />

              <Table 
                aria-label="Gel images table" 
                id="gel-images-table"
                sortDescriptor={sortDescriptor}
                onSortChange={(descriptor) => {
                  setSortDescriptor(descriptor as { column: string; direction: "ascending" | "descending" });
                }}
              >
                <TableHeader>
                  <TableColumn key="preview">PREVIEW</TableColumn>
                  <TableColumn key="institution">INSTITUTION</TableColumn>
                  <TableColumn key="userName">UPLOADED BY</TableColumn>
                  <TableColumn allowsSorting key="fileDate">DATE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((image, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <img
                          src={image.url}
                          alt={`Gel Image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell>{image.institution}</TableCell>
                      <TableCell>{image.userName}</TableCell>
                      <TableCell>{image.fileDate}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            variant="light"
                            onClick={() => {
                              setSelectedImageData(image);
                            }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Button>
                          {user?.user_name === image.userName && (
                            <Button
                              isIconOnly
                              variant="light"
                              color="danger"
                              onClick={() => handleDeleteImage(image.key)}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {isLoading && (
                <div className="flex justify-center items-center py-8">
                  <Spinner 
                    size="lg"
                    classNames={{
                      circle1: "border-b-[#06B7DB]",
                      circle2: "border-b-[#06B7DB]"
                    }}
                  />
                </div>
              )}

              {gelImages.length === 0 && !error && !isLoading && (
                <div className="text-center text-gray-500 py-8">
                  No gel images found.
                </div>
              )}

              {selectedImageData && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedImageData(null)}
                >
                  <div 
                    className="bg-white rounded-lg flex max-w-6xl w-full max-h-[90vh] overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Navigation Buttons */}
                    <button
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <button
                      className="absolute right-[400px] top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Left side - Image */}
                    <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
                      <img
                        src={selectedImageData.url}
                        alt="Gel Image Preview"
                        className="max-w-full max-h-[80vh] object-contain"
                      />
                    </div>

                    {/* Right side - Info Card */}
                    <div className="w-96 p-6 border-l border-gray-200">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-semibold">Image Details</h3>
                        <button
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => setSelectedImageData(null)}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-500">Filename</label>
                          <p className="font-medium break-words">{selectedImageData.filename}</p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500">Institution</label>
                          <p className="font-medium">{selectedImageData.institution}</p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500">Uploaded By</label>
                          <p className="font-medium">{selectedImageData.userName}</p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500">Date</label>
                          <p className="font-medium">{selectedImageData.fileDate}</p>
                        </div>

                        <div className="pt-4 space-y-2">
                          <a
                            href={selectedImageData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-[#06B7DB] text-white py-2 px-4 rounded-lg hover:bg-[#05a5c6] transition-colors"
                          >
                            Download Image
                          </a>
                          
                          {user?.user_name === selectedImageData.userName && (
                            <>
                              <div className="text-xs text-gray-500 px-1">
                                As the uploader, you can delete this image
                              </div>
                              <button
                                onClick={() => handleDeleteImage(selectedImageData.key)}
                                className="block w-full text-center text-red-500 hover:text-white py-2 px-4 rounded-lg transition-all border border-red-500 hover:border-red-600 hover:bg-red-500"
                              >
                                Delete Image
                              </button>
                            </>
                          )}
                        </div>

                        <div className="text-center text-sm text-gray-500 pt-4">
                          Image {gelImages.findIndex(img => img.key === selectedImageData.key) + 1} of {gelImages.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scroll notification */}
              {isScrolling && scrollDirection && (
                <div className="fixed top-4 right-4 bg-white/80 backdrop-blur-md border border-gray-200 
                  text-gray-600 px-3 py-1.5 rounded-lg shadow-sm z-50 animate-fade-in text-xs">
                  Scrolling to {scrollDirection}
                </div>
              )}

              {/* Scroll buttons */}
              {showScrollToBottom && (
                <button
                  onClick={() => scrollToPosition('bottom')}
                  className="fixed bottom-6 right-6 bg-white/80 backdrop-blur-md border border-gray-200 
                    text-[#06B7DB] hover:text-[#06B7DB]/80 hover:bg-white/90 
                    p-1.5 rounded-lg shadow-sm transition-all z-50 h-7 w-7 
                    flex items-center justify-center"
                    aria-label="Scroll to bottom"
                >
                  <FaArrowDown size={12} />
                </button>
              )}

              {!showScrollToBottom && (
                <button
                  onClick={() => scrollToPosition('top')}
                  className="fixed bottom-6 right-6 bg-white/80 backdrop-blur-md border border-gray-200 
                    text-[#06B7DB] hover:text-[#06B7DB]/80 hover:bg-white/90 
                    p-1.5 rounded-lg shadow-sm transition-all z-50 h-7 w-7 
                    flex items-center justify-center"
                    aria-label="Scroll to top"
                >
                  <FaArrowUp size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </AuthChecker>

      <ConfirmationModal
        isOpen={confirmationModal.show}
        onClose={() => setConfirmationModal({ show: false, imageKey: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Image"
        message="Are you sure you want to delete this image?"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

export default ViewAllGelImages; 