import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Logo, Links, Copyright, Social */}
          <div className="flex flex-col space-y-5">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/images/indulgeout-logo.png" 
                alt="IndulgeOut" 
                className="h-10 w-auto" 
              />
              <span className="text-xl font-bold text-white">indulgeóut</span>
            </div>

            {/* Resources & Legal */}
            <div className="flex gap-16">
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link to="/how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms-conditions" className="text-gray-400 hover:text-white transition-colors text-sm">
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link to="/refunds-cancellations" className="text-gray-400 hover:text-white transition-colors text-sm">
                      Refunds & Cancellations
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright & Social Icons */}
            <div className="flex items-center gap-4">
              <p className="text-gray-400 text-xs">
                © 2026 IndulgeOut. All rights reserved.
              </p>
              <div className="flex space-x-2">
                <a 
                  href="https://facebook.com/indulgeout" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-7 h-7 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-all"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com/company/indulgeout" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-7 h-7 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-all"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a 
                  href="https://twitter.com/indulgeout" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-7 h-7 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-all"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Get the App */}
          <div className="flex flex-col items-end justify-start">
            {/* Get the App Container */}
            <div className="bg-gray-800/90 rounded-xl px-5 py-3 w-full max-w-sm">
              <h3 className="text-sm font-bold text-white text-center mb-0.5">Get the App</h3>
              <p className="text-gray-400 text-[9px] text-center mb-3">Download the App</p>
              <div className="flex gap-2">
                <a 
                  href="https://apps.apple.com/in/app/indulgeout/id6744292040"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-white hover:bg-gray-100 text-black px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-lg"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[8px] text-gray-600">Download the App</div>
                    <div className="text-xs font-semibold">App store</div>
                  </div>
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.anantexperiences.indulgeout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-white hover:bg-gray-100 text-black px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-lg"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[8px] text-gray-600">Get it on</div>
                    <div className="text-xs font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
