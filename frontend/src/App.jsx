import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Homepage from './pages/Homepage'
import Login from './pages/Login'
import Register from './pages/Register'
import InterestSelection from './pages/InterestSelection'
import Dashboard from './pages/Dashboard'
import EventCreation from './pages/EventCreation'
import EventDiscovery from './pages/EventDiscovery'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/interests" element={<InterestSelection />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-event" element={<EventCreation />} />
            <Route path="/events" element={<EventDiscovery />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App