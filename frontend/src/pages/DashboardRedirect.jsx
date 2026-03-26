import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Smart dashboard redirect component
 * Redirects to the appropriate dashboard based on user role
 */
const DashboardRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // Wait for auth to finish loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === 'host_partner') {
    // Redirect based on B2B type
    if (user.hostPartnerType === 'community_organizer') {
      return <Navigate to="/organizer/dashboard" replace />;
    } else if (user.hostPartnerType === 'venue') {
      return <Navigate to="/venue/dashboard" replace />;
    } else if (user.hostPartnerType === 'brand_sponsor') {
      return <Navigate to="/brand/dashboard" replace />;
    }
  }

  // Regular B2C user
  return <Navigate to="/user/dashboard" replace />;
};

export default DashboardRedirect;
