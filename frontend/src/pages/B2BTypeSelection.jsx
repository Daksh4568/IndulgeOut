import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, MapPin, ChevronLeft } from 'lucide-react';

const B2BTypeSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Top Section - Pure Black */}
      <div className="w-full bg-black relative z-10 pt-4 pb-3 px-4">
        {/* Back Button */}
        <div className="max-w-4xl mx-auto mb-3">
          <button
            onClick={() => navigate('/signup')}
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Account Type
          </button>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-3">
            <img 
              src="/images/LogoFinal2.jpg" 
              alt="IndulgeOut" 
              className="h-10 w-auto object-contain" 
            />
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center mb-3">
            <div className="px-4 py-1.5 rounded-full border border-[#6366F1] bg-[#6366F1]/10">
              <span className="text-[#6366F1] text-xs font-medium tracking-wider">STEP 2 OF 2</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-1.5" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Select Your Business Type
          </h1>
        <p className="text-gray-300 text-center text-sm">
          Choose the category that best represents your business
        </p>
      </div>

      {/* Bottom Section - With Mirror Background */}
      <div className="flex-1 relative py-6">
        {/* Background with mirror effect */}
        <div className="absolute inset-0 flex">
          <div 
            className="w-1/2 h-full bg-cover bg-center"
            style={{
              backgroundImage: 'url(/images/BackgroundLogin.jpg)',
            }}
          />
          <div 
            className="w-1/2 h-full bg-cover bg-center"
            style={{
              backgroundImage: 'url(/images/BackgroundLogin.jpg)',
              transform: 'scaleX(-1)',
            }}
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/85" />

        {/* Content */}
        <div className="relative z-10 w-full">
          {/* Main Card - Centered */}
          <div className="max-w-4xl mx-auto px-4">
          <div 
            className="rounded-2xl p-4 md:p-6"
            style={{
              background: 'linear-gradient(180deg, rgba(217,217,217,0.02) 0%, rgba(115,115,115,0.04) 100%)',
              backdropFilter: 'blur(10px)',
            }}
          >
          {/* Business Type Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Host Card */}
            <button
              onClick={() => navigate('/signup/host')}
              className="group rounded-xl p-4 transition-all duration-300 border border-gray-700 hover:border-[#6366F1]"
              style={{
                background: 'linear-gradient(180deg, rgba(217,217,217,0.02) 0%, rgba(115,115,115,0.04) 100%)',
                backdropFilter: 'blur(10px)',
              }}
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
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-xs">List, monetise and manage events</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-xs">Partner with brands & venues</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-xs">Analyse & get insights on event performance</p>
                </div>
              </div>
            </button>

            {/* Brand Card */}
            <button
              onClick={() => navigate('/signup/brand')}
              className="group rounded-xl p-4 transition-all duration-300 border border-gray-700 hover:border-[#6366F1]"
              style={{
                background: 'linear-gradient(180deg, rgba(217,217,217,0.02) 0%, rgba(115,115,115,0.04) 100%)',
                backdropFilter: 'blur(10px)',
              }}
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
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-xs">Access offline event partnerships</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-xs">Partner with interest-led communities</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-xs">Engage with high-intent audience</p>
                </div>
              </div>
            </button>

            {/* Venue Card */}
            <button
              onClick={() => navigate('/signup/venue')}
              className="group rounded-xl p-4 transition-all duration-300 border border-gray-700 hover:border-[#6366F1]"
              style={{
                background: 'linear-gradient(180deg, rgba(217,217,217,0.02) 0%, rgba(115,115,115,0.04) 100%)',
                backdropFilter: 'blur(10px)',
              }}
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
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-xs">Host community-led events</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-xs">Access newer and increased footfall</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-xs">Get increased revenue opportunities</p>
                </div>
              </div>
            </button>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => navigate('/signup/host')}
            className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold py-3.5 rounded-lg transition-colors duration-300 uppercase"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            Continue
          </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default B2BTypeSelection;
