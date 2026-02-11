import React from 'react';
import NavigationBar from '../components/NavigationBar';

const TermsConditions = () => {
  const sections = [
    {
      number: 1,
      title: 'Information',
      content: 'Welcome to IndulgeOut. These Terms and Conditions govern your access to and use of the IndulgeOut mobile app and website (collectively, the "Platform"). By accessing or using IndulgeOut, you agree to be bound by these Terms. If you do not agree with any of the terms, you may not use any of the services offered by IndulgeOut.'
    },
    {
      number: 2,
      title: 'User Accounts',
      subsections: [
        {
          subtitle: 'Eligibility',
          content: 'You must be at least 18 years old or have parental consent to use IndulgeOut.'
        },
        {
          subtitle: 'Account Responsibility',
          content: 'You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You agree to notify us immediately of any unauthorized use.'
        },
        {
          subtitle: 'Profile Information',
          content: 'You agree to provide accurate, current, and complete information during registration and to keep your profile updated.'
        }
      ]
    },
    {
      number: 3,
      title: 'Use of IndulgeOut',
      subsections: [
        {
          subtitle: 'Event Discovery & Participation',
          content: 'IndulgeOut enables users to discover, book, attend, and host experiences, events, and community activities. Users are solely responsible for their conduct before, during, and after events.'
        },
        {
          subtitle: 'Event Hosting & Listings',
          content: 'Organizers, brands, venues, and communities listing events must provide accurate details, including pricing, timing, venue information, eligibility, and experience expectations. Hosts are responsible for compliance with applicable laws, venue rules, and safety requirements.'
        }
      ]
    },
    {
      number: 4,
      title: 'Disclaimer of Liability for Events Outside IndulgeOut',
      content: 'IndulgeOut acts solely as a discovery, listing, and facilitation platform and does not organize, operate, manage, or control events.',
      additionalContent: 'By using IndulgeOut, you acknowledge that:',
      bullets: [
        'IndulgeOut is not responsible for any injury, loss, damage, harm, or misconduct occurring before, during, or after any event listed on the Platform.',
        'IndulgeOut is not responsible for criminal activity, harassment, assault, theft, or any other misconduct by organizers, attendees, venues, or third parties.',
        'Transportation, venue selection, safety arrangements, and event execution are the sole responsibility of the organizers and participants.'
      ]
    },
    {
      number: 5,
      title: 'Disclaimer of Liability for Property Damage',
      content: 'IndulgeOut is not responsible for any property damage, loss, or theft occurring at venues or during experiences listed on the Platform, including but not limited to:',
      bullets: [
        'Damage to public or private venues, facilities, or infrastructure',
        'Loss or theft of personal belongings, equipment, or materials'
      ],
      footer: 'All disputes, damages, and claims must be resolved directly between the involved parties, and IndulgeOut disclaims all liability.'
    },
    {
      number: 6,
      title: 'User Conduct',
      subsections: [
        {
          subtitle: 'Prohibited Conduct',
          content: 'Users may not:',
          bullets: [
            'Use IndulgeOut for illegal, harmful, or fraudulent activities',
            'Harass, abuse, threaten, or harm others',
            'Impersonate any person or entity',
            'Post false, misleading, infringing, or inappropriate content',
            'Interfere with platform operations or misuse platform features'
          ]
        },
        {
          subtitle: 'Violation of Terms',
          content: 'IndulgeOut reserves the right to suspend or terminate accounts, remove content, or restrict access at its sole discretion for violations of these Terms or harmful conduct.'
        }
      ]
    },
    {
      number: 7,
      title: 'Limits of Liability',
      content: 'IndulgeOut is not liable for any incidents, injuries, losses, damages, or disputes arising from:',
      bullets: [
        'Events, experiences, or meetups booked through the Platform',
        'Conduct of organizers, attendees, venues, or third parties',
        'Loss, theft, or damage to personal property'
      ],
      footer: 'By using IndulgeOut, you agree to indemnify and hold harmless IndulgeOut, its affiliates, employees, and partners from any claims, liabilities, damages, or expenses arising from your use of the Platform or participation in events.'
    },
    {
      number: 8,
      title: 'Intellectual Property',
      subsections: [
        {
          subtitle: 'Ownership',
          content: 'All Platform content, including logos, trademarks, text, graphics, interfaces, software, and designs, are the intellectual property of IndulgeOut or its licensors and protected under applicable laws.'
        },
        {
          subtitle: 'User Content',
          content: 'By submitting content (including event listings, images, descriptions, or reviews), you grant IndulgeOut a non-exclusive, royalty-free, worldwide license to use, reproduce, distribute, display, and promote such content for Platform operations and marketing purposes.'
        }
      ]
    },
    {
      number: 9,
      title: 'Modifications to the Service and Terms',
      subsections: [
        {
          subtitle: 'Platform Changes',
          content: 'IndulgeOut reserves the right to modify, suspend, or discontinue any part of the Platform at any time without notice.'
        },
        {
          subtitle: 'Terms Updates',
          content: 'We may update these Terms periodically. Continued use of the Platform after changes constitutes acceptance of the revised Terms.'
        }
      ]
    },
    {
      number: 10,
      title: 'Governing Law',
      content: 'These Terms shall be governed by and construed in accordance with the laws of India, and you agree to submit to the exclusive jurisdiction of the courts located in anywhere across India.'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Terms & Conditions
          </h1>
          <p className="text-base sm:text-lg text-gray-400" style={{ fontFamily: 'Source Serif Pro, serif' }}>
            Last updated: February 11, 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div 
              key={section.number}
              className="bg-[#1A1A1A] rounded-lg p-6 sm:p-8 border border-gray-800"
            >
              {/* Section Header */}
              <div className="flex items-start gap-4 mb-6">
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base"
                  style={{ 
                    background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                    fontFamily: 'Oswald, sans-serif'
                  }}
                >
                  {section.number}
                </div>
                <h2 
                  className="text-xl font-bold text-white flex-1 pt-1"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  {section.title}
                </h2>
              </div>

              {/* Main content paragraph */}
              {section.content && (
                <p 
                  className="text-sm text-gray-400 leading-relaxed mb-4"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  {section.content}
                </p>
              )}

              {/* Additional content (shown before bullets) */}
              {section.additionalContent && !section.subsections && (
                <p 
                  className="text-sm text-gray-400 leading-relaxed mb-4"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  {section.additionalContent}
                </p>
              )}

              {/* Bullets */}
              {section.bullets && !section.subsections && (
                <ul className="space-y-3 mb-4">
                  {section.bullets.map((bullet, idx) => (
                    <li 
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-400 leading-relaxed"
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    >
                      <span 
                        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                        style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                      ></span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Footer (shown after bullets) */}
              {section.footer && !section.subsections && (
                <p 
                  className="text-sm text-gray-400 leading-relaxed"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  {section.footer}
                </p>
              )}

              {/* Subsections */}
              {section.subsections && (
                <div className="space-y-6">
                  {section.subsections.map((subsection, idx) => (
                    <div key={idx} className="pl-0 sm:pl-6">
                      <h3 
                        className="text-base font-bold text-white mb-3"
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        {subsection.subtitle}
                      </h3>
                      <p 
                        className="text-sm text-gray-400 leading-relaxed mb-3"
                        style={{ fontFamily: 'Source Serif Pro, serif' }}
                      >
                        {subsection.content}
                      </p>
                      {subsection.bullets && (
                        <ul className="space-y-3">
                          {subsection.bullets.map((bullet, bulletIdx) => (
                            <li 
                              key={bulletIdx}
                              className="flex items-start gap-3 text-sm text-gray-400 leading-relaxed"
                              style={{ fontFamily: 'Source Serif Pro, serif' }}
                            >
                              <span 
                                className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                                style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                              ></span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-[#1A1A1A] rounded-lg p-6 sm:p-8 border border-gray-800">
          <p 
            className="text-sm text-gray-400"
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

export default TermsConditions;

