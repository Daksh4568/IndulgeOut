import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const DarkModeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
          : 'bg-gradient-to-r from-yellow-400 to-orange-500'
      } ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Toggle Background */}
      <div className="absolute inset-0 rounded-full bg-white dark:bg-gray-800 opacity-20"></div>
      
      {/* Sliding Circle */}
      <div
        className={`absolute w-5 h-5 rounded-full bg-white shadow-lg transform transition-all duration-300 flex items-center justify-center ${
          isDarkMode ? 'translate-x-3' : '-translate-x-3'
        }`}
      >
        {/* Icon */}
        {isDarkMode ? (
          <Moon className="w-3 h-3 text-indigo-600 animate-pulse" />
        ) : (
          <Sun className="w-3 h-3 text-orange-500 animate-spin" style={{animationDuration: '3s'}} />
        )}
      </div>
      
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1">
        <Sun className={`w-3 h-3 transition-opacity duration-300 ${
          isDarkMode ? 'opacity-30 text-white' : 'opacity-0'
        }`} />
        <Moon className={`w-3 h-3 transition-opacity duration-300 ${
          isDarkMode ? 'opacity-0' : 'opacity-30 text-white'
        }`} />
      </div>
    </button>
  );
};

export default DarkModeToggle;