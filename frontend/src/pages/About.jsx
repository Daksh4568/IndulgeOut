import React, { useState } from 'react';
import NavigationBar from '../components/NavigationBar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const About = () => {
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [currentValueCard, setCurrentValueCard] = useState(0);

  const valueCards = [
    {
      title: 'Authenticity',
      description: 'Every host and venue partner goes through a thorough verification process. We only work with trusted community owners, venues and brands.',
      rotation: 'rotate-2'
    },
    {
      title: 'Inclusivity',
      description: 'Curate experiences to deliver accessible experiences across demographics, interests and budgets.',
      rotation: '-rotate-3'
    },
    {
      title: 'Simplicity',
      description: 'A smart, data-rich, and easy-to-use platform enabling unified event listings, seamless collaboration, and actionable performance insights.',
      rotation: 'rotate-1'
    }
  ];

  const nextCard = () => {
    setCurrentValueCard((prev) => (prev + 1) % valueCards.length);
  };

  const prevCard = () => {
    setCurrentValueCard((prev) => (prev - 1 + valueCards.length) % valueCards.length);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <NavigationBar />
      {/* Hero Section with Polaroids and Envelope */}
      <section className="py-20 bg-zinc-900 dark:bg-zinc-900 relative overflow-hidden">
        <div className="relative w-full max-w-6xl mx-auto">
          {/* Mobile Layout - Top Polaroids */}
          <div className="md:hidden flex gap-4 justify-center mb-8 z-30 relative">
            {/* Polaroid 1 - Top Left on Mobile */}
            <div className="transform -rotate-12 w-32">
              <div className="bg-white p-2 shadow-2xl">
                <img
                  src="/images/Media (10).jpg"
                  alt="Friends gathering"
                  className="w-full aspect-square object-cover"
                  onError={(e) => {
                    e.target.src = '/images/postercard1.jpg';
                  }}
                />
                <div className="h-6"></div>
              </div>
            </div>
            {/* Polaroid 2 - Top Right on Mobile */}
            <div className="transform rotate-12 w-32">
              <div className="bg-white p-2 shadow-2xl">
                <img
                  src="/images/Media (11).jpg"
                  alt="Event celebration"
                  className="w-full aspect-square object-cover"
                  onError={(e) => {
                    e.target.src = '/images/postercard2.jpg';
                  }}
                />
                <div className="h-6"></div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Polaroids: 2 Left, 2 Right (No Overlap) */}
          <div className="hidden md:block absolute inset-0 z-10">
            <div className="h-full w-full flex justify-between px-6 lg:px-10 pt-4 pb-6 -mt-12">
              {/* Left Column */}
              <div className="flex flex-col justify-between items-start">
                {/* Polaroid 1 - Top Left */}
                <div className="transform -rotate-12 w-36 lg:w-40 xl:w-44">
                  <div className="bg-white p-3 shadow-2xl">
                    <img
                      src="/images/Media (10).jpg"
                      alt="Friends gathering"
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        e.target.src = '/images/postercard1.jpg';
                      }}
                    />
                    <div className="h-10"></div>
                  </div>
                </div>

                {/* Polaroid 2 - Bottom Left */}
                <div className="transform rotate-6 w-36 lg:w-40 xl:w-44">
                  <div className="bg-white p-3 shadow-2xl">
                    <img
                      src="/images/Media (11).jpg"
                      alt="Community event"
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        e.target.src = '/images/postercard2.jpg';
                      }}
                    />
                    <div className="h-10"></div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col justify-between items-end">
                {/* Polaroid 3 - Top Right */}
                <div className="transform rotate-12 w-36 lg:w-40 xl:w-44">
                  <div className="bg-white p-3 shadow-2xl">
                    <img
                      src="/images/Media (12).jpg"
                      alt="Event celebration"
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        e.target.src = '/images/postercard3.jpg';
                      }}
                    />
                    <div className="h-10"></div>
                  </div>
                </div>

                {/* Polaroid 4 - Bottom Right */}
                <div className="transform -rotate-6 w-36 lg:w-40 xl:w-44">
                  <div className="bg-white p-3 shadow-2xl">
                    <img
                      src="/images/Media (13).jpg"
                      alt="Happy attendees"
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        e.target.src = '/images/postercard4.jpg';
                      }}
                    />
                    <div className="h-10"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Envelope in Center */}
          <div className="relative z-20 flex flex-col items-center justify-center md:mt-0">
            {/* Tap here bubble with arrow - Figma style */}
            <div className="relative mb-8 md:block hidden">
              <div className="relative">
                {/* Speech bubble */}
                <div className="bg-gray-800 px-6 py-3 rounded-full text-sm font-medium border-2 border-gray-600 relative">
                  <span className="italic">tap here !</span>
                  {/* Bubble tail pointing down-left */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-800 border-b-2 border-l-2 border-gray-600 rotate-45"></div>
                </div>
                {/* Curved arrow pointing to envelope */}
                <svg className="absolute top-full left-1/2 transform translate-x-8 translate-y-1 w-20 h-20" viewBox="0 0 100 100">
                  <path d="M20,10 Q40,20 50,40 T60,70" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
                  <path d="M60,70 L55,65 M60,70 L65,68" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
                </svg>
              </div>
            </div>

            <div
              onClick={() => setIsLetterOpen(true)}
              className="relative w-64 h-44 md:w-80 md:h-56 cursor-pointer transform hover:scale-105 transition-transform duration-300"
            >
              {/* Envelope */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4B896] via-[#E5D4B8] to-[#C9B088] rounded-lg shadow-2xl border border-[#B89968]">
                {/* Envelope Flap Triangle - Creates the folded look */}
                <div className="absolute top-0 left-0 right-0 h-24 md:h-32" style={{ clipPath: 'polygon(0 0, 50% 60%, 100% 0)' }}>
                  <div className="w-full h-full bg-gradient-to-br from-[#C9B088] to-[#D4B896]"></div>
                  {/* Shadow overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10"></div>
                </div>
                
                {/* Diagonal crease lines with shadow */}
                <svg className="absolute top-0 left-0 w-full h-24 md:h-32 pointer-events-none" preserveAspectRatio="none">
                  {/* Darker shadow lines for more depth */}
                  <line x1="0" y1="0" x2="50%" y2="60%" stroke="#8B7355" strokeWidth="2" opacity="0.5" />
                  <line x1="100%" y1="0" x2="50%" y2="60%" stroke="#8B7355" strokeWidth="2" opacity="0.5" />
                  {/* Lighter highlight lines */}
                  <line x1="0" y1="0" x2="50%" y2="60%" stroke="#A68A5C" strokeWidth="1" opacity="0.3" />
                  <line x1="100%" y1="0" x2="50%" y2="60%" stroke="#A68A5C" strokeWidth="1" opacity="0.3" />
                </svg>
                
                {/* Bottom edge shadow of flap */}
                <div className="absolute top-[14%] md:top-[18%] left-0 right-0 h-1 md:h-1.5 bg-gradient-to-r from-transparent via-black/15 to-transparent" style={{ clipPath: 'polygon(10% 0, 50% 100%, 90% 0)' }}></div>
                
                {/* Envelope Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-handwriting text-gray-800 italic">For you, from us!</p>
                    {/* Smile emoji with eyes */}
                    <div className="mt-3 md:mt-4 relative">
                      <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto" viewBox="0 0 100 80">
                        {/* Eyes (two dots) */}
                        <circle cx="35" cy="25" r="2.5" fill="#1f2937" />
                        <circle cx="65" cy="25" r="2.5" fill="#1f2937" />
                        {/* Smile curve */}
                        <path d="M20,35 Q50,60 80,35" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Bottom Polaroids */}
            <div className="md:hidden mt-12 flex gap-4 justify-center z-30 relative">
              {/* Polaroid 3 - Bottom Left on Mobile */}
              <div className="transform rotate-6 w-32">
                <div className="bg-white p-2 shadow-2xl">
                  <img
                    src="/images/Media (12).jpg"
                    alt="Community event"
                    className="w-full aspect-square object-cover"
                    onError={(e) => {
                      e.target.src = '/images/postercard3.jpg';
                    }}
                  />
                  <div className="h-6"></div>
                </div>
              </div>
              {/* Polaroid 4 - Bottom Right on Mobile */}
              <div className="transform -rotate-6 w-32">
                <div className="bg-white p-2 shadow-2xl">
                  <img
                    src="/images/Media (13).jpg"
                    alt="Happy attendees"
                    className="w-full aspect-square object-cover"
                    onError={(e) => {
                      e.target.src = '/images/postercard4.jpg';
                    }}
                  />
                  <div className="h-6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Purpose Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">Our Purpose</h2>
          <p className="text-gray-400 text-center mb-16 max-w-3xl mx-auto">
            Great offline experiences exist—but discovery, access, and collaboration remain fragmented and we bring them together.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center justify-items-center">
            {/* Card 1 - Curated Offline Experiences */}
            <div className="relative w-full max-w-lg transform -rotate-3 hover:rotate-0 transition-all duration-300">
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold mb-4">Curated Offline Experiences</h3>
                <p className="text-gray-400 mb-6">
                  Discover intimate, local events, workshops, and pop-ups that help you truly connect, beyond your usual offer.
                </p>
                <button 
                  className="text-white px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-bold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
                  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                >
                  EXPLORE NOW
                </button>
                <div className="mt-6">
                  <img
                    src="/images/Media (10).jpg"
                    alt="Curated experiences"
                    className="w-full h-72 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = '/images/postercard1.jpg';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2 - Create & Collaborate */}
            <div className="relative w-full max-w-lg transform rotate-3 hover:rotate-0 transition-all duration-300">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 shadow-2xl border-2 border-gray-800">
                <h3 className="text-2xl font-bold mb-4">Create & Collaborate</h3>
                <p className="text-gray-400 mb-6">
                  List events seamlessly and collaborate with the right partners to deliver better offline experiences.
                </p>
                <button 
                  className="text-white px-8 sm:px-12 py-3 sm:py-2 rounded-md text-base sm:text-lg font-bold transform hover:scale-105 hover:opacity-90 transition-all duration-300 shadow-2xl"
                  style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                >
                  EXPLORE NOW
                </button>
                <div className="mt-6">
                  <img
                    src="/images/Media (11).jpg"
                    alt="Collaboration"
                    className="w-full h-72 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = '/images/postercard2.jpg';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">Our Values</h2>
          <p className="text-gray-400 text-center mb-16">
            We believe in simplicity—built with authenticity and inclusivity at the core.
          </p>

          {/* Desktop Layout */}
          <div className="hidden md:block space-y-12">
            {/* Authenticity Card - Top Center */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-lg transform rotate-2 hover:rotate-0 transition-all duration-300">
                <div className="bg-gradient-to-br from-[#E5D4B8] to-[#D4B896] text-gray-900 rounded-lg p-8 shadow-xl">
                  {/* Tape Effect */}
                  <div className="absolute -top-4 left-8 w-24 h-8 bg-[#C9B088] opacity-60 transform -rotate-12"></div>
                  
                  <h3 className="text-2xl font-bold mb-4 italic">Authenticity</h3>
                  <p className="text-gray-700 italic leading-relaxed">
                    Every host and venue partner goes through a thorough verification process. We only work with trusted community owners, venues and brands.
                  </p>
                </div>
              </div>
            </div>

            {/* Inclusivity and Simplicity Cards - Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Inclusivity Card */}
              <div className="relative transform -rotate-3 hover:rotate-0 transition-all duration-300">
                <div className="bg-gradient-to-br from-[#E5D4B8] to-[#D4B896] text-gray-900 rounded-lg p-8 shadow-xl h-full min-h-[200px]">
                  {/* Tape Effect */}
                  <div className="absolute -top-4 left-8 w-24 h-8 bg-[#C9B088] opacity-60 transform rotate-6"></div>
                  
                  <h3 className="text-2xl font-bold mb-4 italic">Inclusivity</h3>
                  <p className="text-gray-700 italic leading-relaxed">
                    Curate experiences to deliver accessible experiences across demographics, interests and budgets.
                  </p>
                </div>
              </div>

              {/* Simplicity Card */}
              <div className="relative transform rotate-1 hover:rotate-0 transition-all duration-300">
                <div className="bg-gradient-to-br from-[#E5D4B8] to-[#D4B896] text-gray-900 rounded-lg p-8 shadow-xl h-full min-h-[200px]">
                  {/* Tape Effect */}
                  <div className="absolute -top-4 right-8 w-24 h-8 bg-[#C9B088] opacity-60 transform -rotate-6"></div>
                  
                  <h3 className="text-2xl font-bold mb-4 italic">Simplicity</h3>
                  <p className="text-gray-700 italic leading-relaxed">
                    A smart, data-rich, and easy-to-use platform enabling unified event listings, seamless collaboration, and actionable performance insights.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden relative">
            <div className="flex justify-center items-center">
              <button
                onClick={prevCard}
                className="absolute left-0 z-10 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="w-full max-w-sm px-12">
                <div className="relative transform transition-all duration-300">
                  <div className="bg-gradient-to-br from-[#E5D4B8] to-[#D4B896] text-gray-900 rounded-lg p-8 shadow-xl">
                    {/* Tape Effect */}
                    <div className="absolute -top-4 left-8 w-24 h-8 bg-[#C9B088] opacity-60 transform -rotate-12"></div>
                    
                    <h3 className="text-2xl font-bold mb-4 italic">{valueCards[currentValueCard].title}</h3>
                    <p className="text-gray-700 italic leading-relaxed">
                      {valueCards[currentValueCard].description}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={nextCard}
                className="absolute right-0 z-10 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {valueCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentValueCard(index)}
                  style={{
                    width: '8px',
                    height: '8px',
                    minWidth: '8px',
                    minHeight: '8px',
                    padding: 0
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    index === currentValueCard ? 'bg-[#C9B088]' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Letter Modal */}
      {isLetterOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setIsLetterOpen(false)}>
          <div className="relative w-full max-w-4xl md:max-w-4xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setIsLetterOpen(false)}
              className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 bg-[#C9B088] rounded-full flex items-center justify-center text-xl md:text-2xl font-bold hover:bg-[#B89968] transition-colors z-10 shadow-xl"
            >
              ×
            </button>

            {/* Letter Content */}
            <div className="bg-gradient-to-br from-[#E5D4B8] via-[#D4B896] to-[#C9B088] rounded-xl p-6 md:p-16 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Paper Texture Overlay */}
              <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')]"></div>

              <div className="relative space-y-4 md:space-y-6 text-gray-800">
                <p className="text-sm md:text-lg leading-relaxed italic">
                  <span className="font-bold">Loneliness</span> has quietly become a part of modern urban life. Between work, studies, moving cities, and constantly being "busy," genuine connection often slips into the background—and over time, that starts to feel normal.
                </p>

                <p className="text-sm md:text-lg leading-relaxed italic">
                  <span className="font-bold">IndulgeOut was born from a simple realisation: this isn't an individual problem, it's a collective one.</span> And the solution isn't more screens—it's shared offline experiences.
                </p>

                <p className="text-sm md:text-lg leading-relaxed italic">
                  Having seen how music, art, movement, games, and culture naturally bring people together, <span className="font-bold">IndulgeOut is building an offline experience ecosystem where people connect through what they love.</span> From art and wellness to sports, board games, movies, and beyond—we enable community building where shared interests turn into lasting circles.
                </p>

                <p className="text-xl md:text-4xl leading-relaxed font-bold my-6 md:my-8 italic">
                  "Today, IndulgeOut is building a platform that connects people, communities, venues, and brands offline—simplifying collaboration for partners and elevating experiences for attendees."
                </p>

                <p className="text-sm md:text-lg leading-relaxed italic">
                  Because everyone deserves a place—and people—to belong to.<br />
                  And the goal is simple: <span className="font-bold">fewer lonely faces</span> around us.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default About;
