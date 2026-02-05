import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastContainer } from './components/Toast'
import { useToast } from './hooks/useToast'
import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'
import Homepage from './pages/Homepage'
import OTPLogin from './pages/OTPLogin'
import Register from './pages/Register'
import IdentitySelection from './pages/IdentitySelection'
import B2CSignup from './pages/B2CSignup'
import B2BTypeSelection from './pages/B2BTypeSelection'
import HostSignup from './pages/HostSignup'
import BrandSignup from './pages/BrandSignup'
import VenueSignup from './pages/VenueSignup'
import InterestSelection from './pages/InterestSelection'
import { Navigate } from 'react-router-dom'
import EventCreation from './pages/EventCreation'
import EventDetail from './pages/EventDetailNew'
import CommunityCreation from './pages/CommunityCreation'
import CommunityDetail from './pages/CommunityDetail'
import AnalyticsPage from './pages/AnalyticsPage'
import About from './pages/About'
import ExplorePage from './pages/ExplorePage'
import Categories from './pages/Categories'
import CategoryDetail from './pages/CategoryDetail'
import HostPartnerPage from './pages/HostPartnerPage'
import PaymentCallback from './pages/PaymentCallback'
import VenueOnboarding from './pages/VenueOnboarding'
import BrandOnboarding from './pages/BrandOnboarding'
import CommunityOnboarding from './pages/CommunityOnboarding'
import CommunityOrganizerDashboard from './pages/CommunityOrganizerDashboard'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import BrowseVenues from './pages/BrowseVenues'
import BrowseSponsors from './pages/BrowseSponsors'
import BrowseCommunities from './pages/BrowseCommunities'
import VenueProfile from './pages/VenueProfile'
import BrandProfile from './pages/BrandProfile'
import RequestCollaboration from './pages/RequestCollaboration'
import CollaborationManagement from './pages/CollaborationManagement'
import AdminDashboard from './pages/AdminDashboard'
import VenueDashboard from './pages/VenueDashboard'
import BrandDashboard from './pages/BrandDashboard'
import UserDashboard from './pages/UserDashboard'
import EventReviewPage from './pages/EventReviewPage'
import ScanTickets from './pages/ScanTickets'
import EventAnalytics from './pages/EventAnalytics'
import ContactUs from './pages/ContactUs'
import TermsConditions from './pages/TermsConditions'
import RefundsCancellations from './pages/RefundsCancellations'
import NotificationCenter from './pages/NotificationCenter'

// Create a toast context
export const ToastContext = React.createContext(null)

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function AppContent() {
  const location = useLocation();
  const hideFooterPaths = ['/signup', '/signup/b2c', '/signup/b2b-type', '/signup/host', '/signup/brand', '/signup/venue', '/login', '/community-organizer-dashboard'];
  const shouldHideFooter = hideFooterPaths.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/notifications" element={<ErrorBoundary><NotificationCenter /></ErrorBoundary>} />
        <Route path="/refunds-cancellations" element={<RefundsCancellations />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:slug" element={<CategoryDetail />} />
        <Route path="/host-partner" element={<HostPartnerPage />} />
        
        {/* New Signup Flow */}
        <Route path="/signup" element={<IdentitySelection />} />
        <Route path="/signup/b2c" element={<B2CSignup />} />
        <Route path="/signup/b2b-type" element={<B2BTypeSelection />} />
        <Route path="/signup/host" element={<HostSignup />} />
        <Route path="/signup/brand" element={<BrandSignup />} />
        <Route path="/signup/venue" element={<VenueSignup />} />
        
        {/* Legacy Login/Register */}
        <Route path="/login" element={<OTPLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/interests" element={<InterestSelection />} />
        <Route path="/onboarding/venue" element={<ErrorBoundary><VenueOnboarding /></ErrorBoundary>} />
        <Route path="/onboarding/brand" element={<ErrorBoundary><BrandOnboarding /></ErrorBoundary>} />
        <Route path="/onboarding/community" element={<ErrorBoundary><CommunityOnboarding /></ErrorBoundary>} />
        <Route path="/organizer/dashboard" element={<ErrorBoundary><CommunityOrganizerDashboard /></ErrorBoundary>} />
        <Route path="/scan-tickets" element={<ErrorBoundary><ScanTickets /></ErrorBoundary>} />
        <Route path="/organizer/events/:eventId/analytics" element={<ErrorBoundary><EventAnalytics /></ErrorBoundary>} />
        <Route path="/venue/dashboard" element={<ErrorBoundary><VenueDashboard /></ErrorBoundary>} />
        <Route path="/brand/dashboard" element={<ErrorBoundary><BrandDashboard /></ErrorBoundary>} />
        <Route path="/user/dashboard" element={<ErrorBoundary><UserDashboard /></ErrorBoundary>} />
        <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
        <Route path="/create-event" element={<ErrorBoundary><EventCreation /></ErrorBoundary>} />
        <Route path="/edit-event/:id" element={<ErrorBoundary><EventCreation /></ErrorBoundary>} />
        <Route path="/events/:id" element={<ErrorBoundary><EventDetail /></ErrorBoundary>} />
        <Route path="/events/:eventId/review" element={<ErrorBoundary><EventReviewPage /></ErrorBoundary>} />
        <Route path="/event/:id" element={<ErrorBoundary><EventDetail /></ErrorBoundary>} />
        <Route path="/communities/:id" element={<ErrorBoundary><CommunityDetail /></ErrorBoundary>} />
        <Route path="/community/create" element={<ErrorBoundary><CommunityCreation /></ErrorBoundary>} />
        <Route path="/community/:id" element={<ErrorBoundary><CommunityDetail /></ErrorBoundary>} />
        <Route path="/analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
        <Route path="/payment-callback" element={<ErrorBoundary><PaymentCallback /></ErrorBoundary>} />
        <Route path="/browse/venues" element={<ErrorBoundary><BrowseVenues /></ErrorBoundary>} />
        <Route path="/browse/sponsors" element={<ErrorBoundary><BrowseSponsors /></ErrorBoundary>} />
        <Route path="/browse/communities" element={<ErrorBoundary><BrowseCommunities /></ErrorBoundary>} />
        <Route path="/venue/:id" element={<ErrorBoundary><VenueProfile /></ErrorBoundary>} />
        <Route path="/venue/:id/request-collaboration" element={<ErrorBoundary><RequestCollaboration /></ErrorBoundary>} />
        <Route path="/brand/:id" element={<ErrorBoundary><BrandProfile /></ErrorBoundary>} />
        <Route path="/brand/:id/propose-collaboration" element={<ErrorBoundary><RequestCollaboration /></ErrorBoundary>} />
        <Route path="/organizer/collaborations" element={<ErrorBoundary><CollaborationManagement /></ErrorBoundary>} />
        <Route path="/admin/dashboard" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
      </Routes>
      {!shouldHideFooter && (
        <>
          {/* Black Gap Before Footer */}
          <div className="bg-black py-8"></div>
          <Footer />
        </>
      )}
    </>
  );
}

function App() {
  const toast = useToast()
  
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastContext.Provider value={toast}>
              <Router>
                <ScrollToTop />
                <div className="App min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
                  <AppContent />
                  <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
                </div>
              </Router>
            </ToastContext.Provider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App