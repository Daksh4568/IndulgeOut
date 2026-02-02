import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Building2, Sparkles, Search, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const HostPartnerPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const roleCards = [
    {
      icon: <Users className="h-12 w-12" />,
      title: "COMMUNITIES & ORGANIZERS",
      subtitle: "For passionate community builders",
      perfectFor: [
        "Communities",
        "Creators",
        "Event organizers"
      ],
      whatYouCanDo: [
        "Host curated experiences",
        "Reach the right audience",
        "Collaborate with venues & brands",
        "Build engaged communities",
        "Monetize your passion"
      ],
      buttonText: "Host an Experience",
      buttonLink: "/onboarding/community",
      gradient: "from-[#6366F1] to-[#6366F1]",
      iconBg: "bg-[#6366F1]"
    },
    {
      icon: <Building2 className="h-12 w-12" />,
      title: "VENUES",
      subtitle: "For spaces seeking meaningful events",
      perfectFor: [
        "Cafe",
        "Bars",
        "Studios",
        "Event Spaces"
      ],
      whatYouCanDo: [
        "Get curated footfall",
        "Monetize idle slots",
        "Partner with communities",
        "Increase brand visibility"
      ],
      buttonText: "List Your Space",
      buttonLink: "/onboarding/venue",
      gradient: "from-[#6366F1] to-[#6366F1]",
      iconBg: "bg-[#6366F1]"
    },
    {
      icon: <Sparkles className="h-12 w-12" />,
      title: "CONSUMER BRANDS",
      subtitle: "For brands seeking experiential marketing",
      perfectFor: [
        "Lifestyle brands",
        "Consumer Brands",
        "Beverage brands"
      ],
      whatYouCanDo: [
        "Engage your target audiences offline",
        "Sponsor meaningful experiences",
        "Product Trials, Sales & Brand Advocacy",
        "Real Time Consumer Feedback & Insights",
        "Effective Retargeting"
      ],
      buttonText: "Market Your Product/Service",
      buttonLink: "/onboarding/brand",
      gradient: "from-[#6366F1] to-[#6366F1]",
      iconBg: "bg-[#6366F1]"
    }
  ];

  const howItWorks = [
    {
      icon: <Search className="h-10 w-10" />,
      title: "EXPLORE & DISCOVER",
      description: "Find relevant communities, sponsors and venues to enable and participate in curated experiences.",
      number: "1"
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "CREATE & COLLABORATE",
      description: "List your events to get high-intent audience and collaborate with relevant partners to enhance each offline experience.",
      number: "2"
    },
    {
      icon: <TrendingUp className="h-10 w-10" />,
      title: "ANALYTICS & INSIGHTS",
      description: "Get detailed analysis of your events and collaborations for post-event insights to improve performance and increase revenue.",
      number: "3"
    }
  ];

  const differentiators = [
    {
      title: "EVENT COLLABORATION ECOSYSTEM",
      description: "Access select communities, venues and brands for most aligned event partnerships."
    },
    {
      title: "INSIGHTS DRIVEN PLATFORM",
      description: "Actionable insights for event hosting and collaborations to scale in the offline event industry."
    },
    {
      title: "INTEREST FIRST DISCOVERY",
      description: "Get access to curated audience for each event category to ensure high intent and interest-led footfall."
    }
  ];

  const faqs = [
    {
      question: "Who Can Host?",
      answer: "Anyone Looking To Meet Like-Minded People And Engage In Activities They're Passionate About."
    },
    {
      question: "Do I Need A Big Community?",
      answer: "No! You can start with any community size. IndulgeOut helps you grow and connect with like-minded people."
    },
    {
      question: "How Do Venues Get Paid?",
      answer: "Venues receive payments directly through our secure platform after successful events."
    },
    {
      question: "How Do Brands Collaborate?",
      answer: "Brands can sponsor events, provide products for trials, and engage with target audiences authentically."
    },
    {
      question: "Is This Curated Or Open?",
      answer: "We maintain a curated ecosystem to ensure quality experiences and meaningful connections."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <NavigationBar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Choose who you are
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-16">
            A dedicated space for seamless offline experience collaborations.
          </p>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {roleCards.map((role, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 hover:scale-105 transition-transform duration-300 border border-gray-700 flex flex-col"
              >
                {/* Icon */}
                <div className={`${role.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6`}>
                  {role.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2">{role.title}</h3>
                <p className="text-sm text-gray-400 mb-6">{role.subtitle}</p>

                {/* Perfect For */}
                <div className="mb-6 text-left">
                  <p className="text-xs font-semibold text-purple-400 mb-2">PERFECT FOR:</p>
                  <div className="flex flex-wrap gap-2">
                    {role.perfectFor.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 bg-gray-800 rounded-full border border-gray-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* What You Can Do */}
                <div className="mb-8 text-left flex-1">
                  <p className="text-xs font-semibold text-purple-400 mb-3">WHAT YOU CAN DO:</p>
                  <ul className="space-y-2">
                    {role.whatYouCanDo.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => navigate(role.buttonLink)}
                  className={`w-full bg-gradient-to-r ${role.gradient} text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity uppercase mt-auto`}
                >
                  {role.buttonText} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How it works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 hover:scale-105 transition-transform duration-300 border border-gray-700">
                  {/* Number Badge */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-black border-2 border-white rounded-full flex items-center justify-center font-bold text-xl">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="bg-[#6366F1] w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow for desktop */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes IndulgeOut Different */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            What makes IndulgeOut different
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80"
                alt="Event collaboration"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
            </div>

            {/* Feature Cards */}
            <div className="space-y-6">
              {differentiators.map((item, index) => (
                <div
                  key={index}
                  className="bg-white text-black rounded-xl p-6 hover:scale-105 transition-transform duration-300 shadow-lg"
                >
                  <h3 className="text-lg font-bold text-[#6366F1] mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                </div>
              ))}

              <button
                onClick={() => navigate('/about')}
                className="w-full bg-[#6366F1] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#5558E3] transition-colors mt-8 uppercase"
              >
                Read More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Need More Info Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Need More Info?</h3>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked <span className="text-[#6366F1] italic">Questions</span>
          </h2>

          <div className="space-y-4 mt-12">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-xl overflow-hidden ${
                  openFaq === index
                    ? 'bg-gradient-to-br from-[#6366F1] to-[#4F46E5] border-0'
                    : 'bg-transparent border-2 border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-white leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Host & Collaborate?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join thousands of communities, venues, and brands creating meaningful offline experiences.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-[#6366F1] text-white font-bold py-4 px-8 rounded-lg hover:bg-[#5558E3] transition-colors text-lg uppercase"
          >
            Get Started Now →
          </button>
        </div>
      </section>
    </div>
  );
};

export default HostPartnerPage;