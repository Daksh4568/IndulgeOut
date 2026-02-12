import React from 'react';
import NavigationBar from '../components/NavigationBar';

const RefundsCancellations = () => {
  const refundScenarios = [
    {
      number: "1",
      title: "Event Cancelled by Organizer or IndulgeOut",
      description: "If an event is cancelled by the organizer or IndulgeOut, guests are eligible for a refund of the ticket price, platform fee, and applicable taxes (excluding payment gateway charges)."
    },
    {
      number: "2",
      title: "Guest Removed by Organizer",
      description: "If a guest is removed by the organizer for any reason, the guest is eligible for a refund of the ticket price, platform fee, and applicable taxes (excluding payment gateway charges)."
    }
  ];

  const generalNotes = [
    "All refunds are processed to the original payment method used at checkout.",
    "Refund processing timelines depend on banking partners and payment gateways.",
    "IndulgeOut reserves the right to update or modify this policy at any time."
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <NavigationBar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            Refund & Cancellation Policy
          </h1>
          <p 
            className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-4xl"
            style={{ fontFamily: 'Source Serif Pro, serif' }}
          >
            At IndulgeOut, we aim to create a fair, transparent, and seamless experience for all users. This policy explains when refunds may be issued and how cancellations are handled on the platform.
          </p>
        </div>

        {/* Fee Structure Overview */}
        <section className="mb-10 sm:mb-16">
          <h2 
            className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white uppercase tracking-wide"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            FEE STRUCTURE OVERVIEW
          </h2>
          <p 
            className="text-sm sm:text-base text-gray-400 leading-relaxed"
            style={{ fontFamily: 'Source Serif Pro, serif' }}
          >
            Each ticket purchase includes the ticket price, platform fee, applicable taxes, and payment gateway charges. All ticket purchases are final and non-cancellable by guests unless otherwise specified by the event organizer. Refunds, where applicable, are governed by the organizer's cancellation policy and IndulgeOut's platform rules.
          </p>
        </section>

        {/* Refund Scenarios */}
        <section className="mb-10 sm:mb-16">
          <h2 
            className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-white uppercase tracking-wide"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            REFUND SCENARIOS
          </h2>
          
          <div className="space-y-4 sm:space-y-6">
            {refundScenarios.map((scenario) => (
              <div 
                key={scenario.number}
                className="bg-[#999999] rounded-lg p-5 sm:p-6 border border-gray-800 hover:border-gray-700 transition-all"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Number Circle */}
                  <div 
                    className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base"
                    style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                  >
                    {scenario.number}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 
                      className="text-base sm:text-lg font-bold text-white mb-2"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      {scenario.title}
                    </h3>
                    <p 
                      className="text-xs sm:text-sm text-gray-400 leading-relaxed"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      {scenario.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* General Notes */}
        <section className="mb-10 sm:mb-16">
          <h2 
            className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-white uppercase tracking-wide"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            GENERAL NOTES
          </h2>
          
          <div className="bg-[#999999] rounded-lg p-5 sm:p-8 border border-gray-800">
            <ul className="space-y-3 sm:space-y-4">
              {generalNotes.map((note, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3 text-xs sm:text-sm text-gray-400 leading-relaxed"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  <span className="text-gray-500 mt-1">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact */}
        <div className="bg-[#999999] rounded-lg p-5 sm:p-8 border border-gray-800">
          <p 
            className="text-xs sm:text-sm text-gray-400"
            style={{ fontFamily: 'Source Serif Pro, serif' }}
          >
            For assistance or further inquiries, please reach out to us at{' '}
            <a 
              href="mailto:cs@indulgeout.com" 
              className="text-[#7878E9] hover:text-[#8888F9] transition-colors underline"
            >
              cs@indulgeout.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefundsCancellations;

