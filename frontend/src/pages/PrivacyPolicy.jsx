import React from 'react';
import NavigationBar from '../components/NavigationBar';

const PrivacyPolicy = () => {
  const sections = [
    {
      number: "1",
      title: "Information We Collect",
      intro: "We collect different types of information to operate and improve our services:",
      subsections: [
        {
          subtitle: "1.1 Personal Information",
          content: "When you create an account or use IndulgeOut, we may collect:",
          bullets: [
            "Name",
            "Email address",
            "Phone number",
            "Location data (GPS or city-level)",
            "Profile information (interests, preferences, demographics, activity categories)",
            "Payment-related metadata (processed securely via third-party gateways — we do not store card details)"
          ]
        },
        {
          subtitle: "1.2 Activity Data",
          content: "We collect data related to your activity on the Platform, including:",
          bullets: [
            "Events you browse, book, attend, host, or save",
            "Communities, brands, or venues you follow or engage with",
            "Messages, reviews, ratings, and interactions on the Platform"
          ]
        },
        {
          subtitle: "1.3 Device and Log Data",
          content: "We automatically collect technical data such as:",
          bullets: [
            "Device type, OS version, and app version",
            "IP address",
            "Browser type",
            "Usage patterns, session logs, and clickstream data"
          ]
        }
      ]
    },
    {
      number: "2",
      title: "How We Use Your Information",
      intro: "We use your information for the following purposes:",
      subsections: [
        {
          subtitle: "2.1 To Provide and Improve Services",
          bullets: [
            "Enable event discovery, ticketing, check-ins, and community engagement",
            "Personalize recommendations for events, interests, and experiences",
            "Provide customer support and resolve issues"
          ]
        },
        {
          subtitle: "2.2 Communication",
          bullets: [
            "Send confirmations, reminders, updates, and service-related messages",
            "Notify you about new features, offers, policy updates, and platform changes"
          ]
        },
        {
          subtitle: "2.3 Analytics",
          bullets: [
            "Analyze user behavior and engagement trends",
            "Improve platform performance, usability, and product offerings"
          ]
        },
        {
          subtitle: "2.4 Marketing and Advertising",
          bullets: [
            "Display relevant promotions, events, or offers based on your interests and activity",
            "Measure campaign effectiveness and optimize outreach efforts"
          ]
        }
      ]
    },
    {
      number: "3",
      title: "Disclaimer of Liability for Events and Offline Experiences",
      intro: "IndulgeOut acts as a discovery, booking, and facilitation platform connecting users with event organizers, communities, venues, and brands. We do not own, manage, control, or operate the events listed on the Platform.",
      content: "By using IndulgeOut, you acknowledge that:",
      bullets: [
        "IndulgeOut is not responsible for any injury, loss, damage, misconduct, or harm arising before, during, or after any event or experience booked through the Platform.",
        "IndulgeOut does not guarantee the conduct, quality, safety, legality, or suitability of any event, host, venue, or participant.",
        "Transportation, venue safety, compliance, and on-ground operations remain solely the responsibility of the organizer and participants."
      ]
    },
    {
      number: "4",
      title: "Disclaimer of Liability for Property Damage",
      intro: "IndulgeOut is not responsible for any property damage, loss, or theft occurring at venues, locations, or during events listed on the Platform, including but not limited to:",
      bullets: [
        "Damage to private or public venues, facilities, or infrastructure",
        "Loss or theft of personal belongings, equipment, or materials"
      ],
      footer: "All liability and dispute resolution related to property damage lies solely between the individuals or parties involved."
    },
    {
      number: "5",
      title: "Sharing Your Information",
      intro: "We do not sell your personal information. We may share data in the following circumstances:",
      subsections: [
        {
          subtitle: "5.1 With Service Providers",
          content: "We work with trusted third-party vendors for:",
          bullets: [
            "Payment processing",
            "Analytics and performance tracking",
            "Cloud hosting and infrastructure"
          ],
          footer: "These partners only receive the data necessary to perform their services and are contractually obligated to protect your information."
        },
        {
          subtitle: "5.2 Legal Requirements",
          content: "We may disclose information if required by law, regulation, court order, or governmental request, or to protect the rights, safety, and property of IndulgeOut, users, or the public."
        },
        {
          subtitle: "5.3 Business Transfers",
          content: "In the event of a merger, acquisition, restructuring, or sale of assets, user information may be transferred as part of the transaction. We will notify you of any such changes where legally required."
        }
      ]
    },
    {
      number: "6",
      title: "Data Security",
      content: "We use industry-standard safeguards including encryption, access controls, secure servers, and SSL protocols to protect your data. However, no system is completely secure, and we cannot guarantee absolute security of your information."
    },
    {
      number: "7",
      title: "Your Choices and Rights",
      subsections: [
        {
          subtitle: "7.1 Access and Update",
          content: "You can access and update your account details through your profile settings on the Platform."
        },
        {
          subtitle: "7.2 Account Deletion",
          content: "You may request deletion of your account and personal data. Upon deletion, your data will be removed from active systems, though certain information may be retained for legal, regulatory, or administrative purposes."
        },
        {
          subtitle: "7.3 Communication Preferences",
          content: "You may opt out of promotional communications using the unsubscribe links provided. Transactional and service-related messages may still be sent."
        }
      ]
    },
    {
      number: "8",
      title: "Children's Privacy",
      content: "IndulgeOut is not intended for individuals under the age of 13. We do not knowingly collect personal information from children. If such data is identified, we will take steps to delete it promptly."
    }
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
            Privacy Policy
          </h1>
          <p 
            className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-4xl"
            style={{ fontFamily: 'Source Serif Pro, serif' }}
          >
            At IndulgeOut ("we," "us," "our"), your privacy matters to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use the IndulgeOut mobile app and website (collectively, the "Platform"). By using IndulgeOut, you agree to the practices described in this policy.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 sm:space-y-8">
          {sections.map((section) => (
            <div 
              key={section.number}
              className="bg-zinc-900/50 rounded-lg p-5 sm:p-8 border border-gray-800"
            >
              {/* Section Header */}
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div 
                  className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base"
                  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                >
                  {section.number}
                </div>
                <h2 
                  className="text-lg sm:text-xl font-bold text-white flex-1 pt-1"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  {section.title}
                </h2>
              </div>

              {/* Section Intro */}
              {section.intro && (
                <p 
                  className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-4"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  {section.intro}
                </p>
              )}

              {/* Simple Content */}
              {section.content && !section.subsections && (
                <p 
                  className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-4"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  {section.content}
                </p>
              )}

              {/* Simple Bullets */}
              {section.bullets && !section.subsections && (
                <ul className="space-y-2 sm:space-y-3 mb-4">
                  {section.bullets.map((bullet, idx) => (
                    <li 
                      key={idx}
                      className="flex items-start gap-3 text-xs sm:text-sm text-gray-400 leading-relaxed"
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

              {/* Section Footer */}
              {section.footer && (
                <p 
                  className="text-xs sm:text-sm text-gray-400 leading-relaxed mt-4"
                  style={{ fontFamily: 'Source Serif Pro, serif' }}
                >
                  {section.footer}
                </p>
              )}

              {/* Subsections */}
              {section.subsections && (
                <div className="space-y-5 sm:space-y-6">
                  {section.subsections.map((subsection, idx) => (
                    <div key={idx} className="pl-0 sm:pl-6">
                      <h3 
                        className="text-sm sm:text-base font-bold text-white mb-3"
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        {subsection.subtitle}
                      </h3>
                      
                      {subsection.content && (
                        <p 
                          className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-3"
                          style={{ fontFamily: 'Source Serif Pro, serif' }}
                        >
                          {subsection.content}
                        </p>
                      )}

                      {subsection.bullets && (
                        <ul className="space-y-2 sm:space-y-3">
                          {subsection.bullets.map((bullet, bulletIdx) => (
                            <li 
                              key={bulletIdx}
                              className="flex items-start gap-3 text-xs sm:text-sm text-gray-400 leading-relaxed"
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

                      {subsection.footer && (
                        <p 
                          className="text-xs sm:text-sm text-gray-400 leading-relaxed mt-3"
                          style={{ fontFamily: 'Source Serif Pro, serif' }}
                        >
                          {subsection.footer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-8 sm:mt-10 bg-zinc-900/50 rounded-lg p-5 sm:p-8 border border-gray-800">
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

export default PrivacyPolicy;
