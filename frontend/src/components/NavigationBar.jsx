import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, X, Menu, User, Building2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import { useState } from 'react';

export default function NavigationBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get appropriate dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user) return '/dashboard';
    if (user.role === 'host_partner' && user.hostPartnerType === 'community_organizer') {
      return '/organizer/dashboard';
    } else if (user.role === 'host_partner' && user.hostPartnerType === 'venue') {
      return '/venue/dashboard';
    } else if (user.role === 'host_partner' && user.hostPartnerType === 'brand_sponsor') {
      return '/brand/dashboard';
    }
    return '/dashboard'; // Regular users
  };

  // Check if user should see Browse Venues/Sponsors buttons
  const canBrowseVenuesSponsors = () => {
    if (!user || user.role !== 'host_partner') return false;
    return user.hostPartnerType === 'community_organizer' || user.hostPartnerType === 'brand_sponsor';
  };

  return (
    <nav className="bg-white dark:bg-black shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 sm:h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <img 
                src="/images/indulgeout-logo.png" 
                alt="IndulgeOut" 
                className="h-12 sm:h-16 w-auto" 
              />
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-1 justify-center">
            {!user ? (
              // Logged OUT Navigation
              <>
                {/* Explore Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setExploreOpen(!exploreOpen)}
                    onBlur={() => setTimeout(() => setExploreOpen(false), 200)}
                    className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Explore
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {exploreOpen && (
                    <div 
                      className="absolute left-0 mt-2 w-48 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-2"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Link
                        to="/explore?tab=events"
                        onClick={() => setExploreOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        Events
                      </Link>
                      <Link
                        to="/explore?tab=communities"
                        onClick={() => setExploreOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        Communities
                      </Link>
                      <Link
                        to="/explore?tab=people"
                        onClick={() => setExploreOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        People
                      </Link>
                    </div>
                  )}
                </div>

                {/* Categories Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    onBlur={() => setTimeout(() => setCategoriesOpen(false), 200)}
                    className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Categories
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {categoriesOpen && (
                    <div 
                      className="absolute left-0 mt-2 w-48 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-2"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Link
                        to="/categories"
                        onClick={() => setCategoriesOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        All Categories
                      </Link>
                    </div>
                  )}
                </div>

                {/* Host & Partner */}
                <Link
                  to="/host-partner"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Host & Partner
                </Link>

                {/* About */}
                <Link
                  to="/about"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  About
                </Link>
              </>
            ) : (
              // Logged IN Navigation
              <>
                <Link
                  to={getDashboardRoute()}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/explore"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Explore
                </Link>
                
                {/* Browse Venues and Sponsors - Only for Community Organizers and Brands */}
                {canBrowseVenuesSponsors() && (
                  <>
                    <Link
                      to="/browse/venues"
                      className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Venues</span>
                    </Link>
                    <Link
                      to="/browse/sponsors"
                      className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Sponsors</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <DarkModeToggle />
            
            {!user ? (
              // Logged OUT Actions
              <>
                <Link
                  to="/login"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-semibold uppercase tracking-wide transition-colors"
                >
                  LOG IN /SIGN UP
                </Link>
              </>
            ) : (
              // Logged IN Actions
              <>
                <Link
                  to="/profile"
                  className="relative group"
                  title="Profile"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-2xl hover:scale-110 transition-transform duration-200 shadow-lg">
                    👤
                  </div>
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {!user ? (
                // Logged OUT Mobile Menu
                <>
                  {/* Explore Section */}
                  <div className="space-y-1">
                    <button
                      onClick={() => setExploreOpen(!exploreOpen)}
                      className="w-full flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                    >
                      Explore
                      <ChevronDown className={`h-4 w-4 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {exploreOpen && (
                      <div className="pl-4 space-y-1">
                        <Link
                          to="/explore?tab=events"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-sm"
                        >
                          Events
                        </Link>
                        <Link
                          to="/explore?tab=communities"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-sm"
                        >
                          Communities
                        </Link>
                        <Link
                          to="/explore?tab=people"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-sm"
                        >
                          People
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Categories Section */}
                  <div className="space-y-1">
                    <button
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      className="w-full flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                    >
                      Categories
                      <ChevronDown className={`h-4 w-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {categoriesOpen && (
                      <div className="pl-4 space-y-1">
                        <Link
                          to="/categories"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-sm"
                        >
                          All Categories
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/host-partner"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Host & Partner
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                  >
                    About
                  </Link>

                  {/* Mobile Auth Buttons */}
                  <div className="pt-4 space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-md text-base font-medium"
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              ) : (
                // Logged IN Mobile Menu
                <>
                  <Link
                    to={getDashboardRoute()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/explore"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Explore
                  </Link>
                  
                  {/* Browse Venues and Sponsors - Only for Community Organizers and Brands */}
                  {canBrowseVenuesSponsors() && (
                    <>
                      <Link
                        to="/browse/venues"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                      >
                        <Building2 className="h-5 w-5" />
                        <span>Browse Venues</span>
                      </Link>
                      <Link
                        to="/browse/sponsors"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                      >
                        <Sparkles className="h-5 w-5" />
                        <span>Browse Sponsors</span>
                      </Link>
                    </>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl">
                      👤
                    </div>
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
