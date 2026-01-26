import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Users, Heart, Sparkles, MapPin, Shield, CheckCircle, ArrowRight, Target, Building2 } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';
import NavigationBar from '../components/NavigationBar';

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
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Navigation */}
      <NavigationBar />

      {/* HERO: WHAT IS INDULGEOUT? */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 pt-24 pb-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
              <Heart className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            IndulgeOut helps people meet offline through shared interests.
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover experiences, build communities, and connect with people who share your passions—all in the real world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/explore"
              className="group px-8 py-4 bg-white text-purple-600 font-bold text-lg rounded-full hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-2"
            >
              Explore Experiences
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/register?role=host"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-full border-2 border-white hover:bg-white/20 transition-all"
            >
              Host an Experience
            </Link>
          </div>
        </div>
      </section>

      {/* THE PROBLEM WE'RE SOLVING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            The Problem We're Solving
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            In Indian cities, it's hard to find people who share your niche interests. You're scrolling endlessly on social media, 
            feeling isolated in your passions, and settling for generic events that don't really excite you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-red-200 dark:border-red-800 hover:shadow-xl transition-all">
            <div className="text-4xl mb-4">😔</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Lonely in Your Passion
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You love indie films, custom hikes, or rap cyphers—but your friends aren't into it. You feel alone in your interests.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-red-200 dark:border-red-800 hover:shadow-xl transition-all">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Stuck on Screens
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Social media keeps you scrolling, not connecting. You're consuming content, not creating experiences.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-red-200 dark:border-red-800 hover:shadow-xl transition-all">
            <div className="text-4xl mb-4">🎟️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Generic Events Only
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ticketing platforms offer movies and concerts, but where are the pottery workshops, boardgame nights, and book clubs?
            </p>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            IndulgeOut bridges the gap between online discovery and offline connection.
          </p>
        </div>
      </section>

      {/* HOW INDULGEOUT WORKS */}
      <section className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How IndulgeOut Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Three simple flows for three types of users.
            </p>
          </div>

          <div className="space-y-16">
            {/* For Users */}
            <div className="bg-white dark:bg-black rounded-2xl p-8 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  For Users
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Choose your interests</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Browse 21+ categories from pottery to rap battles</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Discover curated experiences</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Find events and communities near you</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Show up & connect offline</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Meet real people, make real memories</p>
                  </div>
                </div>
              </div>

              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
              >
                Explore Events
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {/* For Communities & Hosts */}
            <div className="bg-white dark:bg-black rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  For Communities & Hosts
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Create an experience</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Build events around any interest or hobby</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Reach the right audience</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get discovered by people who care</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Build a real-world community</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Turn your passion into a thriving tribe</p>
                  </div>
                </div>
              </div>

              <Link
                to="/register?role=host"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
              >
                Host an Experience
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {/* For Venues & Brands */}
            <div className="bg-white dark:bg-black rounded-2xl p-8 border-2 border-orange-200 dark:border-orange-800 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  For Venues & Brands
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-300 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Partner with experiences</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Connect with curated communities</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-300 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Engage meaningful audiences</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reach people who actually care</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-300 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Create lasting brand moments</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Build authentic connections, not just impressions</p>
                  </div>
                </div>
              </div>

              <Link
                to="/host-partner"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
              >
                Partner with IndulgeOut
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IS INDULGEOUT FOR? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Who is IndulgeOut For?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 hover:shadow-xl transition-all">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              New to the City
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Just moved? Find your people and make friends through shared interests.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 hover:shadow-xl transition-all">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Niche Enthusiasts
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Love pottery, rap, indie films? Connect with your tribe here.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 hover:shadow-xl transition-all">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Community Builders
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Host events, grow communities, and bring people together.
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 hover:shadow-xl transition-all">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Venues & Brands
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Partner with engaged communities and create meaningful moments.
            </p>
          </div>
        </div>
      </section>

      {/* SAFETY, RESPECT & CURATION */}
      <section className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-600 rounded-full">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Safety, Respect & Curation
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Your safety and comfort are our top priorities. We ensure every experience is welcoming and respectful.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-black rounded-xl p-6 flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Verified Hosts & Partners
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All hosts and venue partners are verified to ensure quality and trustworthiness.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-black rounded-xl p-6 flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Curated Event Formats
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Every experience is reviewed to maintain quality and ensure it aligns with community values.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-black rounded-xl p-6 flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Respectful Community Guidelines
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Clear guidelines ensure all interactions are respectful, inclusive, and harassment-free.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-black rounded-xl p-6 flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Zero Tolerance for Misconduct
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Immediate action against any form of harassment, discrimination, or inappropriate behavior.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-center">
            <p className="text-lg text-white font-semibold mb-4">
              Especially important for:
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                👩 Women
              </span>
              <span className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                🌟 First-time Attendees
              </span>
              <span className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                🏙️ New to the City
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            IndulgeOut by the Numbers
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              5,000+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Active Members
            </div>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
              500+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Monthly Experiences
            </div>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
              10+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Cities Active In
            </div>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent mb-2">
              1,200+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Communities Onboarded
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
            <div className="text-4xl text-orange-500 mb-4">"</div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              "Finally, a place where I can find fellow pottery enthusiasts! Made 10+ friends in just 2 months."
            </p>
            <div className="font-semibold text-gray-900 dark:text-white">— Priya, Mumbai</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
            <div className="text-4xl text-orange-500 mb-4">"</div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              "As a host, IndulgeOut helped me grow my book club from 5 to 50 members. The curation is unmatched."
            </p>
            <div className="font-semibold text-gray-900 dark:text-white">— Rahul, Bangalore</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
            <div className="text-4xl text-orange-500 mb-4">"</div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              "Our café saw a 40% increase in footfall after partnering with IndulgeOut communities. Authentic engagement!"
            </p>
            <div className="font-semibold text-gray-900 dark:text-white">— Cafe Owner, Delhi</div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </section>

      {/* FINAL CTAs */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Your IndulgeOut Journey?
          </h2>

          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Whether you're looking to explore, host, or partner—there's a place for you at IndulgeOut.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/explore"
              className="group px-8 py-4 bg-white text-purple-600 font-bold text-lg rounded-full hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-2"
            >
              Explore Experiences
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/register?role=host"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-full border-2 border-white hover:bg-white/20 transition-all"
            >
              Host an Experience
            </Link>

            <Link
              to="/host-partner"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-full border-2 border-white hover:bg-white/20 transition-all"
            >
              Partner with Us
            </Link>
          </div>

          <p className="mt-8 text-white/80 text-sm">
            Join 5,000+ members, 1,200+ communities, and 150+ venues already part of the IndulgeOut family
          </p>
        </div>
      </section>
    </div>
  );
}

export default About;

