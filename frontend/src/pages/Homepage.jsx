import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Calendar, MapPin, Heart, Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';

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
  
  const typewriterWords = ['Find Your Tribe,'];
  const secondLineWords = 'Live Your Passions';
  const currentWord = typewriterWords[currentWordIndex];

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
      name: 'Rahul Sharma',
      text: 'Found my hiking tribe through IndulgeOut. Best decision ever!',
      interest: 'Adventure & Outdoors'
    },
    {
      name: 'Lakshya Thakur',
      text: 'Amazing food events and met incredible people who share my passion.',
      interest: 'Sip & Savor'
    },
    {
      name: 'Ankita',
      text: 'The art workshops here are fantastic. So many creative souls!',
      interest: 'Art & DIY'
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
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">IndulgeOut</h1>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link
                to="/login"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 py-20 overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center relative z-10">
            {/* Animated Hero Title with Enhanced Typewriter Effect */}
            <div className="mb-6">
              <h1 className={`text-4xl md:text-6xl font-bold text-gray-900 dark:text-white transform transition-all duration-1500 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
                <span className="block slide-in-rotate text-glow-secondary">
                  {renderAnimatedText(typewriterText, 0.5)}
                  {showCursor && !showSecondLine && (
                    <span className="typewriter-cursor text-primary-600">|</span>
                  )}
                </span>
                <br />
                <span className={`text-primary-600 inline-block perspective-3d text-glow ${showSecondLine ? 'slide-in-rotate' : 'opacity-0'}`}>
                  {showSecondLine && renderAnimatedText(secondLineText, 2.0)}
                  {showCursor && showSecondLine && secondLineText.length < secondLineWords.length && (
                    <span className="typewriter-cursor">|</span>
                  )}
                </span>
              </h1>
            </div>
            <p className={`text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto transform transition-all duration-1000 delay-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              Connect with like-minded people around food, music, sports, art, and experiences. 
              IndulgeOut brings communities together in the real world.
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center transform transition-all duration-1000 delay-1500 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg text-lg font-semibold flex items-center justify-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg card-3d"
              >
                Join Community
                <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                to="/register?type=host"
                className="border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white px-8 py-3 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 hover:shadow-lg card-3d"
              >
                Host Events
              </Link>
            </div>
          </div>
        </div>
        
        {/* Enhanced 3D Floating Elements */}
        <div className="absolute top-20 left-10 floating-3d">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-blue-500 morph-bubble opacity-20"></div>
        </div>
        <div className="absolute bottom-20 left-1/4 floating-3d" style={{animationDelay: '1s'}}>
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 morph-bubble opacity-25"></div>
        </div>
        <div className="absolute top-1/3 right-20 floating-3d" style={{animationDelay: '2s'}}>
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 morph-bubble opacity-15"></div>
        </div>
        
        {/* 3D Rotating Geometric Shapes */}
        <div className="absolute top-16 right-16 rotate-y">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-10 transform rotate-45"></div>
        </div>
        <div className="absolute bottom-32 right-32 rotate-y" style={{animationDelay: '3s'}}>
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 opacity-15 rounded-full"></div>
        </div>
        
        {/* Strategically placed bubbles away from buttons */}
        <div className="absolute top-10 left-16 floating-3d">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-blue-400 morph-bubble opacity-15"></div>
        </div>
        <div className="absolute bottom-32 left-20 floating-3d" style={{animationDelay: '1.5s'}}>
          <div className="w-7 h-7 bg-gradient-to-br from-green-300 to-teal-400 morph-bubble opacity-18"></div>
        </div>
        <div className="absolute top-3/4 left-10 floating-3d" style={{animationDelay: '2.2s'}}>
          <div className="w-5 h-5 bg-gradient-to-br from-cyan-400 to-indigo-500 morph-bubble opacity-20"></div>
        </div>
        
        {/* Enhanced small accent bubbles with 3D transforms */}
        <div className="absolute top-1/3 left-1/5 floating-3d" style={{animationDelay: '4s'}}>
          <div className="w-6 h-6 bg-gradient-to-br from-rose-400 to-pink-600 morph-bubble opacity-25"></div>
        </div>
        <div className="absolute bottom-1/3 left-1/6 floating-3d" style={{animationDelay: '2.8s'}}>
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-600 morph-bubble opacity-22"></div>
        </div>
        
        {/* New 3D floating elements */}
        <div className="absolute top-1/2 left-5 floating-3d" style={{animationDelay: '3.5s'}}>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 morph-bubble opacity-20"></div>
        </div>
        <div className="absolute bottom-1/4 right-10 floating-3d" style={{animationDelay: '1.8s'}}>
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 morph-bubble opacity-18"></div>
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

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`text-center transform transition-all duration-700 hover:scale-110 card-3d perspective-3d ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{transitionDelay: `${800 + index * 200}ms`}}
              >
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2 floating-3d" style={{animationDelay: `${index * 0.5}s`}}>
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 transform transition-all duration-300 hover:scale-105">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Simple steps to find your community</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className={`text-center transform transition-all duration-700 hover:scale-105 card-3d ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{transitionDelay: '1200ms'}}>
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-4 floating-3d hover:shadow-lg transition-shadow duration-300">
                <Users className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-glow-secondary text-gray-900 dark:text-white">Choose Your Interests</h3>
              <p className="text-gray-600 dark:text-gray-400">Select from food, sports, art, music, and more</p>
            </div>
            
            <div className={`text-center transform transition-all duration-700 hover:scale-105 card-3d ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{transitionDelay: '1400ms'}}>
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-4 floating-3d hover:shadow-lg transition-shadow duration-300" style={{animationDelay: '0.2s'}}>
                <Calendar className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-glow-secondary text-gray-900 dark:text-white">Discover Events</h3>
              <p className="text-gray-600 dark:text-gray-400">Find events that match your passions</p>
            </div>
            
            <div className={`text-center transform transition-all duration-700 hover:scale-105 card-3d ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{transitionDelay: '1600ms'}}>
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-4 floating-3d hover:shadow-lg transition-shadow duration-300" style={{animationDelay: '0.4s'}}>
                <MapPin className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-glow-secondary text-gray-900 dark:text-white">Join Locally</h3>
              <p className="text-gray-600 dark:text-gray-400">Meet people in your area</p>
            </div>
            
            <div className={`text-center transform transition-all duration-700 hover:scale-105 card-3d ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{transitionDelay: '1800ms'}}>
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-4 floating-3d hover:shadow-lg transition-shadow duration-300" style={{animationDelay: '0.6s'}}>
                <Heart className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-glow-secondary text-gray-900 dark:text-white">Build Connections</h3>
              <p className="text-gray-600 dark:text-gray-400">Form lasting friendships</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interest Categories */}
      <section className="py-20 bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Explore Your Interests</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Find your passion and connect with others</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interests.map((interest, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-105 card-3d perspective-3d card-hover-effect ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{
                  transitionDelay: `${2000 + index * 150}ms`,
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className={`${interest.color} h-48 flex items-center justify-center text-6xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-y-12 relative overflow-hidden`}>
                  <span className="floating-3d icon-pulse-effect relative z-10" style={{animationDelay: `${index * 0.2}s`}}>
                    {interest.icon}
                  </span>
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {/* Floating particles effect */}
                  <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-ping transition-all duration-500"></div>
                  <div className="absolute bottom-3 right-4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-40 group-hover:animate-pulse transition-all duration-700" style={{animationDelay: '0.2s'}}></div>
                  <div className="absolute top-1/2 right-2 w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover:opacity-50 group-hover:animate-bounce transition-all duration-600" style={{animationDelay: '0.4s'}}></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6 text-white transform transition-all duration-500 group-hover:translate-y-0 translate-y-2 group-hover:scale-105">
                    <h3 className="text-xl font-bold mb-2 text-glow-secondary transform transition-all duration-300 group-hover:scale-110">{interest.name}</h3>
                    <p className="text-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-x-0 translate-x-4 group-hover:scale-105">
                      {interest.description}
                    </p>
                  </div>
                </div>
                {/* Enhanced animated border with 3D effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-400 rounded-xl transition-all duration-500 group-hover:shadow-inner group-hover:border-opacity-80"></div>
                
                {/* 3D depth effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                
                {/* Glowing corner effect */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 bg-gradient-to-tr from-primary-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-tr-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">What Our Community Says</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Real stories from real people</p>
          </div>
          
          {/* Carousel Container */}
          <div className="relative max-w-4xl mx-auto">
            {/* Navigation Buttons */}
            <button 
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group border border-gray-200 dark:border-gray-600"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300" />
            </button>
            
            <button 
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group border border-gray-200 dark:border-gray-600"
            >
              <ChevronRight className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300" />
            </button>

            {/* Testimonials Slider */}
            <div className="overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={index}
                    className="w-full flex-shrink-0 px-8"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
                      {/* Stars */}
                      <div className="flex justify-center items-center mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className="h-6 w-6 text-yellow-400 fill-current transform transition-transform duration-300 hover:scale-125 mx-1"
                            style={{animationDelay: `${i * 0.1}s`}}
                          />
                        ))}
                      </div>
                      
                      {/* Quote */}
                      <blockquote className="text-xl text-gray-700 dark:text-gray-300 text-center mb-8 italic font-medium leading-relaxed">
                        "{testimonial.text}"
                      </blockquote>
                      
                      {/* Author */}
                      <div className="text-center border-t border-gray-200 dark:border-gray-600 pt-6">
                        <p className="font-bold text-xl text-gray-900 dark:text-white mb-2">{testimonial.name}</p>
                        <p className="text-primary-600 dark:text-primary-400 font-semibold text-lg">{testimonial.interest}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-8 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentTestimonial(index);
                    setIsAutoSliding(false);
                    setTimeout(() => setIsAutoSliding(true), 8000);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                    index === currentTestimonial 
                      ? 'bg-primary-600 scale-125' 
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-6">
              <div 
                className="bg-primary-600 h-1 rounded-full transition-all duration-100 ease-linear"
                style={{ 
                  width: isAutoSliding ? '100%' : '0%',
                  animation: isAutoSliding ? 'progress 4s linear infinite' : 'none'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 dark:bg-primary-700 relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className={`text-3xl font-bold text-white mb-4 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`} style={{transitionDelay: '3500ms'}}>
            Ready to Find Your Community?
          </h2>
          <p className={`text-xl text-primary-100 mb-8 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`} style={{transitionDelay: '3700ms'}}>
            Join thousands of people connecting over shared interests
          </p>
          <Link
            to="/register"
            className={`inline-block bg-white hover:bg-gray-100 dark:bg-gray-100 dark:hover:bg-white text-primary-600 dark:text-primary-700 px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
            style={{transitionDelay: '3900ms'}}
          >
            Get Started Today
          </Link>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 dark:bg-opacity-20 rounded-full animate-ping"></div>
        <div className="absolute bottom-10 right-20 w-16 h-16 bg-white bg-opacity-10 dark:bg-opacity-20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-12 h-12 bg-white bg-opacity-10 dark:bg-opacity-20 rounded-full animate-bounce"></div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 border-t border-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">IndulgeOut</h3>
              <p className="text-gray-400 dark:text-gray-500">
                Connecting communities through shared interests and experiences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li><Link to="/about" className="hover:text-white dark:hover:text-gray-300 transition-colors">About</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white dark:hover:text-gray-300 transition-colors">How it Works</Link></li>
                <li><Link to="/pricing" className="hover:text-white dark:hover:text-gray-300 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li><Link to="/groups" className="hover:text-white dark:hover:text-gray-300 transition-colors">Groups</Link></li>
                <li><Link to="/blog" className="hover:text-white dark:hover:text-gray-300 transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li><Link to="/contact" className="hover:text-white dark:hover:text-gray-300 transition-colors">Contact</Link></li>
                <li><Link to="/help" className="hover:text-white dark:hover:text-gray-300 transition-colors">Help Center</Link></li>
                <li><Link to="/privacy" className="hover:text-white dark:hover:text-gray-300 transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center text-gray-400 dark:text-gray-500">
            <p>&copy; 2025 IndulgeOut. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;