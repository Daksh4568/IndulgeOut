import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Smart dashboard redirect component
 * Redirects to the appropriate dashboard based on user role
 */
const DashboardRedirect = () => {
  const { user, isAuthenticated } = useAuth();

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
