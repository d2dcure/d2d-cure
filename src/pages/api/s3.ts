// pages/api/s3.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import s3 from '../../../s3config';

const BUCKET_NAME = 'd2dcurebucketprod';

// If uploading very large files, you can increase the bodyParser size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function s3Handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const folder = (req.query.folder as string) || '';

    switch (req.method) {
      case 'GET': {
        // 1) If ?download=<filename>, we generate a presigned URL for that specific file
        const downloadFileName = req.query.download as string;
        if (downloadFileName) {
          const Key = folder ? `${folder}/${downloadFileName}` : downloadFileName;
          const url = await s3.getSignedUrlPromise('getObject', {
            Bucket: BUCKET_NAME,
            Key,
            Expires: 60 // URL valid for 60 seconds
          });
          return res.status(200).json({ presignedUrl: url, fileKey: Key });
        }

        // 2) Otherwise, we list all objects under the folder prefix
        const listParams = {
          Bucket: BUCKET_NAME,
          Prefix: folder // e.g. "gel-images/", "kinetic_assays/raw", etc.
        };
        const data = await s3.listObjectsV2(listParams).promise();
        return res.status(200).json({
          objects:
            data.Contents?.map((obj) => ({
              key: obj.Key,
              url: `https://${BUCKET_NAME}.s3.amazonaws.com/${obj.Key}`
            })) || []
        });
      }

      case 'POST': {
        // UPLOAD a new file as base64
        // we expect { newFileName, fileBase64 }
        const { newFileName, fileBase64 } = req.body;
        if (!newFileName || !fileBase64) {
          return res.status(400).json({ error: 'newFileName and fileBase64 are required' });
        }

        // Convert base64 to a Buffer
        const fileBuffer = Buffer.from(fileBase64, 'base64');
        // Construct the S3 key
        const Key = folder ? `${folder}/${newFileName}` : newFileName;

        const uploadParams = {
          Bucket: BUCKET_NAME,
          Key,
          Body: fileBuffer
          // ContentType: 'image/png' or 'text/csv', etc., if you know the type
        };

        await s3.upload(uploadParams).promise();
        const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${Key}`;
        return res.status(200).json({
          message: 'Upload success',
          objectKey: Key,
          url
        });
      }

      case 'DELETE': {
        // DELETE an object from S3
        // We'll expect { key } in the request body
        const { key } = req.body || {};
        if (!key) {
          return res.status(400).json({ error: 'Missing "key" in request body' });
        }

        const deleteParams = {
          Bucket: BUCKET_NAME,
          Key: key
        };

        await s3.deleteObject(deleteParams).promise();
        return res.status(200).json({
          message: 'Delete success',
          deletedKey: key
        });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('S3 API Error:', error);
    return res.status(500).json({
      error: error.message || 'Unexpected error'
    });
  }
}
