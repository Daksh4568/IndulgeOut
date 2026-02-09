import React, { useState } from 'react';
import { X, Upload, CheckCircle } from 'lucide-react';
import { api } from '../config/api';

const SupportModal = ({ isOpen, onClose, userRole }) => {
  const [formData, setFormData] = useState({
    role: userRole || '',
    issueType: '',
    description: '',
    screenshot: null
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = [
    'Regular User',
    'Community Organizer',
    'Venue Partner',
    'Brand Sponsor'
  ];

  const issueTypeOptions = [
    'Account & Login Issues',
    'Event Registration Problems',
    'Payment & Refund',
    'Ticket Issues',
    'Profile Management',
    'Event Creation',
    'Collaboration Issues',
    'Technical Bug',
    'Feature Request',
    'Other'
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size should be less than 5MB');
        return;
      }
      setFormData({ ...formData, screenshot: file });
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.role) {
      setError('Please select your role');
      return;
    }
    if (!formData.issueType) {
      setError('Please select an issue type');
      return;
    }
    if (formData.description.length < 500) {
      setError('Description must be at least 500 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData = new FormData();
      requestData.append('role', formData.role);
      requestData.append('issueType', formData.issueType);
      requestData.append('description', formData.description);
      if (formData.screenshot) {
        requestData.append('screenshot', formData.screenshot);
      }

      await api.post('/support/submit', requestData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSubmitted(true);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ role: userRole || '', issueType: '', description: '', screenshot: null });
    setSubmitted(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <style>{`
        select option:hover,
        select option:focus,
        select option:checked {
          background: linear-gradient(to right, #7878E9, #3D3DD4) !important;
          color: white !important;
        }
      `}</style>
      <div className="bg-black rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-800 shadow-2xl">
        {submitted ? (
          // Success State
          <div className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
              Request Received
            </h2>
            <p className="text-gray-400" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              Your request has been received. We'll get back shortly.
            </p>
          </div>
        ) : (
          // Form State
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                Submit a Support Request
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Role Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#7878E9] focus:ring-2 focus:ring-[#7878E9]/50 focus:outline-none appearance-none cursor-pointer hover:border-[#7878E9]/70 transition-all"
                  required
                >
                  <option value="" disabled className="text-gray-500">Selected Option</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role} className="bg-gray-900 text-white hover:bg-gradient-to-r hover:from-[#7878E9] hover:to-[#3D3DD4]">
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Type Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Issue Type
                </label>
                <select
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#7878E9] focus:ring-2 focus:ring-[#7878E9]/50 focus:outline-none appearance-none cursor-pointer hover:border-[#7878E9]/70 transition-all"
                  required
                >
                  <option value="" disabled className="text-gray-500">Selected Option</option>
                  {issueTypeOptions.map((type) => (
                    <option key={type} value={type} className="bg-gray-900 text-white hover:bg-gradient-to-r hover:from-[#7878E9] hover:to-[#3D3DD4]">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please describe your issue in detail..."
                  rows="6"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#7878E9] focus:ring-2 focus:ring-[#7878E9]/50 focus:outline-none resize-none hover:border-[#7878E9]/70 transition-all"
                  required
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">Minimum 500 characters</span>
                  <span className="text-xs text-gray-400">{formData.description.length} characters</span>
                </div>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Attach Screenshot <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label
                    htmlFor="screenshot-upload"
                    className="flex items-center justify-center gap-2 w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 hover:border-[#7878E9] hover:bg-[#7878E9]/10 hover:text-white transition-all cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    {formData.screenshot ? formData.screenshot.name : 'Choose file'}
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SupportModal;
