import React, { useState, useRef, useEffect } from 'react';
import PlaceholderVideo from './PlaceholderVideo';

const VideoAnimation = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [videosLoaded, setVideosLoaded] = useState(0);
  const [hasVideos, setHasVideos] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const videoRefs = useRef([]);
  const containerRef = useRef();
  
  // Add your video files here - place them in public/videos/
  const videos = [
    {
      src: '/videos/video1.mp4',
      title: 'Community Events',
      description: 'Join exciting local events',
      icon: '🤝'
    },
    {
      src: '/videos/video2.mp4', 
      title: 'Social Connections',
      description: 'Meet like-minded people',
      icon: '🎨'
    },
    {
      src: '/videos/video3.mp4',
      title: 'Shared Experiences', 
      description: 'Create lasting memories',
      icon: '🌟'
    }
  ];

  // Only preload videos when component becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            // Start loading videos only when component is visible
            preloadVideos();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const preloadVideos = () => {
    let loadedCount = 0;
    let successfulLoads = 0;
    
    videos.forEach((video, index) => {
      const videoElement = document.createElement('video');
      videoElement.src = video.src;
      videoElement.preload = 'metadata';
      
      videoElement.addEventListener('loadedmetadata', () => {
        loadedCount++;
        successfulLoads++;
        setVideosLoaded(loadedCount);
        console.log(`Video ${index + 1} loaded successfully`);
        
        if (loadedCount === videos.length) {
          setHasVideos(successfulLoads > 0);
          setIsLoading(false);
        }
      });
      
      videoElement.addEventListener('error', (e) => {
        console.log(`Video ${index + 1} failed to load:`, e);
        console.log(`Attempted to load: ${video.src}`);
        loadedCount++;
        setVideosLoaded(loadedCount);
        
        if (loadedCount === videos.length) {
          setHasVideos(successfulLoads > 0);
          setIsLoading(false);
        }
      });
    });
    
    // Check if all videos loaded after a reasonable time
    setTimeout(() => {
      if (loadedCount < videos.length) {
        console.log(`Only ${loadedCount} of ${videos.length} videos loaded, but continuing with available videos`);
        setIsLoading(false);
      }
    }, 8000);
  };

  // Handle video end to move to next video
  const handleVideoEnd = () => {
    console.log(`Video ${currentVideoIndex + 1} ended, moving to next`);
    setCurrentVideoIndex((prevIndex) => 
      (prevIndex + 1) % videos.length
    );
  };

  // Manual navigation functions
  const goToNext = () => {
    setCurrentVideoIndex((prevIndex) => 
      (prevIndex + 1) % videos.length
    );
  };

  const goToPrev = () => {
    setCurrentVideoIndex((prevIndex) => 
      (prevIndex - 1 + videos.length) % videos.length
    );
  };

  // Toggle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    if (hasVideos) {
      const currentVideo = videoRefs.current[currentVideoIndex];
      if (currentVideo) {
        if (isPlaying) {
          currentVideo.pause();
        } else {
          currentVideo.play().catch(console.error);
        }
      }
    }
  };

  // Auto-rotate videos with longer duration - only when visible
  useEffect(() => {
    if (!isLoading && isPlaying && hasVideos && isVisible) {
      const interval = setInterval(() => {
        console.log('Auto-rotating to next video');
        setCurrentVideoIndex((prevIndex) => 
          (prevIndex + 1) % videos.length
        );
      }, 8000); // Change video every 8 seconds

      return () => clearInterval(interval);
    }
  }, [isLoading, videos.length, isPlaying, hasVideos, isVisible]);

  // Handle video playback when index changes
  useEffect(() => {
    if (hasVideos && !isLoading && isVisible) {
      // Pause all videos first
      videoRefs.current.forEach(video => {
        if (video) video.pause();
      });

      // Play current video
      const currentVideo = videoRefs.current[currentVideoIndex];
      if (currentVideo && isPlaying) {
        currentVideo.currentTime = 0; // Reset to beginning
        currentVideo.play().catch(error => {
          console.error(`Error playing video ${currentVideoIndex + 1}:`, error);
        });
      }
    }
  }, [currentVideoIndex, hasVideos, isLoading, isVisible, isPlaying]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full min-h-[700px] bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.15),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(168,85,247,0.05)_72deg,transparent_144deg)]"></div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mb-6"></div>
            <h3 className="text-white text-2xl font-bold mb-2">Loading Experience...</h3>
            <p className="text-gray-300 mb-4">Preparing your visual journey</p>
            <div className="w-80 bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-400 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(videosLoaded / videos.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-16 lg:py-24">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Where Passions
            <span className="block bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Come Alive
            </span>
          </h2>
          <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience the energy of real connections. Watch how IndulgeOut brings 
            hobby enthusiasts together in meaningful, unforgettable ways.
          </p>
        </div>

        {/* Video Display - Single Video Container */}
        <div className="relative">
          {/* Video Container - Single Video Display */}
          <div className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 via-green-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
            
            {/* Single Video Display Area */}
            <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
              
              {/* Current Video Display */}
              {hasVideos ? (
                <video
                  key={currentVideoIndex} // Force re-render on video change
                  ref={el => videoRefs.current[currentVideoIndex] = el}
                  className="w-full h-full object-contain"
                  autoPlay={isVisible && isPlaying}
                  muted
                  loop={false}
                  playsInline
                  preload="auto"
                  onEnded={handleVideoEnd}
                  onLoadedData={() => {
                    console.log(`Video ${currentVideoIndex + 1} loaded successfully`);
                  }}
                  onError={(e) => {
                    console.error(`Error loading video ${currentVideoIndex + 1}:`, e);
                  }}
                >
                  <source src={videos[currentVideoIndex].src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <PlaceholderVideo
                  index={currentVideoIndex}
                  className="w-full h-full"
                />
              )}
              
              {/* Video Overlay with Info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none">
                <div className="absolute bottom-8 left-8 text-white">
                  <div className="text-6xl mb-4 drop-shadow-lg">{videos[currentVideoIndex].icon}</div>
                  <h3 className="text-3xl font-bold mb-2 drop-shadow-lg">{videos[currentVideoIndex].title}</h3>
                  <p className="text-lg text-gray-200 drop-shadow-md">{videos[currentVideoIndex].description}</p>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={goToPrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-all duration-300 group"
              >
                <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-all duration-300 group"
              >
                <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Play/Pause Button */}
              <button 
                onClick={togglePlayback}
                className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-all duration-300 group"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center mt-8 space-x-3">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentVideoIndex 
                    ? 'bg-green-400 w-12 h-4' 
                    : 'bg-gray-600 hover:bg-gray-500 w-4 h-4'
                }`}
              />
            ))}
          </div>

          {/* Video Thumbnails */}
          <div className="flex justify-center mt-8 space-x-4">
            {videos.map((video, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                className={`relative group transition-all duration-300 rounded-xl overflow-hidden ${
                  index === currentVideoIndex 
                    ? 'ring-4 ring-green-400 scale-105' 
                    : 'hover:scale-105 hover:ring-2 hover:ring-white/50'
                }`}
              >
                <div className="w-24 h-16 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-2xl">{video.icon}</span>
                </div>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              </button>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-full px-8 py-4">
            <span className="text-white text-lg">Ready to join the experience?</span>
            <button className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:scale-105 transition-transform">
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute bottom-32 right-16 w-4 h-4 bg-green-400 rounded-full animate-bounce opacity-60"></div>
      <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-40"></div>
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse opacity-50"></div>
    </div>
  );
};

export default VideoAnimation;