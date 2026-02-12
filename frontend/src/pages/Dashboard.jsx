import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Dashboard Router Component
 * Redirects users to their appropriate dashboard based on role and hostPartnerType
 */
const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Route based on user role and type
      if (user.role === "host_partner") {
        switch (user.hostPartnerType) {
          case "community_organizer":
            navigate("/organizer/dashboard", { replace: true });
            break;
          case "venue":
            navigate("/venue/dashboard", { replace: true });
            break;
          case "brand_sponsor":
            navigate("/brand/dashboard", { replace: true });
            break;
          default:
            navigate("/", { replace: true });
        }
      } else if (user.role === "user") {
        navigate("/user/dashboard", { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } else if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading spinner while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default Dashboard;
