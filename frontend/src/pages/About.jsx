import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Users, Heart, Sparkles, MapPin } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';

function About() {
  const [openFAQ, setOpenFAQ] = useState(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "What is IndulgeOut?",
      answer: "A unique platform designed to connect people with similar interests and help them create real-world experiences together."
    },
    {
      question: "Who can use IndulgeOut?",
      answer: "Anyone looking to meet like-minded people and engage in activities they're passionate about."
    },
    {
      question: "Where is IndulgeOut launching?",
      answer: "IndulgeOut is kicking off in select cities to bring communities together and create unforgettable real-world experiences. Stay tuned to find out if your city is on the list! (Don't worry if we're not in your city yet—more cities are coming soon)"
    },
    {
      question: "How is IndulgeOut different from other mainstream platforms?",
      answer: "IndulgeOut goes beyond the usual movies, music concerts, or stand-up shows. Unlike mere ticketing platforms or event planning tools, it empowers you to discover people who share your rarest passions, foster thriving communities, and bring those interests to life through everlasting life experiences."
    },
    {
      question: "Why do I need IndulgeOut—can't I create my community on my own?",
      answer: "Of course, you can! But building a community requires time, effort, and the right tools. IndulgeOut connects you with like-minded people, offering a platform to promote your passions, organize events, find suitable venues, share updates, and discover real-world experiences that resonate with your community—all in one place. It's designed to help your community grow faster and more seamlessly, so you can focus on doing what you love while we handle the rest."
    },
    {
      question: "How do I find people with similar interests?",
      answer: "Simply sign up, browse through various communities or events, and connect with people who share your passions."
    },
    {
      question: "Can I find people for niche activities?",
      answer: "Absolutely! IndulgeOut is all about niche interests—whether you're into obscure movie marathons, rap cyphers, or wellness support groups, you'll find a community waiting to connect."
    },
    {
      question: "How do I build my own community on IndulgeOut?",
      answer: "It's simple! Start by creating a group or event around your passion. Share engaging content, post updates about upcoming events, and put up highlights from past gatherings. IndulgeOut enables you to promote your community, attract the right audience, and grow it organically while bringing your passion to life."
    },
    {
      question: "How do I join events on IndulgeOut?",
      answer: "After signing up, you can browse through upcoming events, RSVP, and get all the details for events happening near you."
    },
    {
      question: "Are events free or paid?",
      answer: "It depends on the event! Some are free, while others may have a fee for participation, which will be clearly mentioned in the event details."
    },
    {
      question: "Can I host my own events on IndulgeOut?",
      answer: "Of course! IndulgeOut gives you the freedom to create and host events around any interest or hobby. You can fully customize your event—choose the type, location, size, and format without any restrictions. Whether it's a cozy book club, a lively trivia night, a fun paint and sip session, or an exciting cooking class, you're in charge of bringing your vision to life."
    },
    {
      question: "How do I create an event?",
      answer: "Creating an event is super easy! Sign up, go to the \"Create Events\" section, select your event type, and fill in the details like date, time, and location. Once done, invite others to join and turn your passion into reality!"
    },
    {
      question: "Can I book venues for my community gatherings on IndulgeOut?",
      answer: "Yes! You can discover and book venues that are a perfect fit for the interests and hobbies you enjoy with your community."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24">
            <div className="flex items-center">
              <Link to="/" className="hover:opacity-80 transition-opacity">
                <img src="/images/indulgeout-logo.png" alt="IndulgeOut" className="h-16 sm:h-20 w-auto" />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link
                to="/login"
                className="hidden sm:block text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* About IndulgeOut - How We Stand Out */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent mb-4 sm:mb-6">
              About IndulgeOut
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 font-medium max-w-4xl mx-auto">
              Where Real Connections Replace Empty Scrolls
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
            {/* Card 1: Beyond Social Media */}
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-primary-600 rounded-full p-2 sm:p-3">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  Beyond the Scroll
                </h3>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                While traditional social media keeps you glued to screens, IndulgeOut gets you off your phone and into real experiences. 
                No more passive scrolling through curated feeds—we're about creating actual memories with real people who share your passions.
              </p>
            </div>

            {/* Card 2: Niche Communities */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-purple-600 rounded-full p-2 sm:p-3">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  Your Niche, Your Tribe
                </h3>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Forget generic interest groups. Love snooker? Custom hiking trails? Obscure indie films? We celebrate the unique, 
                the overlooked, the passions that mainstream platforms ignore. Your weird is our wonderful.
              </p>
            </div>

            {/* Card 3: Real World Experiences */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-blue-600 rounded-full p-2 sm:p-3">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  From Digital to Physical
                </h3>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                We're not just another event ticketing platform. IndulgeOut helps you discover, create, and participate in experiences 
                that bring communities together. It's about transforming online connections into real-world friendships.
              </p>
            </div>

            {/* Card 4: Community Empowerment */}
            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-green-600 rounded-full p-2 sm:p-3">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  You're in Control
                </h3>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Unlike platforms that dictate what you see, IndulgeOut puts you in the driver's seat. Host your own events, 
                build your community, find your venues—all the tools you need to turn your passion into a thriving tribe.
              </p>
            </div>
          </div>

          {/* Key Differentiator Statement */}
          <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 text-center shadow-2xl">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white font-semibold leading-relaxed">
              IndulgeOut isn't about likes, followers, or viral moments. <br className="hidden sm:block" />
              <span className="font-bold">It's about human connection in a digital age.</span>
            </p>
          </div>
        </div>

        {/* What Does Our App Offer Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-teal-800 dark:text-teal-400 mb-4 sm:mb-6">
            What does our app offer?
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 italic max-w-4xl mx-auto">
            A one-of-a-kind social platform for hobbies and interests that often go unserved.
          </p>
        </div>

        {/* Value Propositions */}
        <div className="space-y-8 sm:space-y-12 mb-12 sm:mb-16">
          {/* Find Your Tribe */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border-2 border-teal-600 dark:border-teal-500 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl sm:text-3xl font-bold text-teal-700 dark:text-teal-400 mb-3 sm:mb-4">
              Find Your Tribe
            </h2>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Connect with people and communities who share your passions—whether it's bonding at watch parties, 
              jamming with fellow musicians, or teaming up for thrilling gaming sessions.
            </p>
          </div>

          {/* Meet the Tribe, Enjoy the Vibe */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border-2 border-teal-600 dark:border-teal-500 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl sm:text-3xl font-bold text-teal-700 dark:text-teal-400 mb-3 sm:mb-4">
              Meet the Tribe, Enjoy the Vibe
            </h2>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Discover communities and join events you love but lack access to, from battling at trivia nights to 
              unwinding through therapeutic art workshops.
            </p>
          </div>

          {/* Create Your Own Tribe, Create Your Own Vibe */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border-2 border-teal-600 dark:border-teal-500 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl sm:text-3xl font-bold text-teal-700 dark:text-teal-400 mb-3 sm:mb-4">
              Create Your Own Tribe, Create Your Own Vibe
            </h2>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Bring your ideas to life—host unique events, unite those who share your passion, and build a 
              community your way!
            </p>
          </div>
        </div>

        {/* Showrunners Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border-2 border-teal-600 dark:border-teal-500 shadow-lg hover:shadow-xl transition-all duration-300 mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-teal-800 dark:text-teal-400 mb-4 sm:mb-6 text-center">
            Meet the IndulgeOut showrunners
          </h2>
          <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed text-center max-w-4xl mx-auto">
            After moving to different cities, Aditya and Ajay grew frustrated by the challenge of finding people who 
            shared their passions. Whether it was Aditya's love for custom hikes and snooker nights or Ajay's 
            passion for quizzing and running, they often found themselves alone in their interests. This frustration 
            led them to create IndulgeOut!
          </p>
        </div>

        {/* FAQs Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border-2 border-teal-600 dark:border-teal-500 shadow-lg hover:shadow-xl transition-all duration-300">
          <h2 className="text-3xl sm:text-4xl font-bold text-teal-800 dark:text-teal-400 mb-6 sm:mb-8 text-center">
            Know More About Us
          </h2>
          <h3 className="text-xl sm:text-2xl font-semibold text-teal-700 dark:text-teal-400 mb-4 sm:mb-6 flex items-center justify-center gap-2">
            Frequently Asked Questions
            <ChevronDown className="w-6 h-6" />
          </h3>
          
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden transition-all duration-300 border border-gray-200 dark:border-gray-600"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-base sm:text-lg font-medium text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  )}
                </button>
                
                {openFAQ === index && (
                  <div className="px-4 sm:px-6 pb-3 sm:pb-4 pt-2 bg-white dark:bg-gray-800">
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
