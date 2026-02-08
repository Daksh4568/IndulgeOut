import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../config/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data.user); // Extract user from response.data.user
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Only remove token if it's an authentication error (401)
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
      // For other errors (network issues, 500, etc), keep the user logged in
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchUserProfile();
    }
  };

  const updateUserInterests = async (interests) => {
    try {
      const response = await api.put('/users/interests', { interests });
      // Extract the user object from the response
      setUser(response.data.user || response.data);
      return { success: true };
    } catch (error) {
      console.error('Error updating interests:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update interests' 
      };
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    refreshUser,
    updateUserInterests,
    isAuthenticated: !!user,
    // Legacy support: old 'community_member' role OR new host_partner system
    isCommunityMember: user?.role === 'community_member' || user?.role === 'host_partner',
    isHostPartner: user?.role === 'host_partner',
    isCommunityOrganizer: user?.role === 'host_partner' && user?.hostPartnerType === 'community_organizer',
    isVenue: user?.role === 'host_partner' && user?.hostPartnerType === 'venue',
    isBrandSponsor: user?.role === 'host_partner' && user?.hostPartnerType === 'brand_sponsor'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};