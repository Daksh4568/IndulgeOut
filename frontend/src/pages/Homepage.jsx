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

  // Auto-rotate middle card testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMiddleTestimonial((prev) => (prev + 1) % middleTestimonials.length);
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
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
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
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight">
            YOUR GO-TO FOR OFFLINE<br />EXPERIENCES.
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

      {/* Stats Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-zinc-900/50 border border-zinc-900 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Stat 1 */}
              <div className="text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-2">
                  500+
                </div>
                <div className="text-base text-gray-300 font-medium">Monthly Events</div>
              </div>
              
              {/* Stat 2 */}
              <div className="text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-2">
                  50k+
                </div>
                <div className="text-base text-gray-300 font-medium">Active Users</div>
              </div>
              
              {/* Stat 3 */}
              <div className="text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-2">
                  42k+
                </div>
                <div className="text-base text-gray-300 font-medium">Community Members</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vox Pop Testimonials Section */}
      <section className="py-20 bg-zinc-900 dark:bg-zinc-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our Vox pops and<br />customer testimonials
            </h2>
            <p className="text-xl text-gray-400">
              Hold on, stay and watch this because you'll for sure love it. No bragging, it's honestly super candid, fun and heart-warming!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Vox Pop 1 */}
            <div 
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl cursor-pointer bg-black transform transition-all duration-300"
              onClick={() => {
                setCurrentVideoUrl('https://www.youtube.com/embed/uT3Quuy_5-o?autoplay=1&rel=1');
                setVideoModalOpen(true);
              }}
            >
              <img 
                src="https://img.youtube.com/vi/uT3Quuy_5-o/maxresdefault.jpg"
                alt="Vox Pop 1"
                className="w-full h-full object-cover pointer-events-none"
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/30 via-black/40 to-black/60 pointer-events-none">
                <div className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl pointer-events-none">
                  <Play className="h-6 w-6 text-white ml-1 pointer-events-none" fill="currentColor" />
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
                  className="bg-white text-indigo-600 px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-sm shadow-lg"
                >
                  VIEW ALL
                </button>
              </div>
            </div>

            {/* Vox Pop 2 */}
            <div 
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl cursor-pointer bg-black transform transition-all duration-300"
              onClick={() => {
                setCurrentVideoUrl('https://www.youtube.com/embed/t62ExT2n4a0?autoplay=1&rel=1');
                setVideoModalOpen(true);
              }}
            >
              <img 
                src="https://img.youtube.com/vi/t62ExT2n4a0/maxresdefault.jpg"
                alt="Vox Pop 2"
                className="w-full h-full object-cover pointer-events-none"
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/30 via-black/40 to-black/60 pointer-events-none">
                <div className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl pointer-events-none">
                  <Play className="h-6 w-6 text-white ml-1 pointer-events-none" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Looking For Events In Your City - Carousel Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Looking For Events In Your City?
            </h2>
          </div>
          
          {/* Tilted Cards Carousel */}
          <div className="relative h-[500px] flex items-center justify-center perspective-1000">
            <div className="flex gap-8 overflow-x-auto scrollbar-hide px-20" style={{scrollbarWidth: 'none'}}>
              {/* Event Card 1 */}
              <div className="flex-shrink-0 w-80 transform hover:scale-105 transition-all duration-300" style={{transform: 'rotate(-5deg)'}}>
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl overflow-hidden shadow-2xl h-[400px]">
                  <div className="h-3/5 bg-blue-500 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-8xl">🚴</div>
                  </div>
                  <div className="p-6 h-2/5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">CALLING ALL BIKE RIDERS!</h3>
                      <p className="text-blue-100 text-sm">Join our cycling community</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Card 2 */}
              <div className="flex-shrink-0 w-80 transform hover:scale-105 transition-all duration-300" style={{transform: 'rotate(3deg)'}}>
                <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl overflow-hidden shadow-2xl h-[400px]">
                  <div className="h-3/5 bg-green-500 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-8xl">🎭</div>
                  </div>
                  <div className="p-6 h-2/5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">SPECIAL KIFAAB</h3>
                      <p className="text-green-100 text-sm">Theatre performances</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Card 3 */}
              <div className="flex-shrink-0 w-80 transform hover:scale-105 transition-all duration-300" style={{transform: 'rotate(-3deg)'}}>
                <div className="bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl overflow-hidden shadow-2xl h-[400px]">
                  <div className="h-3/5 bg-pink-500 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-8xl">🎥</div>
                  </div>
                  <div className="p-6 h-2/5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">SCREENING</h3>
                      <p className="text-pink-100 text-sm">Movie screenings & discussions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Card 4 */}
              <div className="flex-shrink-0 w-80 transform hover:scale-105 transition-all duration-300" style={{transform: 'rotate(5deg)'}}>
                <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl overflow-hidden shadow-2xl h-[400px]">
                  <div className="h-3/5 bg-orange-500 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-8xl">👩</div>
                  </div>
                  <div className="p-6 h-2/5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">WOMEN'S MEETUP</h3>
                      <p className="text-orange-100 text-sm">Empowerment gatherings</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Card 5 */}
              <div className="flex-shrink-0 w-80 transform hover:scale-105 transition-all duration-300" style={{transform: 'rotate(-4deg)'}}>
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl overflow-hidden shadow-2xl h-[400px]">
                  <div className="h-3/5 bg-purple-500 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-8xl">🏃</div>
                  </div>
                  <div className="p-6 h-2/5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">BIG LAND</h3>
                      <p className="text-purple-100 text-sm">Season 2 sports events</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Explore Now Button */}
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/explore')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-12 py-4 rounded-full text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              EXPLORE NOW
            </button>
          </div>
        </div>
      </section>

      {/* Partner With Us Section */}
      <section className="py-20 bg-zinc-900 dark:bg-zinc-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              PARTNER WITH US
            </h2>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
            {/* Left Side - Orbital Icons (smaller) */}
            <div className="relative flex items-center justify-center w-80 h-80">
              {/* Central IndulgeOut Logo */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-2xl">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🎯</div>
                    <div className="text-[10px]">indulgeout</div>
                  </div>
                </div>
              </div>
              
              {/* Orbiting Icons */}
              {[
                { icon: '🏢', label: 'Venue', color: 'from-blue-500 to-blue-700', delay: '0s' },
                { icon: '🎭', label: 'Organizer', color: 'from-purple-500 to-purple-700', delay: '2s' },
                { icon: '🤝', label: 'Sponsor', color: 'from-pink-500 to-pink-700', delay: '4s' }
              ].map((item, index) => (
                <div
                  key={index}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    animation: `orbitalMove ${15}s linear infinite`,
                    animationDelay: item.delay
                  }}
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-lg`}>
                    <span>{item.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side - Stacked Polaroid Cards */}
            <div className="relative w-full max-w-xl h-[400px] group flex items-center justify-center">
              {/* Card 1 - Behind (left side) */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2 w-72 bg-white rounded-lg overflow-hidden shadow-2xl transform -rotate-6 transition-all duration-500 z-10 group-hover:scale-95 hover:!rotate-0 hover:!z-30 hover:!scale-105">
                <div className="p-4">
                  <div className="aspect-[3/2] bg-gradient-to-br from-blue-100 to-purple-100 rounded-md mb-2 overflow-hidden">
                    <img src="/images/Media (5).jpg" alt="Partner event" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">
                    Start Something You Love
                  </h3>
                  <p className="text-gray-600 text-xs mb-3 leading-relaxed">
                    Every great community starts with one idea. Whether it's art, wellness, learning, or just meeting like-minded people, create a space where connections grow naturally. Share your vision, and we'll help you make it real.
                  </p>
                  <button
                    onClick={() => navigate('/host-partner')}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300"
                  >
                    Explore the event
                  </button>
                </div>
              </div>

              {/* Card 2 - Front (right side, overlapping) */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-72 bg-white rounded-lg overflow-hidden shadow-2xl transform rotate-6 transition-all duration-500 z-20 group-hover:scale-95 hover:!rotate-0 hover:!z-30 hover:!scale-105">
                <div className="p-4">
                  <div className="aspect-[3/2] bg-gradient-to-br from-pink-100 to-orange-100 rounded-md mb-2 overflow-hidden">
                    <img src="/images/Media (7).jpg" alt="Community event" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">
                    Start Something You Love
                  </h3>
                  <p className="text-gray-600 text-xs mb-3 leading-relaxed">
                    Every great community starts with one idea. Whether it's art, wellness, learning, or just meeting like-minded people, create a space where connections grow naturally. Share your vision, and we'll help you make it real.
                  </p>
                  <button
                    onClick={() => navigate('/host-partner')}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300"
                  >
                    Explore the event
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-20">
            <button
              onClick={() => navigate('/host-partner')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-12 py-4 rounded-full text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              Explore the event
            </button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white dark:bg-black transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
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

      
        </div>
      </section>

      {/* Download the App - Live */}
      <section className="py-20 bg-zinc-900 dark:bg-zinc-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Content */}
            <div className="flex-1 text-left">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                DOWNLOAD THE APP
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Get the App
              </p>
              
              {/* App Store Badges */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://apps.apple.com/in/app/indulgeout/id6744292040"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transform hover:scale-105 transition-all duration-300"
                >
                  <div className="text-2xl mr-3">▶</div>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Download on</div>
                    <div className="text-base font-semibold">Google Play</div>
                  </div>
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.anantexperiences.indulgeout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transform hover:scale-105 transition-all duration-300"
                >
                  <div className="text-2xl mr-3">🍎</div>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Download on the</div>
                    <div className="text-base font-semibold">App Store</div>
                  </div>
                </a>
              </div>
            </div>
            
            {/* Right Side - Phone Mockup Placeholder */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Phone 1 */}
                <div className="relative w-64 h-[500px] bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[3rem] border-8 border-zinc-700 shadow-2xl transform rotate-[-5deg]">
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-full"></div>
                  <div className="p-6 mt-10">
                    <div className="bg-zinc-700 rounded-lg h-32 mb-4"></div>
                    <div className="space-y-2">
                      <div className="bg-zinc-700 rounded h-4 w-3/4"></div>
                      <div className="bg-zinc-700 rounded h-4 w-1/2"></div>
                    </div>
                  </div>
                </div>
                {/* Phone 2 - Overlapping */}
                <div className="absolute top-8 left-16 w-64 h-[500px] bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-[3rem] border-8 border-zinc-600 shadow-2xl transform rotate-[8deg]">
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-zinc-800 rounded-full"></div>
                  <div className="p-6 mt-10">
                    <div className="bg-zinc-600 rounded-lg h-32 mb-4"></div>
                    <div className="space-y-2">
                      <div className="bg-zinc-600 rounded h-4 w-2/3"></div>
                      <div className="bg-zinc-600 rounded h-4 w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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