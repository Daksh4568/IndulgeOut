import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, MapPin, ChevronLeft } from 'lucide-react';

const B2BTypeSelection = () => {
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
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Account Type
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center mb-4">
            <div className="px-4 py-1.5 rounded-full border bg-purple-500/10" style={{ borderColor: '#7878E9' }}>
              <span className="text-xs font-medium tracking-wider" style={{ color: '#7878E9' }}>STEP 2 OF 2</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Select Your Business Type
          </h1>
          <p className="text-gray-300 text-center text-sm mb-8">
            Choose the category that best represents your business
          </p>
          {/* Business Type Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Host Card */}
            <button
              onClick={() => navigate('/signup/host')}
              className="group rounded-2xl p-5 transition-all duration-300 border"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#7878E9')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            >
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 
                className="text-lg font-bold text-white text-center mb-1.5"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Host
              </h3>

              {/* Subtitle */}
              <p className="text-gray-400 text-center mb-3 text-xs">
                List and organize offline experiences
              </p>

              {/* Features */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#7878E9' }} />
                  <p className="text-gray-300 text-xs">List, monetise and manage events</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#7878E9' }} />
                  <p className="text-gray-300 text-xs">Partner with brands & venues</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#7878E9' }} />
                  <p className="text-gray-300 text-xs">Analyse & get insights on event performance</p>
                </div>
              </div>
            </button>

            {/* Brand Card */}
            <button
              onClick={() => navigate('/signup/brand')}
              className="group rounded-2xl p-5 transition-all duration-300 border"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#7878E9')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            >
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 
                className="text-lg font-bold text-white text-center mb-1.5"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Brand
              </h3>

              {/* Subtitle */}
              <p className="text-gray-400 text-center mb-3 text-xs">
                List your brand for experiential marketing
              </p>

              {/* Features */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#7878E9' }} />
                  <p className="text-gray-300 text-xs">Access offline event partnerships</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#7878E9' }} />
                  <p className="text-gray-300 text-xs">Partner with interest-led communities</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#7878E9' }} />
                  <p className="text-gray-300 text-xs">Engage with high-intent audience</p>
                </div>
              </div>
            </button>

            {/* Venue Card */}
            <button
              onClick={() => navigate('/signup/venue')}
              className="group rounded-2xl p-5 transition-all duration-300 border"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#7878E9')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            >
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 
                className="text-lg font-bold text-white text-center mb-1.5"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Venue
              </h3>

              {/* Subtitle */}
              <p className="text-gray-400 text-center mb-3 text-xs">
                List your space for events
              </p>

              {/* Features */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#7878E9' }} />
                  <p className="text-gray-300 text-xs">Host community-led events</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#7878E9' }} />
                  <p className="text-gray-300 text-xs">Access newer and increased footfall</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#7878E9' }} />
                  <p className="text-gray-300 text-xs">Get increased revenue opportunities</p>
                </div>
              </div>
            </button>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => navigate('/signup/host')}
            className="w-full text-white font-bold py-3.5 rounded-lg transition-all duration-300"
            style={{ 
              background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
              fontFamily: 'Oswald, sans-serif',
            }}
          >
            Continue
          </button>
            </div>
          </div>
        </div>
  );
};

export default B2BTypeSelection;
