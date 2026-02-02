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
      <section className="relative min-h-screen flex items-center justify-center px-4 py-16 md:py-8">
        <div className="relative w-full max-w-6xl mx-auto">
          {/* Mobile Layout - Top Polaroids */}
          <div className="md:hidden absolute top-0 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
            {/* Polaroid 1 - Top Left on Mobile */}
            <div className="transform -rotate-12 w-32">
              <div className="bg-white p-2 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400"
                  alt="Friends gathering"
                  className="w-full aspect-square object-cover"
                />
                <div className="h-6"></div>
              </div>
            </div>
            {/* Polaroid 2 - Top Right on Mobile */}
            <div className="transform rotate-12 w-32">
              <div className="bg-white p-2 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=400"
                  alt="Event celebration"
                  className="w-full aspect-square object-cover"
                />
                <div className="h-6"></div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Left Polaroids */}
          <div className="hidden md:block">
            {/* Polaroid 1 - Top Left */}
            <div className="absolute top-0 left-[10%] transform -rotate-12 w-56 z-10">
              <div className="bg-white p-3 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400"
                  alt="Friends gathering"
                  className="w-full aspect-square object-cover"
                />
                <div className="h-12"></div>
              </div>
            </div>

            {/* Polaroid 2 - Bottom Left */}
            <div className="absolute top-[45%] left-[8%] transform rotate-6 w-56 z-10">
              <div className="bg-white p-3 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400"
                  alt="Community event"
                  className="w-full aspect-square object-cover"
                />
                <div className="h-12"></div>
              </div>
            </div>

            {/* Polaroid 3 - Top Right */}
            <div className="absolute top-0 right-[10%] transform rotate-12 w-56 z-10">
              <div className="bg-white p-3 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=400"
                  alt="Event celebration"
                  className="w-full aspect-square object-cover"
                />
                <div className="h-12"></div>
              </div>
            </div>

            {/* Polaroid 4 - Bottom Right */}
            <div className="absolute top-[45%] right-[8%] transform -rotate-6 w-56 z-10">
              <div className="bg-white p-3 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400"
                  alt="Happy attendees"
                  className="w-full aspect-square object-cover"
                />
                <div className="h-12"></div>
              </div>
            </div>
          </div>

          {/* Envelope in Center */}
          <div className="relative z-20 flex flex-col items-center justify-center mt-48 md:mt-0">
            <div className="relative mb-6 md:block hidden">
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-700 px-6 py-2 rounded-full text-sm font-medium border-2 border-gray-600">
                tap here !
              </div>
              <svg className="absolute -top-8 left-1/2 transform -translate-x-1/2 translate-x-12 w-16 h-16" viewBox="0 0 100 100">
                <path d="M10,50 Q30,30 50,50" stroke="white" strokeWidth="2" fill="none" />
                <path d="M50,50 L55,45 M50,50 L45,45" stroke="white" strokeWidth="2" fill="none" />
              </svg>
            </div>

            <div
              onClick={() => setIsLetterOpen(true)}
              className="relative w-64 h-44 md:w-80 md:h-56 cursor-pointer transform hover:scale-105 transition-transform duration-300"
            >
              {/* Envelope */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-yellow-100 to-amber-100 rounded-lg shadow-2xl border border-yellow-300">
                {/* Envelope Flap */}
                <div className="absolute top-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-br from-yellow-300 to-yellow-200 clip-triangle"></div>
                
                {/* Envelope Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-handwriting text-gray-800 italic">For you, from us!</p>
                    <div className="mt-2 md:mt-4">
                      <svg className="w-12 h-8 md:w-16 md:h-12 mx-auto" viewBox="0 0 100 50">
                        <path d="M10,10 Q30,30 50,15 Q70,30 90,10" stroke="#4b5563" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Bottom Polaroids */}
            <div className="md:hidden mt-12 flex gap-4 justify-center">
              {/* Polaroid 3 - Bottom Left on Mobile */}
              <div className="transform rotate-6 w-32">
                <div className="bg-white p-2 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400"
                    alt="Community event"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="h-6"></div>
                </div>
              </div>
              {/* Polaroid 4 - Bottom Right on Mobile */}
              <div className="transform -rotate-6 w-32">
                <div className="bg-white p-2 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400"
                    alt="Happy attendees"
                    className="w-full aspect-square object-cover"
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
            <div className="relative w-full max-w-md transform -rotate-3 hover:rotate-0 transition-all duration-300">
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold mb-4">Curated Offline Experiences</h3>
                <p className="text-gray-400 mb-6">
                  Discover intimate, local events, workshops, and pop-ups that help you truly connect, beyond your usual offer.
                </p>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Explore Now
                </button>
                <div className="mt-6">
                  <img
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600"
                    alt="Curated experiences"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Card 2 - Create & Collaborate */}
            <div className="relative w-full max-w-md transform rotate-3 hover:rotate-0 transition-all duration-300">
              <div className="bg-gradient-to-br from-white to-gray-100 text-gray-900 rounded-2xl p-8 shadow-2xl border-2 border-gray-300">
                <h3 className="text-2xl font-bold mb-4">Create & Collaborate</h3>
                <p className="text-gray-700 mb-6">
                  List events seamlessly and collaborate with the right partners to deliver better offline experiences.
                </p>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Explore Now
                </button>
                <div className="mt-6 relative">
                  <img
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600"
                    alt="Collaboration"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {/* Profile Badges Overlay */}
                  <div className="absolute -top-4 -right-4 flex items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-yellow-400 border-4 border-white flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold">A</span>
                    </div>
                    <div className="flex -space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-white shadow-lg"></div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-4 border-white shadow-lg"></div>
                    </div>
                  </div>
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
              <div className="relative w-full max-w-md transform rotate-2 hover:rotate-0 transition-all duration-300">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 text-gray-900 rounded-lg p-8 shadow-xl">
                  {/* Tape Effect */}
                  <div className="absolute -top-4 left-8 w-24 h-8 bg-yellow-200 opacity-60 transform -rotate-12"></div>
                  
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
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 text-gray-900 rounded-lg p-8 shadow-xl">
                  {/* Tape Effect */}
                  <div className="absolute -top-4 left-8 w-24 h-8 bg-yellow-200 opacity-60 transform rotate-6"></div>
                  
                  <h3 className="text-2xl font-bold mb-4 italic">Inclusivity</h3>
                  <p className="text-gray-700 italic leading-relaxed">
                    Curate experiences to deliver accessible experiences across demographics, interests and budgets.
                  </p>
                </div>
              </div>

              {/* Simplicity Card */}
              <div className="relative transform rotate-1 hover:rotate-0 transition-all duration-300">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 text-gray-900 rounded-lg p-8 shadow-xl">
                  {/* Tape Effect */}
                  <div className="absolute -top-4 right-8 w-24 h-8 bg-yellow-200 opacity-60 transform -rotate-6"></div>
                  
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
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 text-gray-900 rounded-lg p-8 shadow-xl">
                    {/* Tape Effect */}
                    <div className="absolute -top-4 left-8 w-24 h-8 bg-yellow-200 opacity-60 transform -rotate-12"></div>
                    
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
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentValueCard ? 'bg-yellow-400 w-8' : 'bg-gray-600'
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
              className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 bg-yellow-400 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold hover:bg-yellow-500 transition-colors z-10 shadow-xl"
            >
              ×
            </button>

            {/* Letter Content */}
            <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 rounded-xl p-6 md:p-16 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Paper Texture Overlay */}
              <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')]"></div>

              {/* Yellow Badge */}
              <div className="absolute top-4 right-4 md:-top-6 md:-right-6 md:top-8 md:right-8 w-12 h-12 md:w-16 md:h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                <span className="text-xl md:text-2xl font-bold">A</span>
              </div>

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
