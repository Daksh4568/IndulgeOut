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
  
  const typewriterWords = ['Find Your Tribe,'];
  const secondLineWords = 'Live Your Passions';
  const currentWord = typewriterWords[currentWordIndex];

  // Event photos array
  const eventPhotos = [
    '/images/Media (4).jpg',
    '/images/Media (5).jpg',
    '/images/Media (6).jpg',
    '/images/Media (7).jpg',
    '/images/Media (8).jpg',
    '/images/Media (9).jpg',
    '/images/Media (10).jpg',
    '/images/Media (11).jpg',
    '/images/Media (12).jpg',
    '/images/Media (13).jpg',
    '/images/Media (14).jpg',
    '/images/Media (15).jpg'
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

  // Animation phase controller for hobby connections
  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(phaseInterval);
  }, []);

  // Auto-slide photos
  useEffect(() => {
    const photoInterval = setInterval(() => {
      setPhotoSlideIndex(prev => (prev + 1) % (eventPhotos.length - 3));
    }, 3000);
    return () => clearInterval(photoInterval);
  }, [eventPhotos.length]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Custom CSS for additional animations */}
      <style>{`
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
            transform: rotate(0deg) translateX(120px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(120px) rotate(-360deg);
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
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* CTA Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
            Where Passions Come Alive
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8 max-w-3xl drop-shadow-lg">
            Connect with like-minded people through shared experiences
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/login"
              className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-2xl flex items-center"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
          <div className="text-white text-sm font-semibold">SCROLL</div>
          <div className="w-6 h-10 border-2 border-white rounded-full mx-auto mt-2 flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Creative Hobby Connection Animation */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-glow-secondary">Where Passions Connect</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Watch how IndulgeOut brings hobby enthusiasts together</p>
          </div>
          
          {/* Central Hub Animation */}
          <div className="relative flex items-center justify-center h-96">
            {/* Central IndulgeOut Hub */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full center-pulse flex items-center justify-center text-white font-bold text-lg shadow-2xl z-20">
                <div className="text-center">
                  <div className="text-2xl mb-1">🤝</div>
                  <div className="text-xs">IndulgeOut</div>
                </div>
              </div>
            </div>
            
            {/* Hobby Icons Orbiting Around */}
            {hobbies.map((hobby, index) => (
              <div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  animation: `orbitalMove ${15 + index * 2}s linear infinite`,
                  animationDelay: `${index * 0.5}s`
                }}
              >
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${hobby.color} flex items-center justify-center text-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hobby-float cursor-pointer group`}
                     style={{animationDelay: `${index * 0.3}s`}}>
                  <span className="group-hover:scale-125 transition-transform duration-300">
                    {hobby.icon}
                  </span>
                  {/* Hobby Name Tooltip */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-30">
                    {hobby.name}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Connection Lines SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex: 10}}>
              {hobbies.map((hobby, index) => {
                const centerX = 192; // Half of container width (384px)
                const centerY = 192; // Half of container height (384px)
                const radius = 120;
                const angle = (hobby.angle * Math.PI) / 180;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                
                return (
                  <line
                    key={index}
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="2"
                    className="connection-line"
                    style={{
                      animationDelay: `${index * 0.2}s`,
                      strokeDasharray: '5,5'
                    }}
                  />
                );
              })}
            </svg>
            
            {/* Floating Connection Particles */}
            {Array.from({length: 20}).map((_, index) => (
              <div
                key={index}
                className="absolute w-2 h-2 bg-primary-400 rounded-full opacity-60 animate-ping"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          {/* Interactive Phase Indicators */}
          <div className="flex flex-wrap justify-center mt-12 space-x-2 sm:space-x-4 gap-y-2">
            <div className={`px-4 sm:px-6 py-3 rounded-full text-sm font-semibold transition-all duration-500 ${
              animationPhase === 0 ? 'bg-primary-600 text-white scale-110' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              Discover Hobbies
            </div>
            <div className={`px-4 sm:px-6 py-3 rounded-full text-sm font-semibold transition-all duration-500 ${
              animationPhase === 1 ? 'bg-primary-600 text-white scale-110' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              Find Your Tribe
            </div>
            <div className={`px-4 sm:px-6 py-3 rounded-full text-sm font-semibold transition-all duration-500 ${
              animationPhase === 2 ? 'bg-primary-600 text-white scale-110' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              Join Events
            </div>
            <div className={`px-4 sm:px-6 py-3 rounded-full text-sm font-semibold transition-all duration-500 ${
              animationPhase === 3 ? 'bg-primary-600 text-white scale-110' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              Build Connections
            </div>
          </div>
          
          {/* Description based on current phase */}
          <div className="text-center mt-8 h-16">
            {animationPhase === 0 && (
              <p className="text-lg text-gray-600 dark:text-gray-300 animate-fadeIn">
                Explore diverse hobbies from mountain climbing to book clubs
              </p>
            )}
            {animationPhase === 1 && (
              <p className="text-lg text-gray-600 dark:text-gray-300 animate-fadeIn">
                Connect with like-minded people who share your passions
              </p>
            )}
            {animationPhase === 2 && (
              <p className="text-lg text-gray-600 dark:text-gray-300 animate-fadeIn">
                Participate in exciting events and activities near you
              </p>
            )}
            {animationPhase === 3 && (
              <p className="text-lg text-gray-600 dark:text-gray-300 animate-fadeIn">
                Form lasting friendships through shared experiences
              </p>
            )}
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-primary-200 to-primary-300 dark:from-primary-600 dark:to-primary-700 rounded-full opacity-20 dark:opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-600 dark:to-blue-700 rounded-full opacity-20 dark:opacity-30 animate-bounce"></div>
        <div className="absolute top-1/2 right-20 w-12 h-12 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-600 dark:to-purple-700 rounded-full opacity-20 dark:opacity-30 floating-3d"></div>
      </section>

      {/* YouTube Testimonials - Vertical Video with Cards */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 relative overflow-hidden">
        {/* Animated Background Circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-pink-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Community Testimonials</h2>
            <p className="text-xl text-purple-200">Immersive Experience</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Vertical Video Player */}
            <div className="flex justify-center">
              <div className="relative group">
                <div 
                  className="aspect-[9/16] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 cursor-pointer relative bg-black transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-3xl"
                  onClick={() => {
                    setCurrentVideoUrl(testimonials[currentTestimonial].videoUrl + '?autoplay=1&rel=1');
                    setVideoModalOpen(true);
                  }}
                >
                  <img 
                    src={testimonials[currentTestimonial].videoThumb}
                    alt="Video Testimonial"
                    className="w-full h-full object-cover"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/30 via-black/40 to-black/60 group-hover:from-black/40 group-hover:via-black/50 group-hover:to-black/70 transition-all duration-300">
                    <div className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-2xl mb-4">
                      <Play className="h-8 w-8 text-white ml-1" fill="currentColor" />
                    </div>
                    <div className="text-white text-center px-4">
                      <p className="text-sm font-semibold mb-3">Watch on YouTube</p>
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold inline-block animate-pulse">
                        📺 Subscribe to Our Channel
                      </div>
                    </div>
                  </div>
                  
                  {/* YouTube Shorts Badge */}
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <span>▶</span> Shorts
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Testimonial Cards */}
            <div className="space-y-8">
              {/* Testimonial Card */}
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl min-h-[280px] flex flex-col justify-between">
                  {/* Quote Icon */}
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                    <span className="text-3xl text-white">"</span>
                  </div>
                  
                  {/* Stars */}
                  <div className="flex mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  {/* Quote Text */}
                  <blockquote className="text-white text-lg md:text-xl leading-relaxed mb-6 flex-grow">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                  
                  {/* Author Info */}
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                      {testimonials[currentTestimonial].initial}
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{testimonials[currentTestimonial].name}</p>
                      <div className="flex items-center text-purple-200 text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{testimonials[currentTestimonial].interest}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center mt-8 space-x-3">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentTestimonial(index);
                        setIsAutoSliding(false);
                        setTimeout(() => setIsAutoSliding(true), 8000);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentTestimonial 
                          ? 'bg-white w-8' 
                          : 'bg-white/40 w-2 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
                  <Users className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">250+</div>
                  <div className="text-xs text-purple-200">Happy Members</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
                  <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2 fill-current" />
                  <div className="text-2xl font-bold text-white mb-1">89</div>
                  <div className="text-xs text-purple-200">Success Stories</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
                  <Calendar className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">156</div>
                  <div className="text-xs text-purple-200">Events Hosted</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal - YouTube Shorts Format */}
      {videoModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-98 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => {
            setVideoModalOpen(false);
            setCurrentVideoUrl('');
          }}
        >
          <div 
            className="relative w-full max-w-md aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar - Channel Info */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/50 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Channel Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    <span className="text-xl">I</span>
                  </div>
                  {/* Channel Name */}
                  <div>
                    <a 
                      href="https://www.youtube.com/@IndulgeOut" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white font-semibold text-sm hover:underline flex items-center gap-1"
                    >
                      IndulgeOut
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                      </svg>
                    </a>
                  </div>
                  {/* Subscribe Button */}
                  <a 
                    href="https://www.youtube.com/@IndulgeOut?sub_confirmation=1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Subscribe
                  </a>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => {
                    setVideoModalOpen(false);
                    setCurrentVideoUrl('');
                  }}
                  className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300"
                >
                  <span className="text-white text-2xl leading-none">&times;</span>
                </button>
              </div>
            </div>
            
            {/* Video Iframe */}
            <iframe
              className="w-full h-full"
              src={currentVideoUrl}
              title="Video Testimonial"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
            
            {/* Floating Subscribe Button - Visible during video */}
            <div className="absolute top-20 left-0 right-0 z-20 flex justify-center animate-bounce" style={{animationDuration: '3s'}}>
              <a 
                href="https://www.youtube.com/@IndulgeOut?sub_confirmation=1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-110 shadow-2xl flex items-center gap-2 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Subscribe to Our Channel
              </a>
            </div>
            
            {/* Bottom Bar - Shorts Label & Info */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6">
              {/* Shorts Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 20H14V4H10V20ZM4 20H8V12H4V20ZM16 9V20H20V9H16Z"/>
                    </svg>
                    <span className="text-sm font-semibold">Shorts</span>
                  </div>
                </div>
                
                {/* Full Screen Hint */}
                <div className="text-white/60 text-xs flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                  </svg>
                  <span>Tap to fullscreen</span>
                </div>
              </div>
              
              {/* Video Info */}
              <div className="text-white">
                <p className="text-sm font-semibold mb-1">{testimonials[currentTestimonial].name}'s Story</p>
                <p className="text-xs text-white/80 line-clamp-2">{testimonials[currentTestimonial].text}</p>
              </div>
              
              {/* CTA */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <a 
                  href="https://www.youtube.com/@IndulgeOut" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Watch More on YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works - Experience Ecosystem */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Experience Ecosystem</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Connecting people and businesses through shared passions</p>
          </div>
          
          {/* B2C & B2B Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8">
            
            {/* B2C Track - For Experience Seekers */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">For Experience Seekers</h3>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                A social experiences platform that helps you discover events, join communities, and connect with people who share your interests.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Discover Events</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Find local events that match your interests</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Join Communities</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Connect with like-minded enthusiasts</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Build Friendships</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Form lasting connections in real life</p>
                  </div>
                </div>
              </div>
              
              <Link
                to="/explore"
                className="inline-flex items-center justify-center w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Explore Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            {/* B2B Track - For Partners */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mr-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">For Communities & Venues</h3>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                A marketplace ecosystem that connects communities, venues, and brands with engaged audiences seeking authentic experiences.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Reach Your Audience</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Connect with people passionate about your niche</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Grow Your Business</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fill your venue with engaged community members</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Track Performance</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get insights and analytics on your events</p>
                  </div>
                </div>
              </div>
              
              <Link
                to="/host-partner"
                className="inline-flex items-center justify-center w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                Become a Partner
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Trusted by Communities</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Join thousands who've found their tribe</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">10,000+</div>
              <div className="text-gray-600 dark:text-gray-400">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-400">Monthly Events</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-400">Partner Venues</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">17</div>
              <div className="text-gray-600 dark:text-gray-400">Categories</div>
            </div>
          </div>
          
          {/* Event Photos Slider */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Past Events Highlights</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPhotoSlideIndex(prev => Math.max(0, prev - 1))}
                  disabled={photoSlideIndex === 0}
                  className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPhotoSlideIndex(prev => Math.min(eventPhotos.length - 4, prev + 1))}
                  disabled={photoSlideIndex >= eventPhotos.length - 4}
                  className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-700 ease-in-out gap-4"
                style={{ transform: `translateX(-${photoSlideIndex * (100 / 4 + 1)}%)` }}
              >
                {eventPhotos.map((photo, index) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0 w-[calc(25%-12px)] aspect-square rounded-lg overflow-hidden group relative shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    <img 
                      src={photo} 
                      alt={`Event ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
                            <div class="text-center">
                              <div class="text-4xl mb-2">📸</div>
                              <p class="text-xs text-gray-600 dark:text-gray-400">Event Photo ${index + 1}</p>
                            </div>
                          </div>
                        `;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="text-sm font-semibold">Event Memory</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Slide Indicator */}
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: eventPhotos.length - 3 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPhotoSlideIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === photoSlideIndex 
                      ? 'bg-primary-600 w-8' 
                      : 'bg-gray-300 dark:bg-gray-600 w-2 hover:bg-primary-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Partner Logos - Placeholders */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Our Partners</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="aspect-video bg-white dark:bg-gray-700 rounded-lg shadow-md flex items-center justify-center border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-shadow duration-300">
                  <div className="text-center p-4">
                    <div className="text-3xl mb-1">🏢</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Partner {index}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Download the App - Live */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Download the IndulgeOut App
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Experience IndulgeOut on the go. Available now on iOS and Android!
            </p>
          </div>
          
          {/* App Store Badges */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="https://apps.apple.com/in/app/indulgeout/id6744292040"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center transform hover:scale-105 transition-all duration-300 shadow-xl"
            >
              <div className="text-2xl mr-3">🍎</div>
              <div className="text-left">
                <div className="text-xs">Download on the</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
            </a>
            <a 
              href="https://play.google.com/store/apps/details?id=com.anantexperiences.indulgeout"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center transform hover:scale-105 transition-all duration-300 shadow-xl"
            >
              <div className="text-2xl mr-3">🤖</div>
              <div className="text-left">
                <div className="text-xs">GET IT ON</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Find Your Community?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of people connecting over shared interests and experiences
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center bg-transparent border-2 border-white hover:bg-white hover:text-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Explore Events
            </Link>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-ping"></div>
        <div className="absolute bottom-10 right-20 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-12 h-12 bg-white bg-opacity-10 rounded-full animate-bounce"></div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                IndulgeOut
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Connecting communities through shared interests and real-world experiences.
              </p>
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">Download Our App</p>
                <div className="flex flex-col gap-2">
                  <a 
                    href="https://apps.apple.com/in/app/indulgeout/id6744292040"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-xs transition-all duration-300"
                  >
                    <span className="mr-2">🍎</span>
                    <span>App Store</span>
                  </a>
                  <a 
                    href="https://play.google.com/store/apps/details?id=com.anantexperiences.indulgeout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-xs transition-all duration-300"
                  >
                    <span className="mr-2">🤖</span>
                    <span>Google Play</span>
                  </a>
                </div>
              </div>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                  <span className="text-lg">📘</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                  <span className="text-lg">📷</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                  <span className="text-lg">🐦</span>
                </a>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/explore" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group">
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    Explore Events
                  </Link>
                </li>
                <li>
                  <Link to="/categories" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group">
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    Categories
                  </Link>
                </li>
                <li>
                  <Link to="/host-partner" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group">
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    Host & Partner
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group">
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group">
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group">
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group">
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group">
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group">
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center group">
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} IndulgeOut. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>Made with ❤️ for communities</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;