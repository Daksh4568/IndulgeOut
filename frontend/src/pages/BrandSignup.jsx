import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config/api';

const BrandSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    brandName: '',
    brandCategory: '',
    contactPersonName: '',
    phoneNumber: '',
    workEmail: '',
    city: '',
    instagramLink: '',
    photo: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB
        setError('File size must be less than 50MB');
        return;
      }
      setFormData({
        ...formData,
        photo: file,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.brandName.trim()) {
      setError('Please enter brand name');
      return;
    }
    if (!formData.brandCategory.trim()) {
      setError('Please enter brand category');
      return;
    }
    if (!formData.contactPersonName.trim()) {
      setError('Please enter contact person name');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Please enter phone number');
      return;
    }
    if (!formData.workEmail.trim()) {
      setError('Please enter work email');
      return;
    }
    if (!formData.city.trim()) {
      setError('Please select city');
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.contactPersonName);
      formDataToSend.append('email', formData.workEmail);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('role', 'host_partner');
      formDataToSend.append('hostPartnerType', 'brand_sponsor');
      formDataToSend.append('brandName', formData.brandName);
      formDataToSend.append('brandCategory', formData.brandCategory);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('instagramLink', formData.instagramLink);
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      const response = await axios.post(`${API_URL}/auth/register-brand`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Store token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to organizer dashboard
      navigate('/organizer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Image with Opacity and Blur */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-20 blur-sm"
        style={{
          backgroundImage: 'url(/images/BackgroundLogin.jpg)',
          zIndex: 0,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Logo - Outside Card */}
        <div className="mb-6">
          <button onClick={() => navigate('/')} className="focus:outline-none">
            <img 
              src="/images/LogoOrbital.png" 
              alt="IndulgeOut" 
              className="h-20 w-auto object-contain" 
            />
          </button>
        </div>
        {/* Glass Morphism Card */}
        <div 
          className="rounded-3xl p-8 border w-full max-h-[80vh] overflow-y-auto"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >

          {/* Back Button */}
          <button
            onClick={() => navigate('/signup/b2b-type')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back to Business Type</span>
          </button>

          {/* Title */}
          <h1 
            className="text-3xl md:text-4xl font-bold text-white text-center mb-6"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            Tell Us About Your Brand
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Brand Name */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="brandName"
                value={formData.brandName}
                onChange={handleChange}
                placeholder="e.g. The Blue Note Jazz Club"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#7878E9' }}
              />
            </div>

            {/* Brand Category */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Brand Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="brandCategory"
                value={formData.brandCategory}
                onChange={handleChange}
                placeholder="e.g. Food & Beverage / Lifestyle etc"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#7878E9' }}
              />
            </div>

            {/* Contact Person Name */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Contact Person's Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleChange}
                placeholder="e.g. Maneet Gambhir"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#7878E9' }}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select 
                  className="px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#7878E9' }}
                >
                  <option value="+91">🇮🇳 +91</option>
                </select>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g. Enter ISD / STD / Mobile Number"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': '#7878E9' }}
                />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Work email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="workEmail"
                value={formData.workEmail}
                onChange={handleChange}
                placeholder="e.g. sample@xyz.abc"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#7878E9' }}
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#7878E9' }}
              >
                <option value="">Select city</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Pune">Pune</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Jaipur">Jaipur</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Instagram Link */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Instagram Link / social link <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="instagramLink"
                value={formData.instagramLink}
                onChange={handleChange}
                placeholder="e.g. https://www.instagram.com/your_brand"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#7878E9' }}
              />
            </div>

            {/* Upload Brand Logo and Product Photos */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Upload brand/logo and product photos <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="photo"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="photo"
                  className="flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-lg cursor-pointer transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7878E9'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                >
                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm">
                    {formData.photo ? formData.photo.name : 'Choose a file or drag & drop it here'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    JPEG, PNG, JPG, and MP4 formats, up to 50MB
                  </p>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-bold py-3.5 rounded-lg transition-all duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
            >
              {isLoading ? 'SUBMITTING...' : 'CONTINUE'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BrandSignup;
