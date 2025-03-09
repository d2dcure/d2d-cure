// PUT ACCESS KEYS IN ENV! 

import AWS from 'aws-sdk';

// Load environment variables
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

AWS.config.update({
  region: 'us-east-1',
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey
});

const s3 = new AWS.S3();
export default s3;