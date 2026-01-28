import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Calendar, MapPin, Heart, Star, ArrowRight, ChevronLeft, ChevronRight, Play, Sparkles, TrendingUp, Zap } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';
import NavigationBar from '../components/NavigationBar';

function Homepage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [typewriterText, setTypewriterText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [secondLineText, setSecondLineText] = useState('');
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [photoSlideIndex, setPhotoSlideIndex] = useState(0);
  const [currentMiddleTestimonial, setCurrentMiddleTestimonial] = useState(0);
  const [currentPartnerCard, setCurrentPartnerCard] = useState(0);
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  
  const typewriterWords = ['Find Your Tribe,'];
  const secondLineWords = 'Live Your Passions';
  const currentWord = typewriterWords[currentWordIndex];

  // Middle card testimonials
  const middleTestimonials = [
    {
      text: "This is crazy. This is crazy, you should see it for yourself!",
      author: "Shubham Banerjee"
    },
    {
      text: "The best part was, it's not centered around alcohol and the games were quite fun.",
      author: "Jay Gohel"
    },
    {
      text: "You guys have set the vibe!",
      author: "Charvi Patni"
    },
    {
      text: "It was completely different from my normal junkie life. We should have more of these social circles.",
      author: "Esha Parekh"
    },
    {
      text: "Keep organising such things, we'll keep coming back.",
      author: "Anusha"
    }
  ];

  // Partner cards content
  const partnerCards = [
    {
      title: "Start Something You Love",
      description: "Every great community starts with one idea. Whether it's art, wellness, learning, or just meeting like-minded people, create a space where connections grow naturally. Share your vision, and we'll help you make it real.",
      buttonText: "Explore the event",
      buttonAction: () => navigate('/explore'),
      image: "/images/Media (5).jpg"
    },
    {
      title: "Start Something You Love",
      description: "If you're a community host who loves bringing people together, we help you list your community & events, access relevant brand and venue partners to enhance your experiences for your attendees.",
      buttonText: "Create Now",
      buttonAction: () => navigate('/register?role=community_organizer'),
      image: "/images/Media (5).jpg"
    },
    {
      title: "Collaborate as a Brand",
      description: "If you’re a brand owner with a product or service offering, we help you with experiential marketing, sales and trials through community led events and meetups.",
      buttonText: "Collaborate Now",
      buttonAction: () => navigate('/register?role=brand'),
      image: "/images/brand.jpg"
    },
    {
      title: "Partner as a Venue",
      description: "If you have a restaurant, cafe or a space that is open for community led events, we’ll help you with access these curated experiences hosted by communities to bring newer audience and additional revenue.",
      buttonText: "Partner Now",
      buttonAction: () => navigate('/register?role=venue'),
      image: "/images/venue.jpg"
    }
  ];

  // Instagram posts array for social footprint
  const instagramPosts = [
    {
      url: 'https://www.instagram.com/reel/DJmHRyWPrBN/',
      thumbnail: '/images/Media (4).jpg',
      type: 'reel'
    },
    {
      url: 'https://www.instagram.com/reel/DRR6F4mDwOS/',
      thumbnail: '/images/Media (5).jpg',
      type: 'reel'
    },
    {
      url: 'https://www.instagram.com/reel/DS7SzCVj5Rb/',
      thumbnail: '/images/Media (6).jpg',
      type: 'reel'
    },
    {
      url: 'https://www.instagram.com/reel/DNK-U2bPhw4/',
      thumbnail: '/images/Media (7).jpg',
      type: 'reel'
    },
    {
      url: 'https://www.instagram.com/reel/DNalF_4v-QB/',
      thumbnail: '/images/Media (8).jpg',
      type: 'reel'
    },
    {
      url: 'https://www.instagram.com/reel/DOvqdnzDxgd/',
      thumbnail: '/images/Media (9).jpg',
      type: 'reel'
    },
    {
      url: 'https://www.instagram.com/reel/DRW_ZZOj_b7/',
      thumbnail: '/images/Media (10).jpg',
      type: 'reel'
    },
    {
      url: 'https://www.instagram.com/reel/DNfjYlWv6TH/',
      thumbnail: '/images/Media (11).jpg',
      type: 'reel'
    },
    {
      url: 'https://www.instagram.com/reel/DQtq0DaD8mD/',
      thumbnail: '/images/Media (12).jpg',
      type: 'reel'
    },
    {
      url: 'https://www.instagram.com/p/DQUHWnZj3Rb/',
      thumbnail: '/images/Media (13).jpg',
      type: 'post'
    }
  ];

  // Hobby icons and their connection animations
  const hobbies = [
    { icon: '🏔️', name: 'Mountain Climbing', angle: 0, color: 'from-blue-400 to-indigo-600' },
    { icon: '🍸', name: 'Drinks', angle: 45, color: 'from-pink-400 to-purple-600' },
    { icon: '☕', name: 'Cafe Hopping', angle: 90, color: 'from-amber-400 to-orange-600' },
    { icon: '🎵', name: 'Music', angle: 135, color: 'from-green-400 to-teal-600' },
    { icon: '🏺', name: 'Pottery', angle: 180, color: 'from-red-400 to-pink-600' },
    { icon: '🧘', name: 'Yoga', angle: 225, color: 'from-purple-400 to-indigo-600' },
    { icon: '💪', name: 'Gym', angle: 270, color: 'from-orange-400 to-red-600' },
    { icon: '📚', name: 'Books', angle: 315, color: 'from-cyan-400 to-blue-600' }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Typewriter effect for hero text
  useEffect(() => {
    let timeout;
    
    if (!showSecondLine && typewriterText.length < currentWord.length) {
      timeout = setTimeout(() => {
        setTypewriterText(currentWord.slice(0, typewriterText.length + 1));
      }, 100);
    } else if (!showSecondLine && typewriterText.length === currentWord.length) {
      timeout = setTimeout(() => {
        setShowSecondLine(true);
      }, 1000);
    }
    
    return () => clearTimeout(timeout);
  }, [typewriterText, currentWord, showSecondLine]);

  // Second line typewriter effect
  useEffect(() => {
    let timeout;
    
    if (showSecondLine && secondLineText.length < secondLineWords.length) {
      timeout = setTimeout(() => {
        setSecondLineText(secondLineWords.slice(0, secondLineText.length + 1));
      }, 80); // Faster typing for more dramatic effect
    }
    
    return () => clearTimeout(timeout);
  }, [secondLineText, showSecondLine]);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate middle card testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMiddleTestimonial((prev) => (prev + 1) % middleTestimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate partner cards every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPartnerCard((prev) => (prev + 1) % partnerCards.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animation phase controller for hobby connections
  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(phaseInterval);
  }, []);

  // Auto-rotate poster cards every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPosterIndex((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Function to render animated letters
  const renderAnimatedText = (text, baseDelay = 0) => {
    return text.split('').map((char, index) => (
      <span
        key={index}
        className="letter-animate"
        style={{
          animationDelay: `${baseDelay + index * 0.08}s`
        }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  // Auto-slide testimonials
  useEffect(() => {
    if (!isAutoSliding) return;
    
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => 
        prev === testimonials.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoSliding]);

  const nextTestimonial = () => {
    setIsAutoSliding(false);
    setCurrentTestimonial((prev) => 
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
    setTimeout(() => setIsAutoSliding(true), 8000);
  };

  const prevTestimonial = () => {
    setIsAutoSliding(false);
    setCurrentTestimonial((prev) => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
    setTimeout(() => setIsAutoSliding(true), 8000);
  };

  const stats = [
    { number: '10,000+', label: 'Community Members' },
    { number: '50+', label: 'Interest Categories' },
    { number: '500+', label: 'Events Monthly' },
  ]

  const interests = [
    {
      name: 'Sip & Savor',
      description: 'Food tastings, cooking classes, wine events',
      color: 'bg-gradient-to-br from-orange-400 to-red-500',
      icon: '🍷'
    },
    {
      name: 'Sweat & Play',
      description: 'Sports, fitness, outdoor activities',
      color: 'bg-gradient-to-br from-blue-400 to-purple-500',
      icon: '⚽'
    },
    {
      name: 'Art & DIY',
      description: 'Creative workshops, crafting, painting',
      color: 'bg-gradient-to-br from-pink-400 to-purple-500',
      icon: '🎨'
    },
    {
      name: 'Social Mixers',
      description: 'Networking, meetups, social events',
      color: 'bg-gradient-to-br from-green-400 to-teal-500',
      icon: '🤝'
    },
    {
      name: 'Adventure & Outdoors',
      description: 'Hiking, camping, nature exploration',
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      icon: '🏕️'
    },
    {
      name: 'Epic Screenings',
      description: 'Movie nights, film discussions',
      color: 'bg-gradient-to-br from-indigo-400 to-blue-600',
      icon: '🎬'
    }
  ]

  const testimonials = [
    {
      name: 'Akansha',
      text: 'I think what I found was a community of people. They\'re not just people who I meet in the book club itself. They\'re people who\'ve become my friends.',
      interest: 'Nerdy Noveliers Club',
      videoUrl: 'https://www.youtube.com/embed/uT3Quuy_5-o',
      videoThumb: 'https://img.youtube.com/vi/uT3Quuy_5-o/maxresdefault.jpg',
      initial: 'A',
      color: 'from-red-400 to-pink-500'
    },
    {
      name: 'Nishant',
      text: 'The great thing about IndulgeOut is that it doesn\'t have an outcome orientation, people just come for the love of the experience.',
      interest: 'Music Club',
      videoUrl: 'https://www.youtube.com/embed/t62ExT2n4a0',
      videoThumb: 'https://img.youtube.com/vi/t62ExT2n4a0/maxresdefault.jpg',
      initial: 'N',
      color: 'from-teal-500 to-emerald-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Custom CSS for additional animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Serif+Pro:wght@400;600;700&display=swap');
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes float3D {
          0%, 100% {
            transform: translateY(0px) rotateY(0deg) rotateX(0deg);
          }
          25% {
            transform: translateY(-15px) rotateY(5deg) rotateX(2deg);
          }
          50% {
            transform: translateY(-25px) rotateY(-3deg) rotateX(-1deg);
          }
          75% {
            transform: translateY(-10px) rotateY(2deg) rotateX(1deg);
          }
        }
        
        @keyframes rotateY {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(360deg);
          }
        }
        
        @keyframes morphBubble {
          0%, 100% {
            border-radius: 50%;
            transform: scale(1) rotate(0deg);
          }
          25% {
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
            transform: scale(1.1) rotate(90deg);
          }
          50% {
            border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
            transform: scale(0.9) rotate(180deg);
          }
          75% {
            border-radius: 40% 60% 60% 40% / 60% 40% 60% 40%;
            transform: scale(1.05) rotate(270deg);
          }
        }
        
        @keyframes slideInRotate {
          0% {
            opacity: 0;
            transform: translateX(-100px) rotate(-180deg) scale(0.5);
          }
          50% {
            opacity: 0.7;
            transform: translateX(0) rotate(0deg) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
        }
        
        @keyframes textGlow {
          0%, 100% {
            text-shadow: 
              0 0 5px rgba(34, 197, 94, 0.3),
              0 0 10px rgba(34, 197, 94, 0.2),
              0 0 15px rgba(34, 197, 94, 0.1),
              0 0 20px rgba(255, 255, 255, 0.1);
          }
          50% {
            text-shadow: 
              0 0 10px rgba(34, 197, 94, 0.6),
              0 0 20px rgba(34, 197, 94, 0.4),
              0 0 30px rgba(34, 197, 94, 0.3),
              0 0 40px rgba(255, 255, 255, 0.2);
          }
        }
        
        @keyframes textGlowSecondary {
          0%, 100% {
            text-shadow: 
              0 0 5px rgba(255, 255, 255, 0.4),
              0 0 10px rgba(34, 197, 94, 0.3),
              0 0 15px rgba(34, 197, 94, 0.2);
          }
          50% {
            text-shadow: 
              0 0 10px rgba(255, 255, 255, 0.7),
              0 0 20px rgba(34, 197, 94, 0.5),
              0 0 30px rgba(34, 197, 94, 0.3);
          }
        }
        
        @keyframes perspective3D {
          0%, 100% {
            transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
          }
          25% {
            transform: perspective(1000px) rotateX(5deg) rotateY(5deg);
          }
          50% {
            transform: perspective(1000px) rotateX(0deg) rotateY(10deg);
          }
          75% {
            transform: perspective(1000px) rotateX(-5deg) rotateY(5deg);
          }
        }
        
        .floating-element {
          animation: float 3s ease-in-out infinite;
        }
        
        .floating-3d {
          animation: float3D 4s ease-in-out infinite;
        }
        
        .morph-bubble {
          animation: morphBubble 6s ease-in-out infinite;
        }
        
        .rotate-y {
          animation: rotateY 20s linear infinite;
        }
        
        .slide-in-rotate {
          animation: slideInRotate 1.5s ease-out;
        }
        
        .text-glow {
          animation: textGlow 3s ease-in-out infinite;
        }
        
        .text-glow-secondary {
          animation: textGlowSecondary 2.5s ease-in-out infinite;
        }
        
        @keyframes cardHoverBounce {
          0%, 100% {
            transform: translateY(0) scale(1) rotateY(0deg);
          }
          25% {
            transform: translateY(-5px) scale(1.02) rotateY(2deg);
          }
          50% {
            transform: translateY(-8px) scale(1.05) rotateY(0deg);
          }
          75% {
            transform: translateY(-3px) scale(1.03) rotateY(-2deg);
          }
        }
        
        @keyframes iconPulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 5px rgba(34, 197, 94, 0.3));
          }
          50% {
            transform: scale(1.2) rotate(5deg);
            filter: drop-shadow(0 0 15px rgba(34, 197, 94, 0.6));
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .card-hover-effect:hover {
          animation: cardHoverBounce 0.6s ease-out;
        }
        
        .icon-pulse-effect:hover {
          animation: iconPulse 0.8s ease-in-out;
        }
        
        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes orbitalMove {
          0% {
            transform: rotate(0deg) translateX(200px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(200px) rotate(-360deg);
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 25px rgba(34, 197, 94, 0.6);
            transform: scale(1.1);
          }
        }
        
        @keyframes connectionLine {
          0% {
            stroke-dasharray: 0 200;
          }
          50% {
            stroke-dasharray: 100 200;
          }
          100% {
            stroke-dasharray: 200 200;
          }
        }
        
        @keyframes hobbyFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-15px) scale(1.05);
          }
        }
        
        @keyframes centerPulse {
          0%, 100% {
            transform: scale(1);
            background: linear-gradient(135deg, #22c55e, #16a34a);
          }
          50% {
            transform: scale(1.2);
            background: linear-gradient(135deg, #34d399, #22c55e);
          }
        }
        
        .hobby-orbital {
          animation: orbitalMove 15s linear infinite;
        }
        
        .hobby-float {
          animation: hobbyFloat 3s ease-in-out infinite;
        }
        
        .center-pulse {
          animation: centerPulse 2s ease-in-out infinite;
        }
        
        .connection-line {
          animation: connectionLine 2s ease-in-out infinite;
        }
        
        .perspective-3d {
          animation: perspective3D 8s ease-in-out infinite;
        }
        
        .gradient-shift {
          background: linear-gradient(-45deg, #ee7724, #d8363a, #dd3675, #b44593);
          background-size: 400% 400%;
          animation: gradientShift 4s ease infinite;
        }
        
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        @keyframes letterPop {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes letterGlow {
          0% {
            text-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
          }
          50% {
            text-shadow: 0 0 15px rgba(34, 197, 94, 0.8), 0 0 25px rgba(34, 197, 94, 0.5);
          }
          100% {
            text-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
          }
        }
        
        .letter-animate {
          display: inline-block;
          animation: letterPop 0.4s ease-out forwards, letterGlow 0.6s ease-out 0.2s;
        }
        
        .typewriter-cursor {
          opacity: 1;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.6s;
        }
        
        .card-3d:hover {
          transform: rotateY(10deg) rotateX(10deg) scale(1.05);
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Navigation */}
      <NavigationBar />

      {/* Hero Section - Full Screen Video */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/placeholder.png"
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          {/* Cloudinary optimized video - auto quality and format */}
          <source src="https://res.cloudinary.com/dtxgkrfdn/video/upload/q_auto:best,f_auto/v1768809157/Website_Video_tdrkqe.mp4" type="video/mp4" />
          {/* Direct Cloudinary MP4 fallback */}
          <source src="https://res.cloudinary.com/dtxgkrfdn/video/upload/v1768809157/Website_Video_tdrkqe.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* CTA Overlay - Updated Text Only */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>
            YOUR GO-TO FOR<br /><span style={{ color: '#5656D3' }}>OFFLINE EXPERIENCES</span>
          </h1>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
          <div className="text-white text-sm font-semibold">SCROLL</div>
          <div className="w-6 h-10 border-2 border-white rounded-full mx-auto mt-2 flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
              py-20 bg-zinc-900 dark:bg-zinc-900 relative overflow-hidden
      {/* Stats Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20 bg-zinc-900 dark:bg-zinc-900 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Stat 1 */}
              <div className="text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#5656D3' }}>
                  5000+
                </div>
                <div className="text-base text-gray-300 font-medium">Community Members</div>
              </div>
              
              {/* Stat 2 */}
              <div className="text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#5656D3' }}>
                  10+
                </div>
                <div className="text-base text-gray-300 font-medium">Hobbies</div>
              </div>
              
              {/* Stat 3 */}
              <div className="text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#5656D3' }}>
                  4.8+
                </div>
                <div className="text-base text-gray-300 font-medium">Average Experience Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vox Pop Testimonials Section */}
      <section className="py-20 bg-zinc-900 dark:bg-zinc-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
              Our Vox pops and<br />customer testimonials
            </h2>
            <p className="text-xl text-gray-400" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              Hold on, stay and watch this because you'll for sure love it. No bragging, it's honestly super candid, fun and heart-warming!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Vox Pop 1 */}
            <div 
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl cursor-pointer"
              onClick={() => {
                setCurrentVideoUrl('https://www.youtube.com/embed/uT3Quuy_5-o?autoplay=1&rel=1');
                setVideoModalOpen(true);
              }}
            >
              <img 
                src="https://img.youtube.com/vi/uT3Quuy_5-o/maxresdefault.jpg"
                alt="Vox Pop 1"
                className="w-full h-full object-cover"
              />
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 text-white ml-1" fill="currentColor" />
                </div>
              </div>
            </div>

            {/* Text Card - Moved to Middle with Animation */}
            <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
              {/* Background Image */}
              <img 
                src="/images/Media (5).jpg"
                alt="Community Event"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Gradient Overlay - Light by default, full on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/20 via-indigo-600/30 to-indigo-700/40 group-hover:bg-indigo-600 transition-all duration-500"></div>
              
              {/* Quote Icon - Top Left */}
              <div className="absolute top-4 left-4 text-white/40 text-5xl font-serif">"</div>
              
              {/* Content - Always Visible with Transition */}
              <div className="relative h-full p-6 flex flex-col justify-between items-center text-center">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-6 transition-opacity duration-700">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current inline-block" />
                    ))}
                  </div>
                  <blockquote className="text-white text-lg font-bold mb-6 leading-relaxed italic px-2 drop-shadow-lg transition-opacity duration-700">
                    "{middleTestimonials[currentMiddleTestimonial].text}"
                  </blockquote>
                  <p className="text-white text-sm font-medium drop-shadow-md transition-opacity duration-700">
                    ~ {middleTestimonials[currentMiddleTestimonial].author}
                  </p>
                </div>
                
                {/* VIEW ALL Button at Bottom */}
                <button
                  onClick={() => navigate('/explore')}
                  className="text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:opacity-90 text-sm shadow-lg"
                  style={{ background: 'linear-gradient(180deg, #7878E9 0%, #7878E9 75%, #3D3DD4 100%)' }}
                >
                  VIEW ALL
                </button>
              </div>
            </div>

            {/* Vox Pop 2 */}
            <div 
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl cursor-pointer"
              onClick={() => {
                setCurrentVideoUrl('https://www.youtube.com/embed/t62ExT2n4a0?autoplay=1&rel=1');
                setVideoModalOpen(true);
              }}
            >
              <img 
                src="https://img.youtube.com/vi/t62ExT2n4a0/maxresdefault.jpg"
                alt="Vox Pop 2"
                className="w-full h-full object-cover"
              />
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 text-white ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Looking For Events In Your City - Carousel Section */}
      <section className="py-16 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
              Looking For Events In Your City?
            </h2>
            <p className="text-gray-300 text-base max-w-3xl mx-auto" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              Explore hand-picked, curated offline meetups, experiences and events that will bring you closer to your kind of circle.
            </p>
          </div>
          
          {/* Deck of Cards Carousel */}
          <div className="relative h-[240px] sm:h-[300px] lg:h-[320px] flex items-center justify-center mt-8">
            <div className="relative w-full max-w-7xl h-full flex items-center justify-center">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const position = (index - currentPosterIndex + 6) % 6;
                
                // Calculate position and rotation for deck effect
                let zIndex, scale, translateX, translateY, rotate, opacity;
                
                // Mobile responsiveness
                const isMobile = window.innerWidth < 640;
                const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
                
                if (position === 0) {
                  // Front card - fully visible, largest
                  zIndex = 40;
                  scale = isMobile ? 0.7 : (isTablet ? 0.8 : 0.9);
                  translateX = isMobile ? -100 : (isTablet ? -220 : -380);
                  translateY = 0;
                  rotate = -12;
                  opacity = 1;
                } else if (position === 1) {
                  zIndex = 35;
                  scale = isMobile ? 0.65 : (isTablet ? 0.75 : 0.85);
                  translateX = isMobile ? -60 : (isTablet ? -140 : -240);
                  translateY = isMobile ? 8 : (isTablet ? 10 : 12);
                  rotate = -8;
                  opacity = 0.9;
                } else if (position === 2) {
                  zIndex = 30;
                  scale = isMobile ? 0.6 : (isTablet ? 0.7 : 0.8);
                  translateX = isMobile ? -20 : (isTablet ? -60 : -100);
                  translateY = isMobile ? 16 : (isTablet ? 20 : 24);
                  rotate = -4;
                  opacity = 0.85;
                } else if (position === 3) {
                  zIndex = 25;
                  scale = isMobile ? 0.55 : (isTablet ? 0.65 : 0.75);
                  translateX = isMobile ? 20 : (isTablet ? 60 : 100);
                  translateY = isMobile ? 20 : (isTablet ? 25 : 30);
                  rotate = 4;
                  opacity = isMobile ? 0.7 : 0.8;
                } else if (position === 4) {
                  zIndex = 20;
                  scale = isMobile ? 0.5 : (isTablet ? 0.6 : 0.7);
                  translateX = isMobile ? 60 : (isTablet ? 140 : 240);
                  translateY = isMobile ? 24 : (isTablet ? 30 : 36);
                  rotate = 8;
                  opacity = isMobile ? 0.6 : 0.75;
                } else {
                  // Last card - moving to back
                  zIndex = 15;
                  scale = isMobile ? 0.45 : (isTablet ? 0.55 : 0.65);
                  translateX = isMobile ? 100 : (isTablet ? 220 : 380);
                  translateY = isMobile ? 28 : (isTablet ? 35 : 42);
                  rotate = 12;
                  opacity = isMobile ? 0.5 : 0.7;
                }
                
                return (
                  <div
                    key={index}
                    className="absolute transition-all duration-1000 ease-in-out"
                    style={{
                      zIndex,
                      transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
                      opacity,
                      left: '50%',
                      top: '50%',
                      marginLeft: isMobile ? '-85px' : (isTablet ? '-100px' : '-115px'),
                      marginTop: isMobile ? '-120px' : (isTablet ? '-140px' : '-155px')
                    }}
                  >
                    <div className="w-[170px] sm:w-[200px] lg:w-[230px] h-[240px] sm:w-[280px] lg:h-[320px] bg-white rounded-lg shadow-2xl overflow-hidden">
                      <img 
                        src={`/images/postercard${index + 1}.jpg`} 
                        alt={`Event poster ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explore Now Button */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/explore')}
              className="text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
              style={{ background: 'linear-gradient(180deg, #7878E9 0%, #7878E9 75%, #3D3DD4 100%)' }}
            >
              EXPLORE NOW
            </button>
          </div>
        </div>
      </section>

      {/* Partner With Us Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6" style={{ fontFamily: 'Oswald, sans-serif' }}>
              PARTNER WITH US
            </h2>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto px-4" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              A dedicated space for all communities, venues and brands to collaborate for collective community building and experiential marketing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Side - Orbital Animation */}
            <div className="relative flex items-center justify-center h-[400px] sm:h-[500px] lg:h-[600px]">
              {/* Central IndulgeOut Logo */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full bg-black flex items-center justify-center shadow-2xl p-2 sm:p-3 lg:p-4">
                  <img 
                    src="public/images/indulgeout-logo.png"
                    alt="IndulgeOut Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              {/* Orbiting Icons with Images and Text Inside Circles */}
              {[
                { 
                  label: 'Want to list your venue?', 
                  icon: '📍',
                  bgImage: '/images/Media (6).jpg',
                  delay: '0s'
                },
                { 
                  label: 'List your brand as collaborator?', 
                  icon: '👥',
                  bgImage: '/images/Media (7).jpg',
                  delay: '8.33s'
                },
                { 
                  label: 'Want to list your events?', 
                  icon: '✨',
                  bgImage: '/images/Media (5).jpg',
                  delay: '16.67s'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    animation: `orbitalMove 25s linear infinite`,
                    animationDelay: item.delay
                  }}
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden shadow-2xl">
                    {/* Background Image */}
                    <img 
                      src={item.bgImage} 
                      alt={item.label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Dark Overlay with reduced opacity */}
                    <div className="absolute inset-0 bg-black/30"></div>
                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-1.5 sm:p-2 text-center">
                      <div className="text-xl sm:text-2xl lg:text-3xl mb-0.5 sm:mb-1">{item.icon}</div>
                      <p className="text-white text-[9px] sm:text-[10px] font-semibold leading-tight drop-shadow-lg">
                        {item.label}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side - Single Auto-Rotating Card */}
            <div className="relative flex items-center justify-center mt-8 lg:mt-0">
              <div className="w-full max-w-sm lg:max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-700">
                <div className="p-6">
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-4 overflow-hidden">
                    <img 
                      src={partnerCards[currentPartnerCard].image} 
                      alt={partnerCards[currentPartnerCard].title}
                      className="w-full h-full object-cover transition-opacity duration-700"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 transition-opacity duration-700" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    {partnerCards[currentPartnerCard].title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed transition-opacity duration-700" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                    {partnerCards[currentPartnerCard].description}
                  </p>
                  <button
                    onClick={partnerCards[currentPartnerCard].buttonAction}
                    className="w-full text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:opacity-90 shadow-lg"
                    style={{ background: 'linear-gradient(180deg, #7878E9 0%, #7878E9 75%, #3D3DD4 100%)' }}
                  >
                    {partnerCards[currentPartnerCard].buttonText}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA Button */}
          <div className="text-center mt-12 lg:mt-20">
            <button
              onClick={() => navigate('/host-partner')}
              className="text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
              style={{ background: 'linear-gradient(180deg, #7878E9 0%, #7878E9 75%, #3D3DD4 100%)' }}
            >
              Explore the event
            </button>
          </div>
        </div>
      </section>

      {/* Social Footprint - Instagram Posts */}
      <section className="py-20 bg-black transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
              Our Social Footprint
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              Follow our journey and community moments on Instagram
            </p>
          </div>

          {/* Instagram Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {instagramPosts.map((post, index) => (
              <a
                key={index}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
              >
                {/* Thumbnail Image */}
                <img 
                  src={post.thumbnail} 
                  alt={`Instagram ${post.type} ${index + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                        <div class="text-center text-white">
                          <svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          <p class="text-sm font-semibold">View on Instagram</p>
                        </div>
                      </div>
                    `;
                  }}
                />
                
                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <p className="text-sm font-semibold">{post.type === 'reel' ? 'Watch Reel' : 'View Post'}</p>
                  </div>
                </div>

                {/* Reel Icon Indicator */}
                {post.type === 'reel' && (
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 rounded-full p-1.5 shadow-lg">
                    <svg className="w-4 h-4 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {videoModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setVideoModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src={currentVideoUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
        </div>
  
  );
}

export default Homepage;