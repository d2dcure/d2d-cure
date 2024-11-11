import React, { useEffect, useState } from 'react';
import { AuthChecker } from '@/components/AuthChecker';
import NavBar from '@/components/NavBar';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { useRouter } from 'next/router';
import s3 from '../../../../../s3config';
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { EyeIcon } from "@heroicons/react/24/outline";

const ViewAllGelImages: React.FC = () => {
  const router = useRouter();
  const [gelImages, setGelImages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchGelImages = async () => {
      const params = {
        Bucket: 'd2dcurebucket',
        Prefix: 'gel-images/',
      };
      try {
        const data = await s3.listObjectsV2(params).promise();
        if (data && data.Contents) {
          setGelImages(
            data.Contents.filter((file): file is Required<typeof file> => file.Key !== undefined)
              .map((file) => ({
                key: file.Key,
                url: `https://${params.Bucket}.s3.amazonaws.com/${file.Key}`,
                filename: file.Key.split('/').pop() ?? ''
              }))
          );
        }
      } catch (err) {
        console.error('Error fetching gel images:', err);
        setError('Failed to fetch gel images.');
      }
    };

    fetchGelImages();
  }, []);

  return (
    <>
      <NavBar />
      <AuthChecker minimumStatus="student">
        <div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs className="mb-2">
              <BreadcrumbItem>Home</BreadcrumbItem>
              <BreadcrumbItem>Database</BreadcrumbItem>
              <BreadcrumbItem>View All Gel Images</BreadcrumbItem>
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

              {error && (
                <div className="text-red-500 mb-4">
                  {error}
                </div>
              )}

              <Table aria-label="Gel images table">
                <TableHeader>
                  <TableColumn>PREVIEW</TableColumn>
                  <TableColumn>FILENAME</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {gelImages.map((image, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <img
                          src={image.url}
                          alt={`Gel Image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell>{image.filename}</TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          variant="light"
                          onClick={() => {
                            setSelectedImage(image.url);
                          }}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {gelImages.length === 0 && !error && (
                <div className="text-center text-gray-500 py-8">
                  No gel images found.
                </div>
              )}

              {selectedImage && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedImage(null)}
                >
                  <div className="relative max-w-[90vw] max-h-[90vh]">
                    <img
                      src={selectedImage}
                      alt="Gel Image Preview"
                      className="max-w-full max-h-[90vh] object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      className="absolute top-2 right-2 bg-white rounded-full p-2"
                      onClick={() => setSelectedImage(null)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AuthChecker>
    </>
  );
};

export default ViewAllGelImages; 