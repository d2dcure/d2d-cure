import React, { useEffect, useState } from 'react';
import s3 from '../../../s3config';
import { useUser } from '@/components/UserProvider';

interface GelUploadedViewProps {
  entryData: any;
  setCurrentView: (view: string) => void;
}

const GelUploadedView: React.FC<GelUploadedViewProps> = ({
  entryData,
  setCurrentView,
}) => {
  const { user } = useUser();
  const [gelImages, setGelImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialImage, setInitialImage] = useState<string | null>(null);

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
          if (entryData.gel_filename) {
            const initial = data.Contents.find(
              (file:any) => file.Key.split('/').pop() === entryData.gel_filename
            );
            if (initial && initial.Key) {
              setInitialImage(`https://${params.Bucket}.s3.amazonaws.com/${initial.Key}`);
              setSelectedImage(initial.Key); // Preselect current image if it exists
            }
          }
        }
      } catch (err) {
        console.error('Error fetching gel images:', err);
        setError('Failed to fetch gel images.');
      }
    };

    fetchGelImages();
  }, [entryData.institution, entryData.gel_filename]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Ensure the file is either a PNG or JPG
    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      setError('Only PNG and JPG file types are allowed.');
      return;
    }

    // Construct the new filename
    const newFileName = `${user.institution}-${entryData.resid}${entryData.resnum}${entryData.resmut}-${user.user_name}.${file.type.split('/')[1]}`;
    const params = {
      Bucket: 'd2dcurebucket',
      Key: `gel-images/${newFileName}`,
      Body: file,
    };

    setUploading(true);
    try {
      await s3.upload(params).promise();
      console.log('File uploaded successfully:', newFileName);
      setUploadedFileName(newFileName); // Save the new filename for later use
      setSelectedImage(newFileName); // Set the newly uploaded file as the selected image
      setInitialImage(`https://d2dcurebucket.s3.amazonaws.com/gel-images/${newFileName}`); // Display newly uploaded image
      setUploading(false);
      setError(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('File upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const filenameToSave = selectedImage || uploadedFileName;

    if (!filenameToSave) {
      setError('Please select or upload an image before saving.');
      return;
    }

    try {
      const response = await fetch('/api/updateCharacterizationDataGelFilename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryData.id, gel_filename: filenameToSave.split('/').pop() }),
      });

      if (response.ok) {
        console.log('Gel filename updated successfully:', filenameToSave);
        setCurrentView('checklist');
      } else {
        console.error('Failed to update gel filename');
        setError('Failed to save the selected image.');
      }
    } catch (error) {
      console.error('Error saving gel filename:', error);
      setError('An error occurred while saving the selected image.');
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
          accept="image/png, image/jpeg"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full px-4 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        {uploading && <p>Uploading...</p>}
      </div>

      <div className="mt-4">
        <p><strong>Selected image:</strong> {selectedImage ? selectedImage.split('/').pop() : 'None'}</p>
        {initialImage && (
          <div className="mt-2">
            <img src={initialImage} alt="Selected Gel Image" className="w-48 h-48 object-cover border border-gray-300 rounded" />
          </div>
        )}
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
                  onChange={() => {
                    setSelectedImage(image.key);
                    setInitialImage(image.url);
                  }}
                  checked={selectedImage === image.key}
                  className="mr-2"
                />
                <label htmlFor={`gel-image-${index}`}>
                  <img
                    src={image.url}
                    alt={`Gel Image ${index}`}
                    className="max-w-full h-32 object-cover"
                  />
                  <p className="text-sm mt-1">{image.key.split('/').pop()}</p> {/* Display filename */}
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
          disabled={!selectedImage && !uploadedFileName}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default GelUploadedView;
