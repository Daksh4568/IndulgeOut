import { X, Lock, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginPromptModal = ({ isOpen, onClose, eventTitle, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign in required</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {message || 'Sign in to register for this event'}
          </h3>

          {eventTitle && (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a free account to RSVP for <span className="font-semibold text-orange-500">"{eventTitle}"</span>
            </p>
          )}

          <div className="space-y-3">
            {/* Sign In Button */}
            <Link
              to="/login"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105"
            >
              <Lock className="h-5 w-5" />
              Sign In
            </Link>

            {/* Create Account Button */}
            <Link
              to="/register"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-full transition-all"
            >
              <UserPlus className="h-5 w-5" />
              Create Free Account
            </Link>
          </div>

          {/* Benefits */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Join IndulgeOut and:
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span>
                <span>RSVP to unlimited events</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span>
                <span>Join communities and connect</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span>
                <span>Get personalized recommendations</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span>
                <span>Host your own events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl text-center">
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
