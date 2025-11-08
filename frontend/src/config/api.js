// API configuration for different environments
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://indulge-out-git-main-daksh-pratap-singhs-projects-a6093574.vercel.app' : 'http://localhost:5000')
).replace(/\/$/, '');

export default API_BASE_URL;