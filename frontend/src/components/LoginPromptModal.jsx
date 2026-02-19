import { X, Lock, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginPromptModal = ({ isOpen, onClose, eventTitle, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Sign in required</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
            <Lock className="h-8 w-8 text-white" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-3">
            {message || 'Sign in to register for this event'}
          </h3>

          {eventTitle && (
            <p className="text-gray-300 mb-6">
              Create a free account to RSVP for <span className="font-semibold" style={{ color: '#7878E9' }}>"{eventTitle}"</span>
            </p>
          )}

          <div className="space-y-3">
            {/* Sign In Button */}
            <Link
              to="/login"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105"
              style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
            >
              <Lock className="h-5 w-5" />
              Sign In
            </Link>

            {/* Create Account Button */}
            <Link
              to="/register"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-full transition-all"
            >
              <UserPlus className="h-5 w-5" />
              Create Free Account
            </Link>
          </div>

          {/* Benefits */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-3">
              Join IndulgeOut and:
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-green-500">✓</span>
                <span>RSVP to unlimited events</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-green-500">✓</span>
                <span>Join communities and connect</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-green-500">✓</span>
                <span>Get personalized recommendations</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-green-500">✓</span>
                <span>Host your own events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black rounded-b-2xl text-center">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
