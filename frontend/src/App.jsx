import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastContainer } from './components/Toast'
import { useToast } from './hooks/useToast'
import ErrorBoundary from './components/ErrorBoundary'
import Homepage from './pages/Homepage'
import Login from './pages/Login'
import Register from './pages/Register'
import InterestSelection from './pages/InterestSelection'
import Dashboard from './pages/Dashboard'
import EventCreation from './pages/EventCreation'
import EventDiscovery from './pages/EventDiscovery'
import EventDetail from './pages/EventDetail'
import CommunityCreation from './pages/CommunityCreation'
import CommunityDiscovery from './pages/CommunityDiscovery'
import CommunityDetail from './pages/CommunityDetail'
import AnalyticsPage from './pages/AnalyticsPage'
import About from './pages/About'
import ExplorePage from './pages/ExplorePage'
import CategoriesPage from './pages/CategoriesPage'
import CategoryDetail from './pages/CategoryDetail'
import HostPartnerPage from './pages/HostPartnerPage'
import PaymentCallback from './pages/PaymentCallback'

// Create a toast context
export const ToastContext = React.createContext(null)

function App() {
  const toast = useToast()
  
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastContext.Provider value={toast}>
            <Router>
              <div className="App min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
                <Routes>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/category/:slug" element={<CategoryDetail />} />
                  <Route path="/host-partner" element={<HostPartnerPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/interests" element={<InterestSelection />} />
                  <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                  <Route path="/create-event" element={<ErrorBoundary><EventCreation /></ErrorBoundary>} />
                  <Route path="/events" element={<ErrorBoundary><EventDiscovery /></ErrorBoundary>} />
                  <Route path="/events/:id" element={<ErrorBoundary><EventDetail /></ErrorBoundary>} />
                  <Route path="/event/:id" element={<ErrorBoundary><EventDetail /></ErrorBoundary>} />
                  <Route path="/communities" element={<ErrorBoundary><CommunityDiscovery /></ErrorBoundary>} />
                  <Route path="/communities/:id" element={<ErrorBoundary><CommunityDetail /></ErrorBoundary>} />
                  <Route path="/community/create" element={<ErrorBoundary><CommunityCreation /></ErrorBoundary>} />
                  <Route path="/community/:id" element={<ErrorBoundary><CommunityDetail /></ErrorBoundary>} />
                  <Route path="/analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
                  <Route path="/payment-callback" element={<ErrorBoundary><PaymentCallback /></ErrorBoundary>} />
                </Routes>
                <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
              </div>
            </Router>
          </ToastContext.Provider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App