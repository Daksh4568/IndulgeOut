const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'indulgeout-production';
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL || '';

/**
 * Upload a file buffer to S3
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - S3 folder/prefix
 * @param {string} originalname - Original filename
 * @param {string} mimetype - File MIME type
 * @returns {Promise<{url: string, key: string}>}
 */
const uploadToS3 = async (buffer, folder = 'uploads', originalname = 'file', mimetype = 'image/jpeg') => {
  const fileExtension = originalname.split('.').pop() || 'jpg';
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;
  const key = `${folder}/${uniqueName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  const url = CLOUDFRONT_URL
    ? `${CLOUDFRONT_URL}/${key}`
    : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${key}`;

  return { url, key };
};

/**
 * Delete a file from S3
 * @param {string} key - S3 object key
 */
const deleteFromS3 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(command);
};

/**
 * Get a pre-signed URL for private file access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiry in seconds (default 1 hour)
 * @returns {Promise<string>}
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
};

module.exports = {
  s3Client,
  BUCKET_NAME,
  CLOUDFRONT_URL,
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
};
