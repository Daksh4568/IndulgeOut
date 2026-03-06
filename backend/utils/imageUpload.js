const sharp = require('sharp');
const { uploadToS3 } = require('../config/s3');

/**
 * Upload image to S3 with Sharp optimization
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - S3 folder
 * @param {string} originalname - Original filename
 * @param {Object} options - Resize/quality options
 * @returns {Promise<{url: string, key: string}>}
 */
const uploadImageToS3 = async (buffer, folder = 'uploads', originalname = 'image.jpg', options = {}) => {
  const {
    width = 1920,
    height = 1080,
    quality = 85,
    fit = 'inside',
  } = options;

  const optimizedBuffer = await sharp(buffer)
    .resize(width, height, { fit, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  const optimizedName = originalname.replace(/\.[^.]+$/, '.jpg');
  return uploadToS3(optimizedBuffer, folder, optimizedName, 'image/jpeg');
};

/**
 * Upload profile picture to S3 with face-friendly crop
 * Replaces Cloudinary's gravity:face crop with a center crop via Sharp
 * @param {Buffer} buffer - Image buffer (can be raw buffer or base64 data URI)
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<{url: string, key: string}>}
 */
const uploadProfilePicture = async (buffer, userId) => {
  const optimizedBuffer = await sharp(buffer)
    .resize(400, 400, { fit: 'cover', position: 'attention' }) // 'attention' focuses on interesting region
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  return uploadToS3(optimizedBuffer, 'profile-pictures', `${userId}.jpg`, 'image/jpeg');
};

/**
 * Upload multiple images to S3
 * @param {Array<{buffer: Buffer, originalname: string}>} files - Array of file objects
 * @param {string} folder - S3 folder
 * @param {Object} options - Resize options
 * @returns {Promise<Array<{url: string, key: string}>>}
 */
const uploadMultipleImagesToS3 = async (files, folder = 'uploads', options = {}) => {
  return Promise.all(
    files.map(file => uploadImageToS3(file.buffer, folder, file.originalname, options))
  );
};

module.exports = {
  uploadImageToS3,
  uploadProfilePicture,
  uploadMultipleImagesToS3,
};
