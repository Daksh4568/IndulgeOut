import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config/api';

const HostSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    communityName: '',
    category: '',
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
    if (!formData.communityName.trim()) {
      setError('Please enter community name');
      return;
    }
    if (!formData.category.trim()) {
      setError('Please select category');
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
      formDataToSend.append('hostPartnerType', 'community_organizer');
      formDataToSend.append('communityName', formData.communityName);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('instagramLink', formData.instagramLink);
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      const response = await axios.post(`${API_URL}/auth/register-host`, formDataToSend, {
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
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Top Section - Pure Black */}
      <div className="w-full bg-black relative z-10">
        {/* Logo */}
        <div className="flex justify-center pt-6 pb-4">
          <img 
            src="/images/LogoFinal2.jpg" 
            alt="IndulgeOut" 
            className="h-12 w-auto object-contain" 
          />
        </div>
      </div>

      {/* Bottom Section - With Mirror Background */}
      <div className="flex-1 relative flex items-center justify-center py-8">
        {/* Background with mirror effect */}
        <div className="absolute inset-0 flex">
          <div 
            className="w-1/2 h-full bg-cover bg-center"
            style={{
              backgroundImage: 'url(/images/BackgroundLogin.jpg)',
            }}
          />
          <div 
            className="w-1/2 h-full bg-cover bg-center"
            style={{
              backgroundImage: 'url(/images/BackgroundLogin.jpg)',
              transform: 'scaleX(-1)',
            }}
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/85" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-2xl px-4">
          {/* Form Card */}
          <div 
          className="rounded-2xl p-8 max-h-[85vh] overflow-y-auto"
          style={{
            background: 'linear-gradient(180deg, rgba(217,217,217,0.02) 0%, rgba(115,115,115,0.04) 100%)',
            backdropFilter: 'blur(10px)',
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
            Host
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Community Name */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Community Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="communityName"
                value={formData.communityName}
                onChange={handleChange}
                placeholder="e.g. The Blue Note Jazz Club"
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1] transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#6366F1] transition-colors"
              >
                <option value="">Choose your category</option>
                <option value="Music">Music</option>
                <option value="Art">Art</option>
                <option value="Food & Drink">Food & Drink</option>
                <option value="Sports & Fitness">Sports & Fitness</option>
                <option value="Networking">Networking</option>
                <option value="Education">Education</option>
                <option value="Technology">Technology</option>
                <option value="Other">Other</option>
              </select>
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
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1] transition-colors"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select 
                  className="px-3 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#6366F1]"
                >
                  <option value="+91">🇮🇳 +91</option>
                </select>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g. Enter ISD / STD / Mobile Number"
                  className="flex-1 px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1] transition-colors"
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
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1] transition-colors"
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
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#6366F1] transition-colors"
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
                placeholder="e.g. https://www.instagram.com/your_community"
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1] transition-colors"
              />
            </div>

            {/* Upload Photo */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Upload photo <span className="text-red-500">*</span>
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
                  className="flex flex-col items-center justify-center w-full h-32 bg-[#2A2A2A] border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-[#6366F1] transition-colors"
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
              className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold py-3.5 rounded-lg transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              {isLoading ? 'SUBMITTING...' : 'CONTINUE'}
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default HostSignup;
