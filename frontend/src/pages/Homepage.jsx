import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Calendar, MapPin, Heart, Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

function Homepage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
      name: 'Sarah Chen',
      text: 'Found my hiking tribe through IndulgeOut. Best decision ever!',
      interest: 'Adventure & Outdoors'
    },
    {
      name: 'Mike Rodriguez',
      text: 'Amazing food events and met incredible people who share my passion.',
      interest: 'Sip & Savor'
    },
    {
      name: 'Emma Thompson',
      text: 'The art workshops here are fantastic. So many creative souls!',
      interest: 'Art & DIY'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom CSS for additional animations */}
      <style jsx>{`
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
        
        .floating-element {
          animation: float 3s ease-in-out infinite;
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
      `}</style>
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">IndulgeOut</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-blue-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className={`text-4xl md:text-6xl font-bold text-gray-900 mb-6 transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              Find Your Tribe,
              <br />
              <span className="text-primary-600 inline-block animate-pulse">Live Your Passions</span>
            </h1>
            <p className={`text-xl text-gray-600 mb-8 max-w-3xl mx-auto transform transition-all duration-1000 delay-300 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              Connect with like-minded people around food, music, sports, art, and experiences. 
              IndulgeOut brings communities together in the real world.
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center transform transition-all duration-1000 delay-500 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg text-lg font-semibold flex items-center justify-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg"
              >
                Join Community
                <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                to="/register?type=host"
                className="border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white px-8 py-3 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 hover:shadow-lg"
              >
                Host Events
              </Link>
            </div>
          </div>
        </div>
        
        {/* Subtle Floating Elements/Bubbles */}
        <div className="absolute top-20 left-10 animate-bounce">
          <div className="w-8 h-8 bg-primary-400 rounded-full opacity-20"></div>
        </div>
        <div className="absolute bottom-20 left-1/4 animate-bounce" style={{animationDelay: '1s'}}>
          <div className="w-4 h-4 bg-green-400 rounded-full opacity-25"></div>
        </div>
        
        {/* Strategically placed bubbles away from buttons */}
        <div className="absolute top-10 left-16 floating-element">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-blue-400 rounded-full opacity-15"></div>
        </div>
        <div className="absolute bottom-32 left-20 floating-element" style={{animationDelay: '1.5s'}}>
          <div className="w-7 h-7 bg-gradient-to-br from-green-300 to-teal-400 rounded-full opacity-18"></div>
        </div>
        <div className="absolute top-3/4 left-10 animate-bounce" style={{animationDelay: '2.2s'}}>
          <div className="w-5 h-5 bg-cyan-400 rounded-full opacity-20"></div>
        </div>
        
        {/* Small accent bubbles */}
        <div className="absolute top-1/3 left-1/5 animate-pulse" style={{animationDelay: '4s'}}>
          <div className="w-3 h-3 bg-rose-400 rounded-full opacity-25"></div>
        </div>
        <div className="absolute bottom-1/3 left-1/6 floating-element" style={{animationDelay: '2.8s'}}>
          <div className="w-4 h-4 bg-purple-400 rounded-full opacity-22"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`text-center transform transition-all duration-700 hover:scale-110 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{transitionDelay: `${800 + index * 200}ms`}}
              >
                <div className="text-4xl font-bold text-primary-600 mb-2 animate-pulse">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to find your community</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className={`text-center transform transition-all duration-700 hover:scale-105 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{transitionDelay: '1200ms'}}>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Interests</h3>
              <p className="text-gray-600">Select from food, sports, art, music, and more</p>
            </div>
            
            <div className={`text-center transform transition-all duration-700 hover:scale-105 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{transitionDelay: '1400ms'}}>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce" style={{animationDelay: '0.2s'}}>
                <Calendar className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Discover Events</h3>
              <p className="text-gray-600">Find events that match your passions</p>
            </div>
            
            <div className={`text-center transform transition-all duration-700 hover:scale-105 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{transitionDelay: '1600ms'}}>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce" style={{animationDelay: '0.4s'}}>
                <MapPin className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Join Locally</h3>
              <p className="text-gray-600">Meet people in your area</p>
            </div>
            
            <div className={`text-center transform transition-all duration-700 hover:scale-105 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{transitionDelay: '1800ms'}}>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce" style={{animationDelay: '0.6s'}}>
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Build Connections</h3>
              <p className="text-gray-600">Form lasting friendships</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interest Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Your Interests</h2>
            <p className="text-xl text-gray-600">Find your passion and connect with others</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interests.map((interest, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-105 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{transitionDelay: `${2000 + index * 150}ms`}}
              >
                <div className={`${interest.color} h-48 flex items-center justify-center text-6xl transform transition-transform duration-300 group-hover:scale-110`}>
                  <span className="animate-bounce" style={{animationDelay: `${index * 0.1}s`}}>
                    {interest.icon}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6 text-white transform transition-transform duration-300 group-hover:translate-y-0 translate-y-2">
                    <h3 className="text-xl font-bold mb-2">{interest.name}</h3>
                    <p className="text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {interest.description}
                    </p>
                  </div>
                </div>
                {/* Animated border */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-400 rounded-xl transition-all duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Community Says</h2>
            <p className="text-xl text-gray-600">Real stories from real people</p>
          </div>
          
          {/* Carousel Container */}
          <div className="relative max-w-4xl mx-auto">
            {/* Navigation Buttons */}
            <button 
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600 group-hover:text-primary-600 transition-colors duration-300" />
            </button>
            
            <button 
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
            >
              <ChevronRight className="h-6 w-6 text-gray-600 group-hover:text-primary-600 transition-colors duration-300" />
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
                    <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
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
                      <blockquote className="text-xl text-gray-700 text-center mb-8 italic font-medium leading-relaxed">
                        "{testimonial.text}"
                      </blockquote>
                      
                      {/* Author */}
                      <div className="text-center border-t pt-6">
                        <p className="font-bold text-xl text-gray-900 mb-2">{testimonial.name}</p>
                        <p className="text-primary-600 font-semibold text-lg">{testimonial.interest}</p>
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
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-1 mt-6">
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
      <section className="py-20 bg-primary-600 relative overflow-hidden">
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
            className={`inline-block bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
            style={{transitionDelay: '3900ms'}}
          >
            Get Started Today
          </Link>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-ping"></div>
        <div className="absolute bottom-10 right-20 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-12 h-12 bg-white bg-opacity-10 rounded-full animate-bounce"></div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">IndulgeOut</h3>
              <p className="text-gray-400">
                Connecting communities through shared interests and experiences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white">About</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white">How it Works</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/events" className="hover:text-white">Events</Link></li>
                <li><Link to="/groups" className="hover:text-white">Groups</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 IndulgeOut. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;