import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  allowedHostPartnerTypes = [],
}) => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // For host_partner role, check hostPartnerType if specified
  if (user.role === "host_partner" && allowedHostPartnerTypes.length > 0) {
    if (!allowedHostPartnerTypes.includes(user.hostPartnerType)) {
      // Redirect to appropriate dashboard based on their type
      if (user.hostPartnerType === "venue") {
        return <Navigate to="/venue/dashboard" replace />;
      } else if (user.hostPartnerType === "brand_sponsor") {
        return <Navigate to="/brand/dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // User is authorized, render the protected content
  return children;
};

export default ProtectedRoute;
