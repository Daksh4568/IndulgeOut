import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/interests" element={<InterestSelection />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-event" element={<EventCreation />} />
              <Route path="/events" element={<EventDiscovery />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/communities" element={<CommunityDiscovery />} />
              <Route path="/community/create" element={<CommunityCreation />} />
              <Route path="/community/:id" element={<CommunityDetail />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App