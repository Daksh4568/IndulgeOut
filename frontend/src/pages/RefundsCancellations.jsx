import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const RefundsCancellations = () => {
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
              <RefreshCw className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Refunds & Cancellations Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: January 26, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-8">
          {/* Overview */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              1. Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              At IndulgeOut, we strive to provide the best experience for both event organizers and attendees. This policy 
              outlines our refund and cancellation procedures. Please note that refund policies may vary depending on the 
              event organizer's specific terms, which will be clearly stated at the time of registration.
            </p>
          </section>

          {/* Cancellation by Attendees */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. Cancellation by Attendees
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              2.1 Free Events
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              For free events, attendees may cancel their registration at any time before the event without penalty. However, 
              we encourage timely cancellations to allow other interested attendees to register.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              2.2 Paid Events - Standard Refund Policy
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              Unless otherwise specified by the event organizer, the following refund schedule applies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li><strong>More than 7 days before event:</strong> 90% refund (10% processing fee)</li>
              <li><strong>4-7 days before event:</strong> 50% refund</li>
              <li><strong>1-3 days before event:</strong> 25% refund</li>
              <li><strong>Less than 24 hours before event:</strong> No refund</li>
              <li><strong>After event start time:</strong> No refund</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              2.3 How to Request a Cancellation
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Log into your IndulgeOut account</li>
              <li>Navigate to "My Tickets" in your dashboard</li>
              <li>Select the ticket you wish to cancel</li>
              <li>Click "Request Cancellation"</li>
              <li>Provide a reason (optional) and confirm</li>
            </ol>
          </section>

          {/* Cancellation by Organizers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3. Cancellation by Event Organizers
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              3.1 Event Cancellation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              If an event organizer cancels an event:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>All registered attendees will receive automatic 100% refunds for paid events</li>
              <li>Attendees will be notified via email and app notification</li>
              <li>Refunds will be processed within 5-7 business days</li>
              <li>Payment gateway fees will be refunded</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              3.2 Event Postponement
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              If an event is postponed to a new date:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Existing tickets remain valid for the new date</li>
              <li>Attendees unable to attend the new date may request a full refund</li>
              <li>Refund requests must be made within 7 days of postponement notification</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              3.3 Significant Event Changes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If there are significant changes to the event (venue, time, content), attendees will be notified and given 
              the option to request a full refund within 48 hours of the change notification.
            </p>
          </section>

          {/* Refund Processing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. Refund Processing
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              4.1 Processing Time
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Refunds are typically processed within 5-7 business days</li>
              <li>The refunded amount will appear in your original payment method</li>
              <li>Bank processing times may vary (typically 3-10 business days)</li>
              <li>You will receive an email confirmation once the refund is processed</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              4.2 Refund Method
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Refunds will be issued to the original payment method used for the purchase. We do not offer refunds to 
              alternative payment methods or accounts.
            </p>
          </section>

          {/* No-Show Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. No-Show Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              If you register for an event and do not attend without prior cancellation:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>No refund will be provided for no-shows</li>
              <li>Your ticket will be marked as unused but cannot be transferred to future events</li>
              <li>Repeated no-shows may result in account restrictions</li>
            </ul>
          </section>

          {/* Special Circumstances */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. Special Circumstances
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              6.1 Medical Emergency
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              In case of medical emergencies preventing attendance, please contact us at support@indulgeout.com with 
              supporting documentation. We will review each case individually and may offer a full or partial refund at 
              our discretion.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              6.2 Force Majeure
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              In the event of circumstances beyond reasonable control (natural disasters, pandemics, government restrictions, 
              etc.), both organizers and attendees may be entitled to full refunds. IndulgeOut will work with all parties to 
              ensure fair resolution.
            </p>
          </section>

          {/* Multi-Spot Bookings */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Multi-Spot Bookings
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              For tickets with multiple spots (1-10 attendees):
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Partial cancellations are not allowed</li>
              <li>Cancellation requests apply to the entire ticket (all spots)</li>
              <li>Refund amount is calculated based on the total ticket price</li>
              <li>Standard refund timelines apply regardless of the number of spots</li>
            </ul>
          </section>

          {/* Disputes */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Dispute Resolution
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              If you have any concerns about refunds or cancellations:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>First, contact the event organizer directly through the platform</li>
              <li>If unresolved, contact IndulgeOut support at support@indulgeout.com</li>
              <li>Provide your ticket number, event details, and explanation</li>
              <li>Our team will investigate and respond within 3-5 business days</li>
              <li>IndulgeOut's decision in disputes will be final</li>
            </ol>
          </section>

          {/* Organizer Obligations */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. Event Organizer Obligations
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              Event organizers must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Clearly communicate any custom refund policies before attendees register</li>
              <li>Honor the stated refund policy for their events</li>
              <li>Process approved refunds promptly through the platform</li>
              <li>Provide timely notice of cancellations or significant changes</li>
              <li>Maintain sufficient funds in their payout account to cover potential refunds</li>
            </ul>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              IndulgeOut reserves the right to modify this Refunds and Cancellations Policy at any time. Changes will be 
              effective immediately upon posting to the website. Continued use of the platform after changes constitutes 
              acceptance of the modified policy. We recommend reviewing this policy periodically.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              11. Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              For questions about refunds and cancellations, please contact us:
            </p>
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                <strong>Email:</strong>{' '}
                <a href="mailto:support@indulgeout.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                  support@indulgeout.com
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                <strong>Phone:</strong>{' '}
                <a href="tel:+911234567890" className="text-primary-600 dark:text-primary-400 hover:underline">
                  +91 123-456-7890
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST
              </p>
            </div>
          </section>
        </div>

        {/* Quick Access Box */}
        <div className="mt-8 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600 p-6 rounded-r-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Need to Request a Refund?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Visit your dashboard to manage your tickets and request cancellations.
          </p>
          <button
            onClick={() => navigate('/user/dashboard')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundsCancellations;

