import React, { useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import axios from 'axios';

function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      await axios.post(`${API_BASE_URL}/support/contact`, {
        name: formData.name,
        email: formData.email,
        message: formData.message
      });

      setSuccessMessage('Thank you for reaching out! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setErrorMessage('Failed to send message. Please try again or email us directly at cs@indulgeout.com');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Contact Info */}
            <div className="text-white">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style={{ fontFamily: 'Oswald, sans-serif' }}>
                Contact Us
              </h1>
              
              <p className="text-gray-300 text-lg mb-6 leading-relaxed" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                We'd love to hear from you! Whether you have a question, feedback, or simply want to chat about offline experiences, feel free to reach out.
              </p>
              
              <p className="text-gray-300 text-lg mb-8" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                Drop us a message, and we'll get back to you!
              </p>
              
              {/* Contact Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-indigo-400" />
                  </div>
                  <a href="mailto:cs@indulgeout.com" className="text-gray-300 hover:text-indigo-400 transition-colors">
                    cs@indulgeout.com
                  </a>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-indigo-400" />
                  </div>
                  <a href="tel:+918955578847" className="text-gray-300 hover:text-indigo-400 transition-colors">
                    +91 8955578847
                  </a>
                </div>
              </div>
            </div>

            {/* Right side - Contact Form */}
            <div className="bg-black border border-gray-800 rounded-2xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none placeholder-gray-400"
                    placeholder="Enter your message"
                  />
                </div>

                {successMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">{successMessage}</p>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white px-6 py-3.5 rounded-lg text-base font-bold transition-all duration-300 transform hover:scale-105 hover:opacity-90 shadow-lg uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                >
                  {loading ? 'Sending...' : 'Submit'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;

