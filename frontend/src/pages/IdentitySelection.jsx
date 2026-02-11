import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase } from 'lucide-react';

const IdentitySelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Image with Opacity and Blur */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-20 blur-sm"
        style={{
          backgroundImage: 'url(/images/BackgroundLogin.jpg)',
          zIndex: 0,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Logo - Outside Card */}
        <div className="mb-6">
          <button onClick={() => navigate('/')} className="focus:outline-none">
            <img 
              src="/images/LogoOrbital.png" 
              alt="IndulgeOut" 
              className="h-20 w-auto object-contain" 
            />
          </button>
        </div>
        {/* Glass Morphism Card */}
        <div 
          className="rounded-3xl p-8 border w-full"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Step Indicator */}
          <div className="flex justify-center mb-4">
            <div className="px-4 py-1.5 rounded-full border border-[#6366F1] bg-[#6366F1]/10">
              <span className="text-[#6366F1] text-xs font-medium tracking-wider">STEP 1 OF 2</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Choose Your Identity
          </h1>
          <p className="text-gray-300 text-center text-sm mb-8">
            Select the account type that describes your approach
          </p>
          {/* Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* B2C Option */}
            <button
              onClick={() => navigate('/signup/b2c')}
              className="group relative rounded-xl p-6 text-left transition-all duration-300 border border-gray-700 hover:border-[#6366F1]"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 
                className="text-2xl font-bold text-white text-center mb-2"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                B2C
              </h3>

              {/* Subtitle */}
              <p className="text-[#6366F1] text-center mb-4 text-xs font-semibold uppercase">
                CONSUMER
              </p>

              {/* Description */}
              <p className="text-gray-300 text-center mb-4 text-sm">
                Discover and attend offline experiences
              </p>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">Browse events across communities</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">Get exclusive community access</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">Connect with friends and like-minded people</p>
                </div>
              </div>
            </button>

            {/* B2B Option */}
            <button
              onClick={() => navigate('/signup/b2b-type')}
              className="group relative rounded-xl p-6 text-left transition-all duration-300 border border-gray-700 hover:border-[#6366F1]"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 
                className="text-2xl font-bold text-white text-center mb-2"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                B2B
              </h3>

              {/* Subtitle */}
              <p className="text-[#6366F1] text-center mb-4 text-xs font-semibold uppercase">
                BUSINESS PARTNER
              </p>

              {/* Description */}
              <p className="text-gray-300 text-center mb-4 text-sm">
                Create and Collaborate in meaningful high-quality offline experiences
              </p>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">List and sell tickets for events</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">Get curated footfall and community access</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">Brand your product and build a community for your business</p>
                </div>
              </div>
            </button>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => navigate('/signup/b2c')}
            className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold py-3.5 rounded-lg transition-colors duration-300 uppercase mb-4"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            Continue
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-[#6366F1] hover:text-[#5558E3] font-semibold transition-colors"
              >
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentitySelection;
