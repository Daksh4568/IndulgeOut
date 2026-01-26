import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const TermsConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
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
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <FileText className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Terms & Conditions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: January 26, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Welcome to IndulgeOut. By accessing or using our platform, you agree to be bound by these Terms and Conditions. 
              If you do not agree with any part of these terms, you may not access the service. IndulgeOut provides a platform 
              connecting communities through shared interests and real-world experiences.
            </p>
          </section>

          {/* Account Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. Account Terms
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>You must be at least 18 years old to use this service.</li>
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account and password.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must not use the service for any illegal or unauthorized purpose.</li>
              <li>One person or legal entity may not maintain more than one account.</li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3. User Responsibilities
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              As a user of IndulgeOut, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Provide accurate event information if you are an event organizer.</li>
              <li>Respect other users and their rights.</li>
              <li>Not post or transmit any content that is offensive, defamatory, or violates any laws.</li>
              <li>Not engage in any fraudulent activities including ticket reselling without authorization.</li>
              <li>Comply with all local laws regarding online conduct and acceptable content.</li>
            </ul>
          </section>

          {/* Event Registration and Tickets */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. Event Registration and Tickets
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Event registration is subject to availability and acceptance by the event organizer.</li>
              <li>Tickets purchased through IndulgeOut are for personal use only.</li>
              <li>Ticket prices are determined by event organizers and are clearly displayed before purchase.</li>
              <li>Each ticket is unique and can only be used once for event check-in.</li>
              <li>You may book multiple spots (up to 10) per ticket for certain events.</li>
              <li>Ticket transfers must comply with the event organizer's policies.</li>
            </ul>
          </section>

          {/* Payments */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. Payments
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              All payments are processed securely through our payment partner, Cashfree. By making a payment, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Provide accurate payment information.</li>
              <li>Pay all charges at the prices in effect when incurred.</li>
              <li>Accept responsibility for all charges incurred under your account.</li>
              <li>Understand that all payments are subject to our refund policy.</li>
            </ul>
          </section>

          {/* Organizer Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. Event Organizer Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              If you create and host events on IndulgeOut:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>You are responsible for all aspects of your event including safety and legal compliance.</li>
              <li>You must provide accurate and complete information about your events.</li>
              <li>You agree to honor all registrations and tickets sold through the platform.</li>
              <li>You are responsible for managing attendee check-ins and event execution.</li>
              <li>IndulgeOut may charge a service fee for using the platform (if applicable).</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              The IndulgeOut platform, including all content, features, and functionality, is owned by IndulgeOut and is 
              protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, 
              distribute, modify, or create derivative works without express written permission.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              IndulgeOut acts as a platform connecting event organizers and attendees. We are not responsible for the actual 
              events, their quality, or any incidents that may occur. Event organizers are solely responsible for their events. 
              IndulgeOut shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising 
              from your use of the service.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. Termination
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We reserve the right to terminate or suspend your account and access to the service at our sole discretion, 
              without notice, for conduct that we believe violates these Terms and Conditions or is harmful to other users, 
              us, or third parties, or for any other reason.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We reserve the right to modify these Terms and Conditions at any time. We will notify users of any significant 
              changes via email or through the platform. Your continued use of IndulgeOut after such modifications constitutes 
              your acceptance of the updated terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              11. Governing Law
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes 
              arising from these terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              12. Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                Email: <a href="mailto:legal@indulgeout.com" className="text-primary-600 dark:text-primary-400 hover:underline">legal@indulgeout.com</a>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Address: 123 Community Street, Mumbai, Maharashtra 400001, India
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;

