/**
 * Transforms Cloudinary image URLs to automatically convert formats for browser compatibility
 * Adds f_auto (format auto) and q_auto (quality auto) transformations
 * This solves the HEIC format issue - browsers that don't support HEIC will get WebP/JPEG instead
 * 
 * @param {string} url - Original Cloudinary image URL
 * @returns {string} - Transformed URL with auto format and quality
 */
export const getOptimizedCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Check if it's a Cloudinary URL
  if (!url.includes('res.cloudinary.com')) return url;
  
  // Check if transformations are already applied
  if (url.includes('f_auto') || url.includes('q_auto')) return url;
  
  // Split the URL at /upload/ and insert transformations
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  
  const beforeUpload = url.substring(0, uploadIndex + 8); // includes '/upload/'
  const afterUpload = url.substring(uploadIndex + 8);
  
  // Add f_auto (format auto) and q_auto (quality auto) transformations
  // f_auto converts HEIC to WebP/JPEG based on browser support
  // q_auto optimizes image quality
  return `${beforeUpload}f_auto,q_auto/${afterUpload}`;
};

/**
 * Transforms an array of Cloudinary URLs
 * 
 * @param {string[]} urls - Array of Cloudinary image URLs
 * @returns {string[]} - Array of transformed URLs
 */
export const getOptimizedCloudinaryUrls = (urls) => {
  if (!Array.isArray(urls)) return urls;
  return urls.map(url => getOptimizedCloudinaryUrl(url));
};
