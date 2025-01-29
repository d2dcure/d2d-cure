import React, { useEffect, useState } from 'react';
import { AuthChecker } from '@/components/AuthChecker';
import NavBar from '@/components/NavBar';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { useRouter } from 'next/router';
import s3 from '../../../../../s3config';
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Input, Pagination, Select, SelectItem } from "@nextui-org/react";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useUser } from '@/components/UserProvider';
import Toast from '@/components/Toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import Footer from '@/components/Footer';

interface GelImage {
  key: string;
  url: string;
  filename: string;
  institution: string;
  userName: string;
  fileDate: string;
  variant: string;
}

interface ViewAllGelImagesProps {
  embedded?: boolean;
}

const ViewAllGelImages: React.FC<ViewAllGelImagesProps> = ({ embedded = false }) => {
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
    filename?: string;
  }>({
    show: false,
    imageKey: null
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');

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
        if (data.Contents) {
          const processedImages = await Promise.all(
            data.Contents
              .filter((file): file is Required<typeof file> => 
                file.Key !== undefined && 
                !file.Key.endsWith('/')
              )
              .map(async (file) => {
                try {
                  const fullFilename = file.Key.replace('gel-images/', '');
                  const filename = fullFilename.split('.')[0];
                  const parts = filename.split('-');
                  
                  if (parts.length >= 6) {
                    const dateStartIndex = parts.length - 3;
                    const institution = parts.slice(0, parts.length - 5).join('-');
                    const variant = parts[parts.length - 5];
                    const userName = parts[parts.length - 4];
                    const date = parts.slice(dateStartIndex).join('-');
                    
                    const gelImage: GelImage = {
                      key: file.Key,
                      url: `https://${params.Bucket}.s3.amazonaws.com/${file.Key}`,
                      filename: fullFilename,
                      institution,
                      variant,
                      userName,
                      fileDate: date
                    };
                    return gelImage;
                  }
                  return null;
                } catch (err) {
                  console.error(`Error processing file ${file.Key}:`, err);
                  return null;
                }
              })
          );

          const validImages = processedImages.filter((img): img is GelImage => img !== null);
          setGelImages(validImages);
        }
      } catch (err) {
        console.error('Error fetching gel images:', err);
        setError('Failed to fetch gel images. Please try again later.');
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
    const image = gelImages.find(img => img.key === imageKey);
    setConfirmationModal({
      show: true,
      imageKey,
      filename: image?.filename || 'image'
    });
  };

  const handleConfirmDelete = async () => {
    const imageKey = confirmationModal.imageKey;
    const filename = confirmationModal.filename;
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

      showToast('Image Deleted', filename, 'success');
    } catch (err) {
      console.error('Error deleting image:', err);
      showToast('Error', `Failed to delete ${filename}. Please try again later`, 'error');
    } finally {
      setConfirmationModal({ show: false, imageKey: null, filename: '' });
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

        return sortDescriptor.direction === "ascending" ? -cmp : cmp;
      });
    }

    return sortedData;
  }, [gelImages, sortDescriptor]);

  const filteredAndPaginatedItems = React.useMemo(() => {
    const filtered = sortedItems.filter(item => 
      item.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const start = (page - 1) * rowsPerPage;
    const end = rowsPerPage === 0 ? filtered.length : start + rowsPerPage;

    return {
      items: filtered.slice(start, end),
      totalItems: filtered.length,
    };
  }, [sortedItems, page, rowsPerPage, searchTerm]);

  const handleTableUpdate = (newPage?: number) => {
    if (newPage) setPage(newPage);
    scrollToPosition('top');
  };

  return (
    <>
      {!embedded && <NavBar />}
      <AuthChecker minimumStatus="student">
        <div className={embedded ? "" : "px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white"}>
          <div className={embedded ? "" : "max-w-7xl mx-auto"}>
            {!embedded && (
              <Breadcrumbs className="mb-2">
                <BreadcrumbItem href="/">Home</BreadcrumbItem>
                <BreadcrumbItem href="/submit">Data Analysis & Submission</BreadcrumbItem>
                <BreadcrumbItem href="/submit/gel_image_upload">Gel Images</BreadcrumbItem>
                <BreadcrumbItem href="/submit/gel_image_upload/all">View All Gel Images</BreadcrumbItem>
              </Breadcrumbs>
            )}

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

              <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Input
                    isClearable
                    classNames={{
                      base: "w-full sm:w-[300px]",
                    }}
                    placeholder="Search by username..."
                    size="sm"
                    value={searchTerm}
                    onClear={() => setSearchTerm("")}
                    onValueChange={(value) => setSearchTerm(value)}
                    startContent={
                      <svg 
                        aria-hidden="true" 
                        fill="none" 
                        focusable="false" 
                        height="1em" 
                        stroke="currentColor" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        viewBox="0 0 24 24" 
                        width="1em"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" x2="16.65" y1="21" y2="16.65" />
                      </svg>
                    }
                  />
                </div>

                <div className="flex items-center justify-end sm:justify-start text-sm">
                  <span className="text-default-400">
                    Total {filteredAndPaginatedItems.totalItems} records
                  </span>
                </div>
              </div>

              <Table 
                aria-label="Gel images table" 
                id="gel-images-table"
                isHeaderSticky
                sortDescriptor={sortDescriptor}
                onSortChange={(descriptor) => {
                  setSortDescriptor(descriptor as { column: string; direction: "ascending" | "descending" });
                }}
                classNames={{
                  // wrapper: "max-h-[600px]",
                  // table: "min-h-[400px]",
                }}
              >
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableColumn key="number">#</TableColumn>
                  <TableColumn key="preview">PREVIEW</TableColumn>
                  <TableColumn key="institution">INSTITUTION</TableColumn>
                  <TableColumn key="userName">UPLOADED BY</TableColumn>
                  <TableColumn allowsSorting key="fileDate">DATE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredAndPaginatedItems.items.map((image, index) => (
                    <TableRow key={index}>
                      <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <img
                          loading="lazy"
                          src={image.url}
                          alt={`Gel Image ${index + 1}`}
                          className="w-16 h-16 object-cover rounded"
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

              <div className="py-4 px-2 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-2">
                <Pagination
                  showControls
                  classNames={{
                    cursor: "bg-foreground text-background",
                    wrapper: "justify-center gap-0 sm:gap-2",
                    item: "w-8 h-8 sm:w-10 sm:h-10",
                    next: "w-8 h-8 sm:w-10 sm:h-10",
                    prev: "w-8 h-8 sm:w-10 sm:h-10",
                  }}
                  color="default"
                  page={page}
                  total={rowsPerPage === 0 ? 1 : Math.ceil(filteredAndPaginatedItems.totalItems / rowsPerPage)}
                  variant="light"
                  onChange={handleTableUpdate}
                />

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-default-400 hidden sm:inline">Rows per page:</span>
                  <span className="text-default-400 sm:hidden">Per page:</span>
                  <Select
                    size="sm"
                    defaultSelectedKeys={["30"]}
                    className="w-20 sm:w-24"
                    onChange={(e) => {
                      const value = e.target.value;
                      setRowsPerPage(value === "all" ? 0 : Number(value));
                      setPage(1);
                      scrollToPosition('top');
                    }}
                  >
                    <SelectItem key="20" value="20">20</SelectItem>
                    <SelectItem key="30" value="30">30</SelectItem>
                    <SelectItem key="50" value="50">50</SelectItem>
                    <SelectItem key="all" value="all">All</SelectItem>
                  </Select>
                </div>
              </div>

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
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
                  onClick={() => setSelectedImageData(null)}
                >
                  <div 
                    className="bg-white rounded-xl flex flex-col lg:flex-row w-full max-w-[95vw] lg:max-w-6xl 
                      max-h-[95vh] overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Navigation Buttons - Hide on mobile */}
                    <button
                      className="hidden lg:block absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm 
                        rounded-full p-2.5 shadow-lg hover:bg-white transition-colors z-10 group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <button
                      className="hidden lg:block absolute right-[400px] top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm 
                        rounded-full p-2.5 shadow-lg hover:bg-white transition-colors z-10 group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Left side - Image */}
                    <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center p-4 relative min-h-[300px]">
                      <img
                        src={selectedImageData.url}
                        alt="Gel Image Preview"
                        className="max-w-full max-h-[40vh] lg:max-h-[80vh] object-contain rounded-lg shadow-md"
                      />
                      
                      {/* Mobile navigation buttons */}
                      <div className="flex lg:hidden items-center justify-between w-full absolute top-1/2 -translate-y-1/2 px-2">
                        <button
                          className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrevImage();
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNextImage();
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Image counter overlay */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white 
                        px-4 py-1.5 rounded-full text-sm font-medium tracking-wide">
                        Image {gelImages.findIndex(img => img.key === selectedImageData.key) + 1} of {gelImages.length}
                      </div>
                    </div>

                    {/* Right side - Info Card */}
                    <div className="w-full lg:w-[400px] p-4 sm:p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200 
                      overflow-y-auto max-h-[60vh] lg:max-h-[80vh]">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl lg:text-2xl font-semibold text-gray-800">Image Details</h3>
                          <p className="text-sm text-gray-500 mt-1">View and manage image information</p>
                        </div>
                        <button
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setSelectedImageData(null)}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                          <label className="text-sm font-medium text-gray-600">Filename</label>
                          <p className="font-medium break-words mt-1 text-gray-800">{selectedImageData.filename}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <label className="text-sm font-medium text-gray-600">Institution</label>
                            <p className="font-medium mt-1 text-gray-800">{selectedImageData.institution}</p>
                          </div>

                          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <label className="text-sm font-medium text-gray-600">Date</label>
                            <p className="font-medium mt-1 text-gray-800">{selectedImageData.fileDate}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                          <label className="text-sm font-medium text-gray-600">Uploaded By</label>
                          <p className="font-medium mt-1 text-gray-800">{selectedImageData.userName}</p>
                        </div>

                        <div className="pt-4 space-y-3">
                          <a
                            href={selectedImageData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-[#06B7DB] text-white py-2.5 px-4 
                              rounded-lg hover:bg-[#05a5c6] transition-colors font-medium"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Image
                          </a>
                          
                          {user?.user_name === selectedImageData.userName && (
                            <>
                              <button
                                onClick={() => handleDeleteImage(selectedImageData.key)}
                                className="flex items-center justify-center gap-2 w-full text-red-500 hover:text-white py-2.5 px-4 
                                  rounded-lg transition-all border border-red-500 hover:border-red-600 hover:bg-red-500 font-medium"
                              >
                                <TrashIcon className="h-5 w-5" />
                                Delete Image
                              </button>
                              <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                As the uploader, you can delete this image
                              </div>
                            </>
                          )}
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
      {!embedded && <Footer />}

      <ConfirmationModal
        isOpen={confirmationModal.show}
        onClose={() => setConfirmationModal({ show: false, imageKey: null, filename: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Image"
        message={`Are you sure you want to delete "${confirmationModal.filename}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="danger"
      />
    </>
  );
};

export default ViewAllGelImages; 