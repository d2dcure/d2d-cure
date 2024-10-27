// components/single_variant_submission/GelUploadedView.tsx

import React, { useEffect, useState } from 'react';
import s3 from '../../../s3config'; 

interface GelUploadedViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
}

const GelUploadedView: React.FC<GelUploadedViewProps> = ({
  entryData,
  setCurrentView,
}) => {
  const [gelImages, setGelImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch gel images from S3
  useEffect(() => {
    const fetchGelImages = async () => {
      const params = {
        Bucket: 'd2dcurebucket',
        Prefix: `gel-images/${entryData.institution}`,
      };
      try {
        const data = await s3.listObjectsV2(params).promise();
        if (data && data.Contents) {
          setGelImages(
            data.Contents.map((file) => ({
              key: file.Key,
              url: `https://${params.Bucket}.s3.amazonaws.com/${file.Key}`,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching gel images:', err);
        setError('Failed to fetch gel images.');
      }
    };

    fetchGelImages();
  }, [entryData.institution]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const params = {
      Bucket: 'd2dcurebucket',
      Key: `gel-images/${entryData.institution}/${file.name}`,
      Body: file,
    };

    setUploading(true);
    try {
      await s3.upload(params).promise();
      console.log('File uploaded successfully:', file.name);
      setUploading(false);
      setError(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('File upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (selectedImage) {
      console.log('Selected gel image:', selectedImage);
      // Handle saving logic if needed
      setCurrentView('checklist');
    } else {
      setError('Please select a gel image.');
    }
  };

  return (
    <div className="space-y-4">
      <button
        className="text-blue-500 hover:text-blue-700"
        onClick={() => setCurrentView('checklist')}
      >
        &lt; Back to Checklist
      </button>

      <h2 className="text-2xl font-bold">Gel Uploaded?</h2>

      {error && <div className="text-red-500">{error}</div>}

      <div className="mt-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full px-4 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        {uploading && <p>Uploading...</p>}
      </div>

      {gelImages.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Select a Previous Gel Image</h3>
          <div className="grid grid-cols-2 gap-4">
            {gelImages.map((image, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`gel-image-${index}`}
                  name="gel-image"
                  value={image.key}
                  onChange={() => setSelectedImage(image.key)}
                  checked={selectedImage === image.key}
                  className="mr-2"
                />
                <label htmlFor={`gel-image-${index}`}>
                  <img
                    src={image.url}
                    alt={`Gel Image ${index}`}
                    className="max-w-full h-32 object-cover"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex space-x-4">
        <button
          className="px-6 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600"
          onClick={handleSave}
          disabled={!selectedImage}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default GelUploadedView;
