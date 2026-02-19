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
      buttonLink: "/signup/host",
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
      buttonLink: "/signup/venue",
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
      buttonText: "Market Your Product",
      buttonLink: "/signup/brand",
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
      question: "Who can host an event?",
      answer: "A community owner, event curator, event organiser, brand, venue or any individual who would like to host interest/hobby-led events."
    },
    {
      question: "Can venues and brands host events?",
      answer: "Yes, even venues and brands can host events. You'll need a separate account to list events."
    },
    {
      question: "Do I need a big community to host events?",
      answer: "No, whether you're established or just starting a community, the platform is completely supportive of every event organiser."
    },
    {
      question: "Is there any fee to host events?",
      answer: "No, list all your events- free or ticketed without any listing fee."
    },
    {
      question: "What kind of brand collaborations are available?",
      answer: "Each brand specifies the kind of collaboration based on their objective- product trials, giveaways, sales, stall setup etc."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <NavigationBar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Choose who you are
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-12">
            A dedicated space for seamless offline experience collaborations.
          </p>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
                  <p className="text-xs font-semibold mb-2" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PERFECT FOR:</p>
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
                  <p className="text-xs font-semibold mb-3" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>WHAT YOU CAN DO:</p>
                  <ul className="space-y-2">
                    {role.whatYouCanDo.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start">
                        <span className="mr-2" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => navigate(role.buttonLink)}
                  className="w-full text-white px-6 py-3 rounded-lg text-base font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl uppercase mt-auto"
                  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                >
                  {role.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How it works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 hover:scale-105 transition-transform duration-300 border border-gray-700 w-full relative min-h-[320px] flex flex-col justify-between">
                  {/* Icon */}
                  <div className="bg-[#6366F1] w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes IndulgeOut Different */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What makes IndulgeOut different
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden h-[500px]">
              <img
                src="/images/BackgroundLogin.jpg"
                alt="Event collaboration"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
            </div>

            {/* Feature Cards */}
            <div className="w-full lg:max-w-lg mx-auto lg:mx-0">
              <div className="flex flex-col gap-6">
                {differentiators.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl px-6 py-6 bg-zinc-900 text-white shadow-[0_25px_55px_rgba(0,0,0,0.35)] border border-white/10 hover:-translate-y-1 transition-transform duration-300"
                  >
                    <h3 className="text-lg font-bold text-[#7163FF] tracking-wide mb-3 uppercase">{item.title}</h3>
                    <p className="text-sm text-white leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-12">
            <button
              onClick={() => navigate('/about')}
              className="inline-flex items-center justify-center w-full sm:w-auto px-12 py-3 rounded-md text-base font-semibold uppercase tracking-wide text-white shadow-[0_20px_35px_rgba(86,93,255,0.35)] hover:scale-[1.02] hover:shadow-[0_30px_65px_rgba(86,93,255,0.35)] transition-all duration-300"
              style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
            >
              Read More
            </button>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked
          </h2>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            <span className="text-[#6366F1] italic">Questions</span>
          </h2>

          <div className="space-y-4 mt-8">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-xl overflow-hidden ${
                  openFaq === index
                    ? 'border-0'
                    : 'bg-transparent border-2 border-white/20'
                }`}
                style={{
                  background: openFaq === index ? 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' : 'transparent'
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0" style={{ color: openFaq === index ? 'white' : 'currentColor' }} />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: openFaq === index ? 'white' : 'currentColor' }} />
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
            onClick={() => navigate('/signup/host')}
            className="text-white px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl uppercase"
            style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
          >
            Get Started Now →
          </button>
        </div>
      </section>
    </div>
  );
};

export default HostPartnerPage;