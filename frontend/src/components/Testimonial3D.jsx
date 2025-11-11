import React, { useState, useEffect, useRef } from 'react';
import { Quote, Star, User, Calendar, ArrowLeft, X } from 'lucide-react';

const Testimonial3D = ({ testimonials, isVisible, onClose }) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Check if video2 exists
  useEffect(() => {
    const checkVideo = () => {
      const video = document.createElement('video');
      video.src = '/videos/video2.mp4';
      video.onloadedmetadata = () => {
        setHasVideo(true);
        setIsLoading(false);
      };
      video.onerror = () => {
        setHasVideo(false);
        setIsLoading(false);
      };
    };

    if (isVisible) {
      checkVideo();
    }
  }, [isVisible]);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isLoading && testimonials && testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 6000); // Change every 6 seconds

      return () => clearInterval(interval);
    }
  }, [isLoading, testimonials]);

  // Handle video playback
  useEffect(() => {
    if (hasVideo && videoRef.current && isVisible && isPlaying) {
      videoRef.current.play().catch(console.error);
    }
  }, [hasVideo, isVisible, isPlaying, currentTestimonial]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const goToTestimonial = (index) => {
    setCurrentTestimonial(index);
  };

  const mockTestimonials = [
    {
      content: "This community has completely transformed my social life! Amazing people and incredible events.",
      author: "Sarah Johnson",
      rating: 5,
      date: "2 weeks ago",
      avatar: "S"
    },
    {
      content: "Found my passion for photography through this group. The workshops are phenomenal!",
      author: "Mike Chen",
      rating: 5,
      date: "1 month ago",
      avatar: "M"
    },
    {
      content: "Best decision joining this community. Made lifelong friends and discovered new interests.",
      author: "Emma Rodriguez",
      rating: 5,
      date: "3 weeks ago",
      avatar: "E"
    }
  ];

  const displayTestimonials = testimonials && testimonials.length > 0 ? testimonials : mockTestimonials;
  const currentItem = displayTestimonials[currentTestimonial] || mockTestimonials[0];

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden"
    >
      {/* Navigation Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:block">Back to Community</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-white text-lg font-semibold">Community Testimonials</h2>
            <p className="text-purple-200 text-sm">Immersive Experience</p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3D Background Effects */}
      <div className="absolute inset-0">
        {/* Animated Geometric Shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full animate-float-delay"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full animate-float-slow"></div>
        
        {/* 3D Grid Background */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              transform: 'perspective(1000px) rotateX(45deg) rotateY(-15deg)',
              transformOrigin: 'center center'
            }}
          ></div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen pt-20">
        
        {/* Video Section - 3D Perspective */}
        <div className="lg:w-1/2 flex items-center justify-center p-8">
          <div className="relative">
            {/* 3D Video Container */}
            <div 
              className="relative w-80 h-96 lg:w-96 lg:h-[500px] transform-gpu transition-all duration-1000"
              style={{
                transform: `perspective(1000px) rotateY(-15deg) rotateX(5deg) translateZ(50px)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Video Background Glow */}
              <div className="absolute -inset-6 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-indigo-500/30 rounded-3xl blur-3xl animate-pulse-slow"></div>
              
              {/* Video Frame */}
              <div className="relative w-full h-full bg-black/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                {hasVideo ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay={isVisible && isPlaying}
                    muted
                    loop
                    playsInline
                  >
                    <source src="/videos/video2.mp4" type="video/mp4" />
                  </video>
                ) : (
                  // Animated Placeholder
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 flex items-center justify-center">
                    <div className="text-center">
                      <Quote className="w-16 h-16 text-white/80 mx-auto mb-4 animate-pulse" />
                      <p className="text-white/80 text-lg font-medium">Community Stories</p>
                    </div>
                  </div>
                )}

                {/* Video Overlay Effects */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlayback}
                  className="absolute bottom-6 right-6 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 group"
                >
                  {isPlaying ? (
                    <div className="flex space-x-1">
                      <div className="w-1 h-4 bg-white rounded group-hover:scale-110 transition-transform"></div>
                      <div className="w-1 h-4 bg-white rounded group-hover:scale-110 transition-transform"></div>
                    </div>
                  ) : (
                    <div 
                      className="w-0 h-0 ml-1 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent group-hover:scale-110 transition-transform"
                    ></div>
                  )}
                </button>

                {/* 3D Frame Accent */}
                <div className="absolute inset-0 rounded-3xl border-2 border-gradient-to-br from-purple-400/50 to-blue-400/50 pointer-events-none"></div>
              </div>

              {/* 3D Shadow */}
              <div 
                className="absolute inset-0 bg-black/30 rounded-3xl blur-xl"
                style={{
                  transform: 'translateY(20px) translateZ(-50px)',
                  filter: 'blur(20px)'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Testimonial Content - 3D Cards */}
        <div className="lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-lg w-full">
            
            {/* Main Testimonial Card */}
            <div 
              className="relative mb-8 transform-gpu transition-all duration-1000"
              style={{
                transform: `perspective(1000px) rotateY(10deg) rotateX(-5deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Card Background Glow */}
              <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-2xl"></div>
              
              {/* Testimonial Card */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                
                {/* Quote Icon */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Quote className="w-6 h-6 text-white" />
                </div>

                {/* Rating Stars */}
                <div className="flex space-x-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`w-5 h-5 ${
                        i < (currentItem.rating || 5)
                          ? 'text-yellow-400 fill-current'
                          : 'text-white/30'
                      }`}
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <blockquote className="text-white text-xl leading-relaxed mb-6 font-light">
                  "{currentItem.content}"
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                    {currentItem.avatar || currentItem.author?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <div className="text-white font-medium text-lg">
                      {currentItem.author || 'Community Member'}
                    </div>
                    <div className="text-white/60 text-sm flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{currentItem.date || 'Recently'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Border Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-indigo-400/20 p-[1px] pointer-events-none">
                  <div className="w-full h-full rounded-3xl bg-transparent"></div>
                </div>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center space-x-3 mb-8">
              {displayTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'w-12 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full'
                      : 'w-4 h-4 bg-white/30 rounded-full hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Happy Members', value: '250+', icon: User },
                { label: 'Success Stories', value: '89', icon: Star },
                { label: 'Events Hosted', value: '156', icon: Calendar }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 hover:bg-white/20 transition-all duration-300"
                  style={{
                    transform: `perspective(500px) rotateY(${index % 2 === 0 ? '5deg' : '-5deg'})`,
                    transformStyle: 'preserve-3d',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <stat.icon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-white text-xl font-bold">{stat.value}</div>
                  <div className="text-white/70 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-random"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

// CSS animations that should be added to your global CSS or Tailwind config
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotateY(0deg); }
    50% { transform: translateY(-20px) rotateY(180deg); }
  }
  
  @keyframes float-delay {
    0%, 100% { transform: translateY(0px) rotateX(0deg); }
    50% { transform: translateY(-30px) rotateX(360deg); }
  }
  
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-15px) scale(1.1); }
  }
  
  @keyframes float-random {
    0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
    25% { transform: translateY(-30px) translateX(20px) rotate(90deg); }
    50% { transform: translateY(-60px) translateX(-10px) rotate(180deg); }
    75% { transform: translateY(-20px) translateX(-30px) rotate(270deg); }
  }
  
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }
  
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-float-delay { animation: float-delay 8s ease-in-out infinite; }
  .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
  .animate-float-random { animation: float-random 20s linear infinite; }
  .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
`;

export default Testimonial3D;