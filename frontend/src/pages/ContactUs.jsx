import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle, ArrowLeft } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const ContactUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Email Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Email Us
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  For general inquiries and support
                </p>
                <a
                  href="mailto:support@indulgeout.com"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  support@indulgeout.com
                </a>
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Phone className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Call Us
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Mon-Fri from 9am to 6pm
                </p>
                <a
                  href="tel:+911234567890"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  +91 123-456-7890
                </a>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Visit Us
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  IndulgeOut Headquarters<br />
                  123 Community Street<br />
                  Mumbai, Maharashtra 400001<br />
                  India
                </p>
              </div>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Help Center
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Browse our help articles
                </p>
                <a
                  href="/faq"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Visit Help Center
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Business Inquiries Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Business Inquiries</h2>
          <p className="mb-4">
            Interested in partnering with us or hosting events? We'd love to collaborate!
          </p>
          <div className="space-y-2">
            <p>
              <strong>Partnerships:</strong>{' '}
              <a href="mailto:partnerships@indulgeout.com" className="underline">
                partnerships@indulgeout.com
              </a>
            </p>
            <p>
              <strong>Event Organizers:</strong>{' '}
              <a href="mailto:organizers@indulgeout.com" className="underline">
                organizers@indulgeout.com
              </a>
            </p>
            <p>
              <strong>Venue Collaborations:</strong>{' '}
              <a href="mailto:venues@indulgeout.com" className="underline">
                venues@indulgeout.com
              </a>
            </p>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Follow Us
          </h2>
          <div className="flex justify-center space-x-6">
            <a
              href="#"
              className="w-12 h-12 bg-gray-200 dark:bg-gray-700 hover:bg-primary-600 dark:hover:bg-primary-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
            >
              <span className="text-2xl">📘</span>
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-gray-200 dark:bg-gray-700 hover:bg-primary-600 dark:hover:bg-primary-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
            >
              <span className="text-2xl">📷</span>
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-gray-200 dark:bg-gray-700 hover:bg-primary-600 dark:hover:bg-primary-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
            >
              <span className="text-2xl">🐦</span>
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-gray-200 dark:bg-gray-700 hover:bg-primary-600 dark:hover:bg-primary-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
            >
              <span className="text-2xl">💼</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
